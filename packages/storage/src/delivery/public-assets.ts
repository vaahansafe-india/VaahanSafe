/**
 * Public Asset Delivery Abstraction
 *
 * Provides authoritative public asset URL resolution without leaking provider-specific
 * domains (e.g. r2.dev) into application logic.
 *
 * INVARIANT: Only PUBLIC + READY assets may be resolved for public delivery.
 * INVARIANT: Private data must never be resolved via public asset URLs.
 */

import type { MediaAsset } from "../types";
import { StorageError } from "../errors/storage-error";

export interface PublicUrlOptions {
  customBaseUrl?: string;
}

export function getPublicAssetUrl(
  asset: MediaAsset,
  options?: PublicUrlOptions
): string {
  // 1. Invariant: Must be in READY status
  if (asset.status !== "READY") {
    throw new StorageError(
      "ASSET_NOT_READY",
      `Asset "${asset.id}" cannot be publicly resolved because its status is "${asset.status}".`
    );
  }

  // 2. Invariant: Must be explicitly PUBLIC visibility and in PUBLIC bucket
  if (asset.visibility !== "PUBLIC" || asset.bucket !== "PUBLIC") {
    throw new StorageError(
      "PRIVATE_ACCESS_DENIED",
      `Asset "${asset.id}" has visibility "${asset.visibility}" in bucket "${asset.bucket}" and cannot be delivered publicly.`
    );
  }

  // 3. Resolve URL against configured public domain
  const baseUrl =
    options?.customBaseUrl ||
    (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_ASSETS_URL) ||
    "https://assets.vaahansafe.com";

  const cleanBase = baseUrl.replace(/\/$/, "");
  const cleanKey = asset.objectKey.replace(/^\//, "");

  return `${cleanBase}/${cleanKey}`;
}

/**
 * Resolves a Journal R2 media storage key (e.g. "blog/editorial/hero.webp")
 * into a full public CDN URL without exposing raw cloudflarestorage / r2.dev endpoints.
 */
export function resolveJournalAssetUrl(
  storageKey: string,
  options?: PublicUrlOptions
): string {
  if (!storageKey) return "";
  if (
    storageKey.startsWith("http://") ||
    storageKey.startsWith("https://") ||
    storageKey.startsWith("/")
  ) {
    return storageKey;
  }

  const baseUrl =
    options?.customBaseUrl ||
    (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_ASSETS_URL) ||
    "https://assets.vaahansafe.com";

  const cleanBase = baseUrl.replace(/\/$/, "");
  const cleanKey = storageKey.replace(/^\//, "");

  return `${cleanBase}/${cleanKey}`;
}
