/**
 * Authoritative Server-Side Object Key Generator for VaahanSafe
 *
 * INVARIANTS:
 * 1. Object keys are generated STRICTLY server-side.
 * 2. Original filenames are untrusted metadata; never concatenated into paths.
 * 3. Zero PII in keys (no phone numbers, emails, vehicle numbers, or personal names).
 * 4. Path prefixes NEVER repeat "public/", "private/", or "exports/" because
 *    physical Cloudflare R2 buckets already establish isolation boundaries.
 * 5. All segment IDs are strictly checked against path traversal (../, \, absolute paths).
 */

import type { UploadPurpose } from "../types";
import { StorageError } from "../errors/storage-error";

const SAFE_SEGMENT_REGEX = /^[a-zA-Z0-9_-]+$/;

/**
 * Validates and sanitizes a path segment (e.g. userId, vehicleId).
 * Rejects traversal, slashes, backslashes, and null bytes.
 */
export function sanitizePathSegment(segment: string, paramName = "segment"): string {
  if (!segment || typeof segment !== "string") {
    throw new StorageError(
      "PATH_TRAVERSAL_DETECTED",
      `Invalid ${paramName}: segment must be a non-empty string.`
    );
  }

  const trimmed = segment.trim();

  // Reject path traversal patterns
  if (
    trimmed.includes("..") ||
    trimmed.includes("/") ||
    trimmed.includes("\\") ||
    trimmed.includes("\0") ||
    trimmed.startsWith(".")
  ) {
    throw new StorageError(
      "PATH_TRAVERSAL_DETECTED",
      `Potential path traversal attempt detected in ${paramName}: "${segment}".`
    );
  }

  if (!SAFE_SEGMENT_REGEX.test(trimmed)) {
    throw new StorageError(
      "PATH_TRAVERSAL_DETECTED",
      `Invalid characters in ${paramName}: "${segment}". Only alphanumeric, hyphens, and underscores are allowed.`
    );
  }

  return trimmed;
}

/**
 * Sanitizes original filename for display storage in D1 metadata.
 * Strips path separators, directory names, and dangerous characters.
 */
export function sanitizeDisplayFilename(rawFilename: string): string {
  if (!rawFilename) return "unnamed_file";

  // Take only the basename after any / or \
  const basename = rawFilename.split(/[/\\]/).pop() || "unnamed_file";

  // Strip null bytes and control characters
  const clean = basename.replace(/[\x00-\x1F\x7F<>:"/\\|?*]/g, "").trim();

  return clean.slice(0, 255) || "unnamed_file";
}

/**
 * Generates an opaque, cryptographically random asset ID.
 * Example: asset_3f9a7b1c4e2d8a0f
 */
export function generateAssetId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `asset_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
  }
  // Fallback for non-crypto environments
  const rand = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  return `asset_${rand.slice(0, 16)}`;
}

export interface GenerateObjectKeyParams {
  purpose: UploadPurpose;
  ownerId: string;
  assetId: string;
  extension: string;
  version?: string;
  variant?: string;
}

/**
 * Generates the authoritative server-side R2 object key.
 */
export function buildObjectKey(params: GenerateObjectKeyParams): string {
  const { purpose, ownerId, assetId, extension, version = "v1", variant } = params;

  const safeOwnerId = sanitizePathSegment(ownerId, "ownerId");
  const safeAssetId = sanitizePathSegment(assetId, "assetId");
  const safeExt = extension.replace(/^\./, "").toLowerCase().trim();

  if (!SAFE_SEGMENT_REGEX.test(safeExt)) {
    throw new StorageError(
      "INVALID_FILE_TYPE",
      `Invalid extension format: "${extension}"`
    );
  }

  const filePart = variant
    ? `${safeAssetId}_${sanitizePathSegment(variant, "variant")}.${safeExt}`
    : `${safeAssetId}.${safeExt}`;

  switch (purpose) {
    case "USER_PROFILE_IMAGE":
      return `users/${safeOwnerId}/profile/${filePart}`;

    case "VEHICLE_IMAGE":
      return `vehicles/${safeOwnerId}/${filePart}`;

    case "SUPPORT_ATTACHMENT":
      return `support/${safeOwnerId}/${filePart}`;

    case "BLOG_COVER":
    case "BLOG_INLINE_IMAGE":
      return `blog/${safeOwnerId}/${filePart}`;

    case "GALLERY_IMAGE":
      return `gallery/${safeOwnerId}/${filePart}`;

    case "PUBLIC_DOCUMENT":
    case "PRIVATE_DOCUMENT":
      return `documents/${safeOwnerId}/${sanitizePathSegment(version, "version")}/${filePart}`;

    case "INVOICE":
      return `invoices/${safeOwnerId}/${filePart}`;

    case "QR_PRINT_EXPORT":
      return `qr-batches/${safeOwnerId}/print/${filePart}`;

    case "QR_MANIFEST":
      return `qr-batches/${safeOwnerId}/manifest/${filePart}`;

    case "ADMIN_REPORT":
      return `reports/${safeOwnerId}/${filePart}`;

    default:
      throw new StorageError(
        "UPLOAD_NOT_AUTHORIZED",
        `Unknown upload purpose: ${purpose}`
      );
  }
}
