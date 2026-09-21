/**
 * Upload Authorization Service
 *
 * Enforces business authorization, purpose policies, server-side key generation,
 * and initializes the D1 media_assets record in UPLOADING status.
 *
 * INVARIANT: No asset may be uploaded without authoritative server authorization.
 * INVARIANT: Private data can never enter PUBLIC_STORAGE through client input.
 */

import type { AuthorizeUploadInput, AuthorizedUploadSession, MediaAsset } from "../types";
import type { MediaAssetRepository } from "../ports/media-repository";
import { validateUploadRequest } from "../policies/upload-policy";
import { generateAssetId, buildObjectKey, sanitizeDisplayFilename } from "../keys/object-key";
import { StorageError } from "../errors/storage-error";

export async function authorizeUpload(
  input: AuthorizeUploadInput,
  mediaRepo: MediaAssetRepository
): Promise<AuthorizedUploadSession> {
  // 1. Central policy validation (purpose, role, owner type, MIME, max size)
  const { policy, normalizedExt } = validateUploadRequest(input);

  // 2. Cross-user IDOR check: Verify actor ownership over target entity
  if (input.entityOwnershipCheck) {
    const isAuthorized = await input.entityOwnershipCheck(
      input.ownerType,
      input.ownerId,
      input.actor.id,
      input.actor.role
    );
    if (!isAuthorized) {
      throw new StorageError(
        "UPLOAD_NOT_AUTHORIZED",
        `Actor "${input.actor.id}" is not authorized to attach media to ${input.ownerType} "${input.ownerId}".`
      );
    }
  } else if (input.ownerType === "USER" && input.actor.role === "CUSTOMER") {
    // Default rule for Customer users: must match their own userId
    if (input.ownerId !== input.actor.id) {
      throw new StorageError(
        "UPLOAD_NOT_AUTHORIZED",
        `Customers can only upload media to their own profile. Target: "${input.ownerId}", Actor: "${input.actor.id}".`
      );
    }
  }

  // 3. Generate secure, opaque server-side asset identity and object key
  const assetId = generateAssetId();
  const sanitizedFilename = sanitizeDisplayFilename(input.filename);
  const objectKey = buildObjectKey({
    purpose: input.purpose,
    ownerId: input.ownerId,
    assetId,
    extension: normalizedExt,
  });

  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15-minute authorization window

  // 4. Record initial UPLOADING metadata in D1 (System of record)
  const initialAsset: MediaAsset = {
    id: assetId,
    bucket: policy.bucket,
    objectKey,
    ownerType: input.ownerType,
    ownerId: input.ownerId,
    visibility: policy.visibility,
    mimeType: input.mimeType.toLowerCase().trim(),
    sizeBytes: input.sizeBytes,
    sha256: input.sha256 || null,
    altText: input.altText || null,
    status: "UPLOADING",
    originalFilename: sanitizedFilename,
    createdAt: now,
    updatedAt: now,
  };

  await mediaRepo.save(initialAsset);

  return {
    assetId,
    bucket: policy.bucket,
    objectKey,
    maxSizeBytes: policy.maxSizeBytes,
    allowedMimeTypes: policy.allowedMimeTypes,
    expiresAt,
  };
}
