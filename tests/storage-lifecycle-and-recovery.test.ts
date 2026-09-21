import { describe, it, expect, beforeEach } from "vitest";
import { DatabaseSync } from "node:sqlite";
import * as fs from "node:fs";
import * as path from "node:path";
import { authorizeUpload } from "../packages/storage/src/uploads/authorize-upload";
import { completeUpload } from "../packages/storage/src/uploads/complete-upload";
import { MemoryObjectStore } from "../packages/storage/src/ports/memory-object-store";
import { D1MediaAssetRepository } from "../packages/database/src/repositories/media-asset.repository";
import type { DatabaseClient } from "../packages/database/src/client/d1";
import { StorageError } from "../packages/storage/src/errors/storage-error";

describe("Storage Upload Lifecycle, Authorization & Failure Recovery", () => {
  let db: DatabaseSync;
  let client: DatabaseClient;
  let mediaRepo: D1MediaAssetRepository;
  let objectStore: MemoryObjectStore;

  beforeEach(() => {
    db = new DatabaseSync(":memory:");
    db.exec("PRAGMA foreign_keys = ON;");

    const cfD1Dir = path.resolve(__dirname, "../infrastructure/cloudflare/d1");
    const migrationsDir = fs.existsSync(path.join(cfD1Dir, "migrations"))
      ? path.join(cfD1Dir, "migrations")
      : path.resolve(__dirname, "../database/migrations");

    const files = [
      "0001_identity.sql",
      "0002_vehicle_emergency.sql",
      "0003_qr_inventory.sql",
      "0004_media_assets.sql",
    ];

    for (const f of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, f), "utf8");
      db.exec(sql);
    }

    client = {
      async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
        return db.prepare(sql).all(...params) as T[];
      },
      async queryFirst<T>(sql: string, params: unknown[] = []): Promise<T | null> {
        const rows = db.prepare(sql).all(...params) as T[];
        return rows.length > 0 ? rows[0] : null;
      },
      async execute(sql: string, params: unknown[] = []): Promise<{ success: boolean; rowsAffected?: number }> {
        const result = db.prepare(sql).run(...params);
        return { success: true, rowsAffected: Number(result.changes) };
      },
      async batch(operations: Array<{ sql: string; params?: unknown[] }>): Promise<boolean> {
        for (const op of operations) {
          db.prepare(op.sql).run(...(op.params || []));
        }
        return true;
      },
    };

    mediaRepo = new D1MediaAssetRepository(client);
    objectStore = new MemoryObjectStore();
  });

  it("authorizes upload, persists initial UPLOADING metadata, and generates server-side key", async () => {
    const session = await authorizeUpload(
      {
        actor: { id: "usr_cust1", role: "CUSTOMER" },
        purpose: "USER_PROFILE_IMAGE",
        ownerType: "USER",
        ownerId: "usr_cust1",
        filename: "my_avatar.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 1024 * 50,
      },
      mediaRepo
    );

    expect(session.assetId).toMatch(/^asset_/);
    expect(session.bucket).toBe("PRIVATE");
    expect(session.objectKey).toBe(`users/usr_cust1/profile/${session.assetId}.jpg`);
    expect(session.maxSizeBytes).toBe(5 * 1024 * 1024);

    // Verify D1 state
    const saved = await mediaRepo.findById(session.assetId);
    expect(saved).not.toBeNull();
    expect(saved?.status).toBe("UPLOADING");
    expect(saved?.bucket).toBe("PRIVATE");
    expect(saved?.visibility).toBe("PRIVATE");
    expect(saved?.readyAt).toBeNull();
  });

  it("completes upload successfully when R2 object exists, transitioning to READY", async () => {
    // 1. Authorize
    const session = await authorizeUpload(
      {
        actor: { id: "usr_cust1", role: "CUSTOMER" },
        purpose: "VEHICLE_IMAGE",
        ownerType: "VEHICLE",
        ownerId: "veh_123",
        filename: "car.webp",
        mimeType: "image/webp",
        sizeBytes: 2048,
        entityOwnershipCheck: () => true,
      },
      mediaRepo
    );

    // 2. Client puts object into R2
    const dummyWebp = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0x20, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
    ]);
    await objectStore.put(session.objectKey, dummyWebp, {
      contentType: "image/webp",
    });

    // 3. Complete upload
    const readyAsset = await completeUpload(
      {
        assetId: session.assetId,
        actor: { id: "usr_cust1", role: "CUSTOMER" },
        magicBytes: dummyWebp,
        width: 800,
        height: 600,
      },
      mediaRepo,
      objectStore
    );

    expect(readyAsset.status).toBe("READY");
    expect(readyAsset.readyAt).not.toBeNull();
    expect(readyAsset.width).toBe(800);
    expect(readyAsset.height).toBe(600);
    expect(readyAsset.sizeBytes).toBe(dummyWebp.length);

    // Verify D1 is updated
    const d1Asset = await mediaRepo.findById(session.assetId);
    expect(d1Asset?.status).toBe("READY");
    expect(d1Asset?.readyAt).toBe(readyAsset.readyAt);
  });

  it("IDEMPOTENCY: Calling completeUpload twice returns ready asset without error or duplicate mutations", async () => {
    const session = await authorizeUpload(
      {
        actor: { id: "usr_cust1", role: "CUSTOMER" },
        purpose: "USER_PROFILE_IMAGE",
        ownerType: "USER",
        ownerId: "usr_cust1",
        filename: "avatar.png",
        mimeType: "image/png",
        sizeBytes: 1024,
      },
      mediaRepo
    );

    const dummyPng = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00,
    ]);
    await objectStore.put(session.objectKey, dummyPng, { contentType: "image/png" });

    // First completion
    const firstResult = await completeUpload(
      {
        assetId: session.assetId,
        actor: { id: "usr_cust1", role: "CUSTOMER" },
        magicBytes: dummyPng,
      },
      mediaRepo,
      objectStore
    );
    expect(firstResult.status).toBe("READY");

    // Second completion (idempotent call)
    const secondResult = await completeUpload(
      {
        assetId: session.assetId,
        actor: { id: "usr_cust1", role: "CUSTOMER" },
        magicBytes: dummyPng,
      },
      mediaRepo,
      objectStore
    );

    expect(secondResult.status).toBe("READY");
    expect(secondResult.id).toBe(firstResult.id);
    expect(secondResult.readyAt).toBe(firstResult.readyAt);
  });

  it("FAILURE SCENARIO 1: D1 success + R2 failure leaves asset in UPLOADING state (never READY)", async () => {
    // 1. Authorize succeeds in D1
    const session = await authorizeUpload(
      {
        actor: { id: "usr_cust1", role: "CUSTOMER" },
        purpose: "USER_PROFILE_IMAGE",
        ownerType: "USER",
        ownerId: "usr_cust1",
        filename: "avatar.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 4096,
      },
      mediaRepo
    );

    // 2. R2 upload fails or never happens (object not in store)
    // 3. CompleteUpload attempt must fail
    await expect(
      completeUpload(
        {
          assetId: session.assetId,
          actor: { id: "usr_cust1", role: "CUSTOMER" },
        },
        mediaRepo,
        objectStore
      )
    ).rejects.toThrowError(/UPLOAD_INCOMPLETE/);

    // 4. Invariant check: D1 asset remains in UPLOADING, NEVER READY
    const asset = await mediaRepo.findById(session.assetId);
    expect(asset?.status).toBe("UPLOADING");
    expect(asset?.readyAt).toBeNull();
  });

  it("FAILURE SCENARIO 2: R2 success + D1 failure is recoverable on retry", async () => {
    const session = await authorizeUpload(
      {
        actor: { id: "usr_cust1", role: "CUSTOMER" },
        purpose: "USER_PROFILE_IMAGE",
        ownerType: "USER",
        ownerId: "usr_cust1",
        filename: "avatar.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 1024,
      },
      mediaRepo
    );

    const dummyJpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    await objectStore.put(session.objectKey, dummyJpeg, { contentType: "image/jpeg" });

    // Simulate transient R2 head failure during first completion
    objectStore.failNextHead = true;
    await expect(
      completeUpload(
        {
          assetId: session.assetId,
          actor: { id: "usr_cust1", role: "CUSTOMER" },
        },
        mediaRepo,
        objectStore
      )
    ).rejects.toThrowError(/STORAGE_UNAVAILABLE/);

    // D1 is still UPLOADING
    let asset = await mediaRepo.findById(session.assetId);
    expect(asset?.status).toBe("UPLOADING");

    // Retry completion without error
    const recovered = await completeUpload(
      {
        assetId: session.assetId,
        actor: { id: "usr_cust1", role: "CUSTOMER" },
        magicBytes: dummyJpeg,
      },
      mediaRepo,
      objectStore
    );

    expect(recovered.status).toBe("READY");
    asset = await mediaRepo.findById(session.assetId);
    expect(asset?.status).toBe("READY");
  });

  it("quarantines asset and throws CHECKSUM_MISMATCH when SHA-256 does not match claimed hash", async () => {
    const claimedHash = "a1b2c3d4e5f678901234567890abcdef1234567890abcdef1234567890abcdef";
    const mismatchedHash = "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

    const session = await authorizeUpload(
      {
        actor: { id: "usr_cust1", role: "CUSTOMER" },
        purpose: "USER_PROFILE_IMAGE",
        ownerType: "USER",
        ownerId: "usr_cust1",
        filename: "avatar.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 1024,
        sha256: claimedHash,
      },
      mediaRepo
    );

    const dummyJpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    await objectStore.put(session.objectKey, dummyJpeg);

    await expect(
      completeUpload(
        {
          assetId: session.assetId,
          actor: { id: "usr_cust1", role: "CUSTOMER" },
          sha256: mismatchedHash, // Tampered / mismatched hash
        },
        mediaRepo,
        objectStore
      )
    ).rejects.toThrowError(/CHECKSUM_MISMATCH/);

    // Verify asset transitioned to QUARANTINED in D1
    const asset = await mediaRepo.findById(session.assetId);
    expect(asset?.status).toBe("QUARANTINED");
    expect(asset?.quarantinedAt).not.toBeNull();
  });

  it("quarantines asset when magic byte signature does not match declared MIME", async () => {
    const session = await authorizeUpload(
      {
        actor: { id: "usr_cust1", role: "CUSTOMER" },
        purpose: "USER_PROFILE_IMAGE",
        ownerType: "USER",
        ownerId: "usr_cust1",
        filename: "fake.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 1024,
      },
      mediaRepo
    );

    // Payload is ASCII text, not JPEG
    const fakeData = new TextEncoder().encode("Not a real jpeg file");
    await objectStore.put(session.objectKey, fakeData);

    await expect(
      completeUpload(
        {
          assetId: session.assetId,
          actor: { id: "usr_cust1", role: "CUSTOMER" },
          magicBytes: fakeData,
        },
        mediaRepo,
        objectStore
      )
    ).rejects.toThrowError(/INVALID_FILE_TYPE/);

    const asset = await mediaRepo.findById(session.assetId);
    expect(asset?.status).toBe("QUARANTINED");
  });

  it("IDOR DEFENSE: Customer A cannot authorize or complete uploads for Customer B's profile", async () => {
    // Customer A attempts to authorize upload for Customer B's profile
    await expect(
      authorizeUpload(
        {
          actor: { id: "usr_custA", role: "CUSTOMER" },
          purpose: "USER_PROFILE_IMAGE",
          ownerType: "USER",
          ownerId: "usr_custB", // Mismatched user ID
          filename: "hacked.jpg",
          mimeType: "image/jpeg",
          sizeBytes: 1024,
        },
        mediaRepo
      )
    ).rejects.toThrowError(/UPLOAD_NOT_AUTHORIZED/);

    // Legitimate authorization for Customer B
    const session = await authorizeUpload(
      {
        actor: { id: "usr_custB", role: "CUSTOMER" },
        purpose: "USER_PROFILE_IMAGE",
        ownerType: "USER",
        ownerId: "usr_custB",
        filename: "valid.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 1024,
      },
      mediaRepo
    );

    const dummyJpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    await objectStore.put(session.objectKey, dummyJpeg);

    // Customer A attempts to complete Customer B's upload
    await expect(
      completeUpload(
        {
          assetId: session.assetId,
          actor: { id: "usr_custA", role: "CUSTOMER" }, // Attacker actor
        },
        mediaRepo,
        objectStore
      )
    ).rejects.toThrowError(/UPLOAD_NOT_AUTHORIZED/);
  });
});
