import type { ObjectStore } from "../ports/object-store";
import { R2ObjectStore, type CloudflareR2Bucket } from "./r2-object-store";
import { CloudflareR2RestClient } from "./cloudflare-r2-rest-store";
import { StorageError } from "../errors/storage-error";

/** Explicit private report bucket; never silently select a development/public bucket. */
export function getScanReportObjectStore(): ObjectStore {
  const env = process.env as Record<string, unknown>;
  const binding = env.SCAN_REPORT_STORAGE as CloudflareR2Bucket | undefined;
  if (binding && typeof binding.put === "function")
    return new R2ObjectStore(binding);
  const bucketName = process.env.CLOUDFLARE_R2_SCAN_REPORTS_BUCKET;
  if (!bucketName)
    throw new StorageError(
      "STORAGE_UNAVAILABLE",
      "Private scan report storage is not configured.",
    );
  return new CloudflareR2RestClient({
    bucketName,
    apiToken:
      process.env.CLOUDFLARE_SCAN_REPORTS_API_TOKEN ||
      process.env.CLOUDFLARE_API_TOKEN,
  });
}
