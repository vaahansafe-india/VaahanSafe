/**
 * Direct Upload Authorization Architecture
 *
 * Prepares scoped, short-lived authorization tickets for direct client -> R2 uploads.
 *
 * INVARIANT: Client NEVER receives Cloudflare API tokens or persistent R2 credentials.
 * INVARIANT: Authorization ticket is strictly bound to the server-generated object key.
 */

import type { AuthorizeUploadInput, BucketClass } from "../types";
import type { MediaAssetRepository } from "../ports/media-repository";
import { authorizeUpload } from "./authorize-upload";

export interface DirectUploadTicket {
  assetId: string;
  bucket: BucketClass;
  objectKey: string;
  maxSizeBytes: number;
  allowedMimeTypes: readonly string[];
  uploadUrl: string;
  expiresAt: string;
  headers: Record<string, string>;
}

export async function authorizeDirectUpload(
  input: AuthorizeUploadInput,
  mediaRepo: MediaAssetRepository,
  apiBaseUrl = "https://api.vaahansafe.com"
): Promise<DirectUploadTicket> {
  const session = await authorizeUpload(input, mediaRepo);

  // Upload URL points directly to the authorized upload endpoint or R2 presigned route
  const uploadUrl = `${apiBaseUrl.replace(/\/$/, "")}/v1/media/uploads/${session.assetId}/direct`;

  return {
    assetId: session.assetId,
    bucket: session.bucket,
    objectKey: session.objectKey,
    maxSizeBytes: session.maxSizeBytes,
    allowedMimeTypes: session.allowedMimeTypes,
    uploadUrl,
    expiresAt: session.expiresAt,
    headers: {
      "Content-Type": input.mimeType,
      "X-VaahanSafe-Asset-Id": session.assetId,
      "X-VaahanSafe-Expires": session.expiresAt,
    },
  };
}
