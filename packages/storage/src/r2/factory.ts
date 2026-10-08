/**
 * Authoritative ObjectStore Factory
 *
 * Resolves Cloudflare R2 ObjectStore across all runtimes:
 * 1. Cloudflare Workers / OpenNext with native binding (env.PUBLIC_STORAGE)
 * 2. Next.js Server / Admin Actions / Edge via CloudflareR2RestClient (CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID)
 * 3. Fallback to MemoryObjectStore strictly in test environments
 */

import type { ObjectStore } from "../ports/object-store";
import type { CloudflareR2Bucket } from "./r2-object-store";
import { R2ObjectStore } from "./r2-object-store";
import { CloudflareR2RestClient } from "./cloudflare-r2-rest-store";
import { MemoryObjectStore } from "../ports/memory-object-store";
import { StorageError } from "../errors/storage-error";

let cachedStore: Record<string, ObjectStore> = {};

export function getAuthoritativeObjectStore(
  bucketClass: "PUBLIC" | "PRIVATE" | "EXPORT" = "PUBLIC"
): ObjectStore {
  if (cachedStore[bucketClass]) {
    return cachedStore[bucketClass];
  }

  const env = (typeof process !== "undefined" ? process.env : {}) as Record<string, unknown>;
  const bindingName = `${bucketClass}_STORAGE`;
  const nativeBinding = env[bindingName];

  // 1. Native Cloudflare Worker R2 Binding
  if (
    nativeBinding &&
    typeof (nativeBinding as { put?: unknown }).put === "function"
  ) {
    const store = new R2ObjectStore(nativeBinding as unknown as CloudflareR2Bucket);
    cachedStore[bucketClass] = store;
    return store;
  }

  // 2. Cloudflare R2 REST Client (Next.js / Node.js Server Environment)
  const accountId = (env.CLOUDFLARE_ACCOUNT_ID as string) || "";
  const apiToken = (env.CLOUDFLARE_API_TOKEN as string) || "";

  if (accountId && apiToken) {
    const bucketName =
      bucketClass === "PUBLIC"
        ? (env.CLOUDFLARE_R2_PUBLIC_BUCKET as string) || "vaahansafe-dev-public"
        : bucketClass === "PRIVATE"
          ? (env.CLOUDFLARE_R2_PRIVATE_BUCKET as string) || "vaahansafe-dev-private"
          : (env.CLOUDFLARE_R2_EXPORTS_BUCKET as string) || "vaahansafe-dev-exports";

    const store = new CloudflareR2RestClient({
      accountId,
      apiToken,
      bucketName,
    });
    cachedStore[bucketClass] = store;
    return store;
  }

  // 3. Fallback to MemoryObjectStore for isolated unit tests
  if (process.env.NODE_ENV !== "test") {
    throw new StorageError("STORAGE_UNAVAILABLE", "Cloudflare R2 is not configured.");
  }
  const memoryStore = new MemoryObjectStore();
  cachedStore[bucketClass] = memoryStore;
  return memoryStore;
}
