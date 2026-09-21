import { describe, it, expect } from "vitest";
import {
  getCacheControlHeader,
  getSafeDownloadHeaders,
  sanitizeHeaderFilename,
  getPublicAssetUrl,
  authorizePrivateDownload,
  StorageError,
} from "../packages/storage/src";
import type { MediaAsset } from "../packages/storage/src/types";
import { GET as downloadHandler } from "../apps/api/app/v1/media/[assetId]/download/route";
import { getMediaAssetRepository, getObjectStoreForBucket } from "../apps/api/app/v1/media/_helpers";

describe("Stage E — Secure Delivery, Cache Policy & Download Gateway", () => {
  const mediaRepo = getMediaAssetRepository();
  const privateStore = getObjectStoreForBucket("PRIVATE");

  describe("Cache-Control Policy Engine", () => {
    it("assigns 1-year immutable caching to PUBLIC + READY versioned assets", () => {
      const header = getCacheControlHeader({
        visibility: "PUBLIC",
        status: "READY",
        bucket: "PUBLIC",
      });
      expect(header).toBe("public, max-age=31536000, immutable");
    });

    it("assigns private, no-store/no-cache to PRIVATE assets", () => {
      const header = getCacheControlHeader({
        visibility: "PRIVATE",
        status: "READY",
        bucket: "PRIVATE",
      });
      expect(header).toContain("private");
      expect(header).toContain("no-store");
      expect(header).toContain("no-cache");
    });

    it("assigns private, no-store to EXPORT assets", () => {
      const header = getCacheControlHeader({
        visibility: "INTERNAL",
        status: "READY",
        bucket: "EXPORT",
      });
      expect(header).toContain("private");
      expect(header).toContain("no-store");
    });

    it("assigns no-store to unready, quarantined, or deleted assets", () => {
      const statuses: Array<"UPLOADING" | "QUARANTINED" | "DELETED"> = [
        "UPLOADING",
        "QUARANTINED",
        "DELETED",
      ];
      for (const st of statuses) {
        const header = getCacheControlHeader({
          visibility: "PUBLIC",
          status: st,
          bucket: "PUBLIC",
        });
        expect(header).toContain("no-store");
      }
    });
  });

  describe("Safe Download Headers & Anti-Sniffing Defenses", () => {
    it("sets X-Content-Type-Options: nosniff and safe Content-Type", () => {
      const headers = getSafeDownloadHeaders({
        mimeType: "application/pdf",
        filename: "statement.pdf",
        disposition: "attachment",
        visibility: "PRIVATE",
        status: "READY",
        bucket: "PRIVATE",
        contentLength: 4096,
      });

      expect(headers["X-Content-Type-Options"]).toBe("nosniff");
      expect(headers["Content-Type"]).toBe("application/pdf");
      expect(headers["Content-Length"]).toBe("4096");
      expect(headers["Content-Disposition"]).toContain("attachment;");
    });

    it("neutralizes CRLF injection and HTTP response splitting in filenames", () => {
      const maliciousFilename = "invoice.pdf\r\nSet-Cookie: session=hacked\r\nX-Injected: true";
      const { asciiName, encodedName } = sanitizeHeaderFilename(maliciousFilename);

      expect(asciiName.includes("\r")).toBe(false);
      expect(asciiName.includes("\n")).toBe(false);
      expect(encodedName.includes("\r")).toBe(false);
      expect(encodedName.includes("\n")).toBe(false);

      const headers = getSafeDownloadHeaders({
        mimeType: "application/pdf",
        filename: maliciousFilename,
        disposition: "attachment",
        visibility: "PRIVATE",
        status: "READY",
        bucket: "PRIVATE",
      });

      expect(headers["Content-Disposition"].includes("\r")).toBe(false);
      expect(headers["Content-Disposition"].includes("\n")).toBe(false);
      expect(headers["Content-Disposition"].includes("Set-Cookie")).toBe(false);
    });
  });

  describe("Public Asset URL Resolution", () => {
    it("resolves public URL for PUBLIC + READY assets", () => {
      const asset: MediaAsset = {
        id: "asset_pub1",
        bucket: "PUBLIC",
        objectKey: "blog/pst_1/hero.webp",
        ownerType: "BLOG_POST",
        ownerId: "pst_1",
        visibility: "PUBLIC",
        mimeType: "image/webp",
        sizeBytes: 1024,
        status: "READY",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const url = getPublicAssetUrl(asset);
      expect(url).toBe("https://assets.vaahansafe.com/blog/pst_1/hero.webp");
    });

    it("throws PRIVATE_ACCESS_DENIED when attempting to get public URL for private assets", () => {
      const privateAsset: MediaAsset = {
        id: "asset_priv1",
        bucket: "PRIVATE",
        objectKey: "users/usr_1/profile/photo.webp",
        ownerType: "USER",
        ownerId: "usr_1",
        visibility: "PRIVATE",
        mimeType: "image/webp",
        sizeBytes: 1024,
        status: "READY",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(() => getPublicAssetUrl(privateAsset)).toThrow(StorageError);
      expect(() => getPublicAssetUrl(privateAsset)).toThrowError(/PRIVATE_ACCESS_DENIED/);
    });

    it("throws ASSET_NOT_READY when attempting to get public URL for non-ready assets", () => {
      const unreadyAsset: MediaAsset = {
        id: "asset_pending1",
        bucket: "PUBLIC",
        objectKey: "gallery/gal_1/item.webp",
        ownerType: "GALLERY_ITEM",
        ownerId: "gal_1",
        visibility: "PUBLIC",
        mimeType: "image/webp",
        sizeBytes: 1024,
        status: "UPLOADING",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(() => getPublicAssetUrl(unreadyAsset)).toThrow(StorageError);
      expect(() => getPublicAssetUrl(unreadyAsset)).toThrowError(/ASSET_NOT_READY/);
    });
  });

  describe("Private Download Authorization & IDOR Protections", () => {
    it("authorizes download when actor owns the target asset", async () => {
      const asset = await mediaRepo.save({
        id: "asset_userA",
        bucket: "PRIVATE",
        objectKey: "users/usr_Alice/profile/asset_userA.jpg",
        ownerType: "USER",
        ownerId: "usr_Alice",
        visibility: "PRIVATE",
        mimeType: "image/jpeg",
        sizeBytes: 2048,
        status: "READY",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const authorized = await authorizePrivateDownload({
        assetId: asset.id,
        actor: { id: "usr_Alice", role: "CUSTOMER" },
        mediaRepo,
      });

      expect(authorized.id).toBe(asset.id);
      expect(authorized.status).toBe("READY");
    });

    it("IDOR DEFENSE: Denies download when Customer B requests Customer A's asset", async () => {
      const asset = await mediaRepo.save({
        id: "asset_userA2",
        bucket: "PRIVATE",
        objectKey: "users/usr_Alice/profile/asset_userA2.jpg",
        ownerType: "USER",
        ownerId: "usr_Alice",
        visibility: "PRIVATE",
        mimeType: "image/jpeg",
        sizeBytes: 2048,
        status: "READY",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // User Bob tries to download Alice's asset
      await expect(
        authorizePrivateDownload({
          assetId: asset.id,
          actor: { id: "usr_Bob", role: "CUSTOMER" },
          mediaRepo,
        })
      ).rejects.toThrowError(/PRIVATE_ACCESS_DENIED/);
    });

    it("denies customers attempting to download QR manufacturing print exports", async () => {
      const exportAsset = await mediaRepo.save({
        id: "asset_print_csv",
        bucket: "EXPORT",
        objectKey: "qr-batches/batch_99/print/asset_print_csv.csv",
        ownerType: "QR_BATCH",
        ownerId: "batch_99",
        visibility: "INTERNAL",
        mimeType: "text/csv",
        sizeBytes: 50000,
        status: "READY",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Customer attempt is denied
      await expect(
        authorizePrivateDownload({
          assetId: exportAsset.id,
          actor: { id: "usr_attacker", role: "CUSTOMER" },
          mediaRepo,
        })
      ).rejects.toThrowError(/PRIVATE_ACCESS_DENIED/);

      // Authorized Ops Manager succeeds
      const opsAuthorized = await authorizePrivateDownload({
        assetId: exportAsset.id,
        actor: { id: "usr_ops", role: "OPS_MANAGER" },
        mediaRepo,
      });
      expect(opsAuthorized.id).toBe(exportAsset.id);
    });

    it("rejects downloads of quarantined assets", async () => {
      const quarantined = await mediaRepo.save({
        id: "asset_quarantined",
        bucket: "PRIVATE",
        objectKey: "users/usr_Alice/profile/bad.jpg",
        ownerType: "USER",
        ownerId: "usr_Alice",
        visibility: "PRIVATE",
        mimeType: "image/jpeg",
        sizeBytes: 1024,
        status: "QUARANTINED",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await expect(
        authorizePrivateDownload({
          assetId: quarantined.id,
          actor: { id: "usr_Alice", role: "CUSTOMER" },
          mediaRepo,
        })
      ).rejects.toThrowError(/ASSET_QUARANTINED/);
    });
  });

  describe("API Worker Streaming Gateway (GET /v1/media/:assetId/download)", () => {
    it("streams private asset data with safe headers for authorized actor", async () => {
      // 1. Create asset in D1
      const asset = await mediaRepo.save({
        id: "asset_stream_test",
        bucket: "PRIVATE",
        objectKey: "users/usr_stream/profile/avatar.png",
        ownerType: "USER",
        ownerId: "usr_stream",
        visibility: "PRIVATE",
        mimeType: "image/png",
        sizeBytes: 4,
        status: "READY",
        originalFilename: "my_photo.png",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // 2. Put binary data in R2
      const binaryPayload = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
      await privateStore.put(asset.objectKey, binaryPayload, { contentType: "image/png" });

      // 3. Request download stream with actor credentials
      const req = new Request(
        `https://api.vaahansafe.com/v1/media/${asset.id}/download?disposition=attachment`,
        {
          method: "GET",
          headers: {
            "x-actor-id": "usr_stream",
            "x-actor-role": "CUSTOMER",
          },
        }
      );

      const res = await downloadHandler(req, {
        params: Promise.resolve({ assetId: asset.id }),
      });

      expect(res.status).toBe(200);
      expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(res.headers.get("Content-Type")).toBe("image/png");
      expect(res.headers.get("Content-Disposition")).toContain("attachment;");
      expect(res.headers.get("Cache-Control")).toContain("no-store");

      const streamedBytes = new Uint8Array(await res.arrayBuffer());
      expect(streamedBytes).toEqual(binaryPayload);
    });

    it("returns 403 when an unauthorized actor attempts streaming download", async () => {
      const asset = await mediaRepo.save({
        id: "asset_unauth_stream",
        bucket: "PRIVATE",
        objectKey: "users/usr_owner/profile/avatar.png",
        ownerType: "USER",
        ownerId: "usr_owner",
        visibility: "PRIVATE",
        mimeType: "image/png",
        sizeBytes: 4,
        status: "READY",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const req = new Request(
        `https://api.vaahansafe.com/v1/media/${asset.id}/download`,
        {
          method: "GET",
          headers: {
            "x-actor-id": "usr_hacker",
            "x-actor-role": "CUSTOMER",
          },
        }
      );

      const res = await downloadHandler(req, {
        params: Promise.resolve({ assetId: asset.id }),
      });

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("PRIVATE_ACCESS_DENIED");
    });
  });
});
