/**
 * Cache Policy Engine for VaahanSafe Object Storage
 *
 * Implements authoritative HTTP Cache-Control headers based on asset classification,
 * lifecycle state, and storage class.
 *
 * INVARIANTS:
 * - Public versioned READY media: long-lived immutable cache (1 year).
 * - Private assets: private, no-store/no-cache (never stored in shared CDN or browser cache).
 * - Exports: private, no-store (highly sensitive/short-lived).
 * - Non-ready assets: no-store.
 */

import type { StorageVisibility, AssetStatus, BucketClass } from "../types";

export interface CachePolicyOptions {
  visibility: StorageVisibility;
  status: AssetStatus;
  bucket: BucketClass;
  maxAgeSeconds?: number;
}

export function getCacheControlHeader(options: CachePolicyOptions): string {
  const { visibility, status, bucket, maxAgeSeconds } = options;

  // Unready, quarantined, or deleted assets must never be cached
  if (status !== "READY") {
    return "no-store, max-age=0, must-revalidate";
  }

  // Controlled/Manufacturing Exports
  if (bucket === "EXPORT" || visibility === "INTERNAL") {
    return "private, no-store, no-cache, max-age=0, must-revalidate";
  }

  // Private customer/operational assets
  if (bucket === "PRIVATE" || visibility === "PRIVATE" || visibility === "CONTROLLED") {
    return "private, no-cache, no-store, max-age=0, must-revalidate";
  }

  // Explicitly Public & Ready assets
  if (bucket === "PUBLIC" && visibility === "PUBLIC") {
    const age = maxAgeSeconds ?? 31536000; // Default 1 year (immutable)
    return `public, max-age=${age}, immutable`;
  }

  return "no-store, max-age=0, must-revalidate";
}
