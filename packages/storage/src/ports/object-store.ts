/**
 * Provider-Agnostic ObjectStore Port
 *
 * Invariant: Application and domain layers depend ONLY on this port.
 * Direct Cloudflare R2 / S3 specifics remain encapsulated within adapters.
 */

export interface ObjectStoreMeta {
  key: string;
  size: number;
  etag?: string;
  contentType?: string;
  uploadedAt: string;
  customMetadata?: Record<string, string>;
}

export interface PutObjectOptions {
  contentType?: string;
  customMetadata?: Record<string, string>;
  sha256?: string;
}

export interface ObjectStore {
  put(
    key: string,
    data: ArrayBuffer | Uint8Array | ReadableStream,
    options?: PutObjectOptions
  ): Promise<ObjectStoreMeta>;

  get(
    key: string
  ): Promise<{ data: ReadableStream | ArrayBuffer; meta: ObjectStoreMeta } | null>;

  head(key: string): Promise<ObjectStoreMeta | null>;

  delete(key: string): Promise<boolean>;
}
