/**
 * Server-Mediated Upload Service for Small Files
 *
 * Facilitates direct, server-mediated upload for small controlled files
 * (e.g. user avatars, vehicle photos, receipt attachments) through the API Worker.
 *
 * Flow:
 * 1. Validate request (purpose, role, owner type, MIME, max size)
 * 2. Enforce entity ownership (IDOR defense)
 * 3. Validate magic bytes (file signature verification)
 * 4. Generate server-side assetId and deterministic object key
 * 5. Write binary bytes to R2
 * 6. Record metadata in D1 with status = 'READY'
 * 7. Return verified MediaAsset
 */

import type { MediaAsset, StorageActor, UploadPurpose, OwnerType } from "../types";
import type { MediaAssetRepository } from "../ports/media-repository";
import type { ObjectStore } from "../ports/object-store";
import { validateUploadRequest } from "../policies/upload-policy";
import { verifyMagicBytes } from "../policies/mime-policy";
import { generateAssetId, buildObjectKey, sanitizeDisplayFilename } from "../keys/object-key";
import { StorageError } from "../errors/storage-error";

export interface ServerUploadInput {
  actor: StorageActor;
  purpose: UploadPurpose;
  ownerType: OwnerType;
  ownerId: string;
  filename: string;
  mimeType: string;
  data: Uint8Array | ArrayBuffer;
  altText?: string;
  sha256?: string;
  width?: number;
  height?: number;
  entityOwnershipCheck?: (
    ownerType: OwnerType,
    ownerId: string,
    actorId: string,
    actorRole: string
  ) => Promise<boolean> | boolean;
}

export async function serverUpload(
  input: ServerUploadInput,
  mediaRepo: MediaAssetRepository,
  objectStore: ObjectStore
): Promise<MediaAsset> {
  const bytes = input.data instanceof Uint8Array ? input.data : new Uint8Array(input.data);
  const sizeBytes = bytes.length;

  // 1. Central policy validation
  const { policy, normalizedExt } = validateUploadRequest({
    actor: input.actor,
    purpose: input.purpose,
    ownerType: input.ownerType,
    ownerId: input.ownerId,
    filename: input.filename,
    mimeType: input.mimeType,
    sizeBytes,
    sha256: input.sha256,
  });

  // 2. Cross-user IDOR guard
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
    if (input.ownerId !== input.actor.id) {
      throw new StorageError(
        "UPLOAD_NOT_AUTHORIZED",
        `Customers can only upload media to their own profile. Target: "${input.ownerId}", Actor: "${input.actor.id}".`
      );
    }
  }

  // 3. File Signature / Magic Bytes verification
  if (policy.isMagicBytesRequired) {
    const isMagicValid = verifyMagicBytes(bytes, input.mimeType);
    if (!isMagicValid) {
      throw new StorageError(
        "INVALID_FILE_TYPE",
        `File signature does not match declared MIME type "${input.mimeType}". Upload rejected.`
      );
    }
  }

  // 4. Generate opaque asset ID and server-controlled object key
  const assetId = generateAssetId();
  const sanitizedFilename = sanitizeDisplayFilename(input.filename);
  const objectKey = buildObjectKey({
    purpose: input.purpose,
    ownerId: input.ownerId,
    assetId,
    extension: normalizedExt,
  });

  const now = new Date().toISOString();

  // 5. Initial D1 record in UPLOADING status to guarantee auditability before writing bytes
  const initialAsset: MediaAsset = {
    id: assetId,
    bucket: policy.bucket,
    objectKey,
    ownerType: input.ownerType,
    ownerId: input.ownerId,
    visibility: policy.visibility,
    mimeType: input.mimeType.toLowerCase().trim(),
    sizeBytes,
    sha256: input.sha256 || null,
    width: input.width || null,
    height: input.height || null,
    altText: input.altText || null,
    status: "UPLOADING",
    originalFilename: sanitizedFilename,
    createdAt: now,
    updatedAt: now,
  };

  await mediaRepo.save(initialAsset);

  // 6. Write object bytes to R2
  let objectMeta;
  try {
    objectMeta = await objectStore.put(objectKey, bytes, {
      contentType: input.mimeType,
      sha256: input.sha256,
    });
  } catch (err: unknown) {
    // If R2 fails, asset remains UPLOADING in D1 and is never served as READY
    throw err;
  }

  // 7. Authoritatively transition D1 metadata to READY
  const readyAsset = await mediaRepo.updateStatus(assetId, "READY", {
    sizeBytes: objectMeta.size,
    storageEtag: objectMeta.etag,
    sha256: input.sha256 || null,
    width: input.width || null,
    height: input.height || null,
    readyAt: new Date().toISOString(),
  });

  return readyAsset;
}
