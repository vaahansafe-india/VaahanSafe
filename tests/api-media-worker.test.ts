import { describe, it, expect } from "vitest";
import { POST as authorizeHandler } from "../apps/api/app/v1/media/uploads/authorize/route";
import { POST as completeHandler } from "../apps/api/app/v1/media/uploads/[uploadId]/complete/route";
import { POST as serverUploadHandler } from "../apps/api/app/v1/media/uploads/server/route";
import { GET as getAssetHandler } from "../apps/api/app/v1/media/[assetId]/route";
import { getObjectStoreForBucket, getMediaAssetRepository } from "../apps/api/app/v1/media/_helpers";

describe("API Worker Media Endpoints & Security Boundary", () => {
  const mediaRepo = getMediaAssetRepository();
  const privateStore = getObjectStoreForBucket("PRIVATE");
  const publicStore = getObjectStoreForBucket("PUBLIC");

  it("POST /v1/media/uploads/server performs end-to-end server-mediated upload for small files", async () => {
    // Valid JPEG: FF D8 FF
    const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
    let binaryStr = "";
    for (let i = 0; i < jpegBytes.length; i++) {
      binaryStr += String.fromCharCode(jpegBytes[i]);
    }
    const dataBase64 = btoa(binaryStr);

    const req = new Request("https://api.vaahansafe.com/v1/media/uploads/server", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actor: { id: "usr_cust1", role: "CUSTOMER" },
        purpose: "USER_PROFILE_IMAGE",
        ownerType: "USER",
        ownerId: "usr_cust1",
        filename: "avatar.jpg",
        mimeType: "image/jpeg",
        dataBase64,
        altText: "Profile photo",
      }),
    });

    const res = await serverUploadHandler(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.status).toBe("READY");
    expect(json.data.bucket).toBe("PRIVATE");
    expect(json.data.objectKey).toContain("users/usr_cust1/profile/");

    // Verify object actually exists in R2 store
    const object = await privateStore.head(json.data.objectKey);
    expect(object).not.toBeNull();
    expect(object?.size).toBe(jpegBytes.length);
  });

  it("POST /v1/media/uploads/server rejects spoofed file signatures", async () => {
    // Payload claims to be JPEG but is plain text
    const textBytes = new TextEncoder().encode("Not a jpeg file");
    const dataBase64 = btoa(String.fromCharCode(...textBytes));

    const req = new Request("https://api.vaahansafe.com/v1/media/uploads/server", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actor: { id: "usr_cust1", role: "CUSTOMER" },
        purpose: "USER_PROFILE_IMAGE",
        ownerType: "USER",
        ownerId: "usr_cust1",
        filename: "fake.jpg",
        mimeType: "image/jpeg",
        dataBase64,
      }),
    });

    const res = await serverUploadHandler(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("INVALID_FILE_TYPE");
  });

  it("POST /v1/media/uploads/authorize issues direct upload ticket scoped to exact key", async () => {
    const req = new Request("https://api.vaahansafe.com/v1/media/uploads/authorize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actor: { id: "usr_cust1", role: "CUSTOMER" },
        purpose: "VEHICLE_IMAGE",
        ownerType: "VEHICLE",
        ownerId: "veh_100",
        filename: "car.webp",
        mimeType: "image/webp",
        sizeBytes: 1024 * 100,
      }),
    });

    const res = await authorizeHandler(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.assetId).toMatch(/^asset_/);
    expect(json.data.bucket).toBe("PRIVATE");
    expect(json.data.objectKey).toContain("vehicles/veh_100/");
    expect(json.data.uploadUrl).toContain(json.data.assetId);

    // Verify D1 record created with UPLOADING status
    const d1Asset = await mediaRepo.findById(json.data.assetId);
    expect(d1Asset?.status).toBe("UPLOADING");
  });

  it("POST /v1/media/uploads/:uploadId/complete verifies object and marks READY", async () => {
    // 1. Authorize
    const authReq = new Request("https://api.vaahansafe.com/v1/media/uploads/authorize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actor: { id: "usr_editor1", role: "CONTENT_EDITOR" },
        purpose: "BLOG_COVER",
        ownerType: "BLOG_POST",
        ownerId: "post_42",
        filename: "hero.png",
        mimeType: "image/png",
        sizeBytes: 2048,
      }),
    });

    const authRes = await authorizeHandler(authReq);
    const { data: ticket } = await authRes.json();

    // 2. Put bytes to R2
    const pngBytes = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00,
    ]);
    await publicStore.put(ticket.objectKey, pngBytes, { contentType: "image/png" });

    // 3. Complete
    const completeReq = new Request(
      `https://api.vaahansafe.com/v1/media/uploads/${ticket.assetId}/complete`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actor: { id: "usr_editor1", role: "CONTENT_EDITOR" },
          actualSizeBytes: pngBytes.length,
        }),
      }
    );

    const completeRes = await completeHandler(completeReq, {
      params: Promise.resolve({ uploadId: ticket.assetId }),
    });
    expect(completeRes.status).toBe(200);

    const json = await completeRes.json();
    expect(json.success).toBe(true);
    expect(json.data.status).toBe("READY");
    expect(json.data.visibility).toBe("PUBLIC");

    // 4. Test public GET /v1/media/:assetId
    const getReq = new Request(`https://api.vaahansafe.com/v1/media/${ticket.assetId}`);
    const getRes = await getAssetHandler(getReq, {
      params: Promise.resolve({ assetId: ticket.assetId }),
    });
    expect(getRes.status).toBe(200);

    const getJson = await getRes.json();
    expect(getJson.success).toBe(true);
    expect(getJson.data.id).toBe(ticket.assetId);
    expect(getJson.data.objectKey).toBe(ticket.objectKey);
  });

  it("GET /v1/media/:assetId returns 404 for PRIVATE or unready assets", async () => {
    // 1. Create a private ready asset
    const privateAsset = await mediaRepo.save({
      id: "asset_secret1",
      bucket: "PRIVATE",
      objectKey: "users/usr_1/profile/photo.jpg",
      ownerType: "USER",
      ownerId: "usr_1",
      visibility: "PRIVATE",
      mimeType: "image/jpeg",
      sizeBytes: 1024,
      status: "READY",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const req1 = new Request(`https://api.vaahansafe.com/v1/media/${privateAsset.id}`);
    const res1 = await getAssetHandler(req1, {
      params: Promise.resolve({ assetId: privateAsset.id }),
    });
    expect(res1.status).toBe(404);

    // 2. Create a public asset that is still UPLOADING
    const uploadingAsset = await mediaRepo.save({
      id: "asset_pending1",
      bucket: "PUBLIC",
      objectKey: "blog/post_1/asset_pending1.jpg",
      ownerType: "BLOG_POST",
      ownerId: "post_1",
      visibility: "PUBLIC",
      mimeType: "image/jpeg",
      sizeBytes: 1024,
      status: "UPLOADING",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const req2 = new Request(`https://api.vaahansafe.com/v1/media/${uploadingAsset.id}`);
    const res2 = await getAssetHandler(req2, {
      params: Promise.resolve({ assetId: uploadingAsset.id }),
    });
    expect(res2.status).toBe(404);
  });
});
