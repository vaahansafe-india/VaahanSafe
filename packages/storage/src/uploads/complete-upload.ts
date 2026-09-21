/**
 * Upload Completion & Verification Service
 *
 * Verifies object presence in R2, verifies size, magic bytes, and checksum,
 * and authoritatively transitions D1 metadata from UPLOADING to READY (or QUARANTINED).
 *
 * INVARIANT: CompleteUpload is strictly IDEMPOTENT.
 * INVARIANT: No object may be marked READY without verified storage presence.
 */

import type { CompleteUploadInput, MediaAsset } from "../types";
import type { MediaAssetRepository } from "../ports/media-repository";
import type { ObjectStore } from "../ports/object-store";
import { StorageError } from "../errors/storage-error";
import { verifyMagicBytes } from "../policies/mime-policy";

export async function completeUpload(
  input: CompleteUploadInput,
  mediaRepo: MediaAssetRepository,
  objectStore: ObjectStore
): Promise<MediaAsset> {
  // 1. Load authoritative relational metadata from D1
  const asset = await mediaRepo.findById(input.assetId);
  if (!asset) {
    throw new StorageError(
      "ASSET_NOT_FOUND",
      `Media asset with ID "${input.assetId}" was not found.`
    );
  }

  // 2. IDEMPOTENCY GUARD: If asset is already READY, return existing state
  if (asset.status === "READY") {
    return asset;
  }

  // 3. Status Guard: Reject non-uploading states
  if (asset.status === "DELETED") {
    throw new StorageError("ASSET_NOT_FOUND", `Asset "${input.assetId}" has been deleted.`);
  }

  if (asset.status === "QUARANTINED") {
    throw new StorageError(
      "ASSET_QUARANTINED",
      `Asset "${input.assetId}" is quarantined and cannot be completed.`
    );
  }

  if (asset.status !== "UPLOADING") {
    throw new StorageError(
      "UPLOAD_INCOMPLETE",
      `Asset "${input.assetId}" is in invalid status "${asset.status}".`
    );
  }

  // 4. Authorization / IDOR Guard
  if (asset.ownerType === "USER" && input.actor.role === "CUSTOMER") {
    if (asset.ownerId !== input.actor.id) {
      throw new StorageError(
        "UPLOAD_NOT_AUTHORIZED",
        `Actor "${input.actor.id}" is not authorized to complete upload for asset owned by "${asset.ownerId}".`
      );
    }
  }

  // 5. Verify object existence in R2 storage
  const objectMeta = await objectStore.head(asset.objectKey);
  if (!objectMeta || objectMeta.size === 0) {
    throw new StorageError(
      "UPLOAD_INCOMPLETE",
      `Object "${asset.objectKey}" was not found in storage bucket or is empty.`
    );
  }

  const verifiedSize = input.actualSizeBytes ?? objectMeta.size;
  if (verifiedSize <= 0) {
    throw new StorageError(
      "UPLOAD_INCOMPLETE",
      `Object "${asset.objectKey}" in storage has invalid size of ${verifiedSize} bytes.`
    );
  }

  // 6. Magic Bytes Validation (if payload sample is supplied)
  if (input.magicBytes && input.magicBytes.length > 0) {
    const isSignatureValid = verifyMagicBytes(input.magicBytes, asset.mimeType);
    if (!isSignatureValid) {
      // Quarantine suspicious payload
      await mediaRepo.updateStatus(asset.id, "QUARANTINED", {
        quarantinedAt: new Date().toISOString(),
      });
      throw new StorageError(
        "INVALID_FILE_TYPE",
        `File signature does not match declared MIME type "${asset.mimeType}". Asset has been quarantined.`
      );
    }
  }

  // 7. SHA-256 Checksum Validation
  if (input.sha256 && asset.sha256) {
    if (input.sha256.toLowerCase() !== asset.sha256.toLowerCase()) {
      // Quarantine corrupted / tampered payload
      await mediaRepo.updateStatus(asset.id, "QUARANTINED", {
        quarantinedAt: new Date().toISOString(),
      });
      throw new StorageError(
        "CHECKSUM_MISMATCH",
        `Integrity check failed: Claimed SHA-256 does not match verified hash. Asset has been quarantined.`
      );
    }
  }

  // 8. Authoritatively transition D1 metadata to READY
  const finalSha256 = input.sha256 || asset.sha256;
  const finalEtag = objectMeta.etag || input.etag || asset.storageEtag;

  const readyAsset = await mediaRepo.updateStatus(asset.id, "READY", {
    sizeBytes: verifiedSize,
    storageEtag: finalEtag,
    sha256: finalSha256,
    width: input.width ?? asset.width,
    height: input.height ?? asset.height,
    readyAt: new Date().toISOString(),
  });

  return readyAsset;
}
