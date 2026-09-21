/**
 * Cloudflare R2 ObjectStore Adapter
 *
 * Implements the provider-agnostic ObjectStore port over Cloudflare R2Bucket bindings.
 */

import type { ObjectStore, ObjectStoreMeta, PutObjectOptions } from "../ports/object-store";
import { StorageError } from "../errors/storage-error";

export interface R2HttpMetadata {
  contentType?: string;
  contentDisposition?: string;
  cacheControl?: string;
}

export interface CloudflareR2Object {
  key: string;
  size: number;
  etag: string;
  uploaded: Date;
  httpMetadata?: R2HttpMetadata;
  customMetadata?: Record<string, string>;
}

export interface CloudflareR2ObjectBody extends CloudflareR2Object {
  body: ReadableStream;
  arrayBuffer(): Promise<ArrayBuffer>;
  text(): Promise<string>;
}

export interface CloudflareR2Bucket {
  put(
    key: string,
    value: ReadableStream | ArrayBuffer | ArrayBufferView | string | null,
    options?: {
      httpMetadata?: R2HttpMetadata;
      customMetadata?: Record<string, string>;
      sha256?: string;
    }
  ): Promise<CloudflareR2Object | null>;

  get(key: string): Promise<CloudflareR2ObjectBody | null>;

  head(key: string): Promise<CloudflareR2Object | null>;

  delete(keys: string | string[]): Promise<void>;
}

export class R2ObjectStore implements ObjectStore {
  constructor(private bucket: CloudflareR2Bucket) {}

  async put(
    key: string,
    data: ArrayBuffer | Uint8Array | ReadableStream,
    options?: PutObjectOptions
  ): Promise<ObjectStoreMeta> {
    try {
      const res = await this.bucket.put(key, data, {
        httpMetadata: {
          contentType: options?.contentType,
        },
        customMetadata: options?.customMetadata,
        sha256: options?.sha256,
      });

      if (!res) {
        throw new StorageError("STORAGE_UNAVAILABLE", `R2 put returned null for key: ${key}`);
      }

      return {
        key: res.key,
        size: res.size,
        etag: res.etag,
        contentType: res.httpMetadata?.contentType || options?.contentType,
        uploadedAt: res.uploaded.toISOString(),
        customMetadata: res.customMetadata,
      };
    } catch (err: unknown) {
      if (err instanceof StorageError) throw err;
      throw new StorageError(
        "STORAGE_UNAVAILABLE",
        `Cloudflare R2 put failed for key "${key}": ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  async get(
    key: string
  ): Promise<{ data: ReadableStream | ArrayBuffer; meta: ObjectStoreMeta } | null> {
    try {
      const obj = await this.bucket.get(key);
      if (!obj) return null;

      return {
        data: obj.body,
        meta: {
          key: obj.key,
          size: obj.size,
          etag: obj.etag,
          contentType: obj.httpMetadata?.contentType,
          uploadedAt: obj.uploaded.toISOString(),
          customMetadata: obj.customMetadata,
        },
      };
    } catch (err: unknown) {
      throw new StorageError(
        "STORAGE_UNAVAILABLE",
        `Cloudflare R2 get failed for key "${key}": ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  async head(key: string): Promise<ObjectStoreMeta | null> {
    try {
      const obj = await this.bucket.head(key);
      if (!obj) return null;

      return {
        key: obj.key,
        size: obj.size,
        etag: obj.etag,
        contentType: obj.httpMetadata?.contentType,
        uploadedAt: obj.uploaded.toISOString(),
        customMetadata: obj.customMetadata,
      };
    } catch (err: unknown) {
      throw new StorageError(
        "STORAGE_UNAVAILABLE",
        `Cloudflare R2 head failed for key "${key}": ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      await this.bucket.delete(key);
      return true;
    } catch (err: unknown) {
      throw new StorageError(
        "STORAGE_UNAVAILABLE",
        `Cloudflare R2 delete failed for key "${key}": ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }
}
