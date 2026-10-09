/**
 * Authoritative Cloudflare R2 REST ObjectStore Adapter
 *
 * Implements the ObjectStore port using Cloudflare's official v4 REST API.
 * Allows Next.js (Node / Edge / Admin / Server Actions) to upload and manage
 * objects directly in Cloudflare R2 without requiring native worker bindings or AWS S3 SDK.
 *
 * Single Source of Truth: Cloudflare R2 Storage Buckets
 */

import type {
  ObjectStore,
  ObjectStoreMeta,
  PutObjectOptions,
} from "../ports/object-store";
import { StorageError } from "../errors/storage-error";

export interface CloudflareR2RestClientOptions {
  accountId?: string;
  apiToken?: string;
  bucketName?: string;
  publicBaseUrl?: string;
}

export class CloudflareR2RestClient implements ObjectStore {
  private accountId: string;
  private apiToken: string;
  private bucketName: string;
  private publicBaseUrl: string;

  constructor(options?: CloudflareR2RestClientOptions) {
    this.accountId =
      options?.accountId ||
      (typeof process !== "undefined"
        ? process.env?.CLOUDFLARE_ACCOUNT_ID
        : "") ||
      "";
    this.apiToken =
      options?.apiToken ||
      (typeof process !== "undefined"
        ? process.env?.CLOUDFLARE_API_TOKEN
        : "") ||
      "";
    this.bucketName =
      options?.bucketName ||
      (typeof process !== "undefined"
        ? process.env?.CLOUDFLARE_R2_PUBLIC_BUCKET
        : "") ||
      "vaahansafe-dev-public";
    this.publicBaseUrl =
      options?.publicBaseUrl ||
      (typeof process !== "undefined"
        ? process.env?.NEXT_PUBLIC_ASSETS_URL
        : "") ||
      "https://pub-b68acd2881ca43ed80f94ec4989dff30.r2.dev";

    if (!this.accountId || !this.apiToken) {
      throw new StorageError(
        "STORAGE_UNAVAILABLE",
        "Cloudflare R2 REST credentials missing (CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN).",
      );
    }
  }

  private getObjectUrl(key: string): string {
    const cleanKey = encodeURIComponent(key.replace(/^\//, "")).replace(
      /%2F/g,
      "/",
    );
    return `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/r2/buckets/${this.bucketName}/objects/${cleanKey}`;
  }

  async put(
    key: string,
    data: ArrayBuffer | Uint8Array | ReadableStream,
    options?: PutObjectOptions,
  ): Promise<ObjectStoreMeta> {
    try {
      const url = this.getObjectUrl(key);
      let body: any;
      let byteLength = 0;

      if (data instanceof Uint8Array) {
        body = data;
        byteLength = data.byteLength;
      } else if (data instanceof ArrayBuffer) {
        body = data;
        byteLength = data.byteLength;
      } else {
        // ReadableStream
        body = data;
      }

      const headers: Record<string, string> = {
        Authorization: `Bearer ${this.apiToken}`,
      };

      if (options?.contentType) {
        headers["Content-Type"] = options.contentType;
      }

      const res = await fetch(url, {
        method: "PUT",
        headers,
        body,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new StorageError(
          "STORAGE_UNAVAILABLE",
          `Cloudflare R2 PUT failed (${res.status}): ${text}`,
        );
      }

      const json = (await res.json()) as any;
      const result = json?.result || {};

      return {
        key: result.key || key,
        size: Number(result.size || byteLength),
        etag: result.etag,
        contentType: options?.contentType,
        uploadedAt: result.uploaded || new Date().toISOString(),
        customMetadata: options?.customMetadata,
      };
    } catch (err: unknown) {
      if (err instanceof StorageError) throw err;
      throw new StorageError(
        "STORAGE_UNAVAILABLE",
        `Cloudflare R2 PUT error for "${key}": ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  async get(
    key: string,
  ): Promise<{
    data: ReadableStream | ArrayBuffer;
    meta: ObjectStoreMeta;
  } | null> {
    try {
      const url = this.getObjectUrl(key);
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
        },
      });

      if (res.status === 404) return null;
      if (!res.ok) {
        throw new StorageError(
          "STORAGE_UNAVAILABLE",
          `Cloudflare R2 GET failed with status ${res.status}`,
        );
      }

      const arrayBuf = await res.arrayBuffer();
      const meta: ObjectStoreMeta = {
        key,
        size: arrayBuf.byteLength,
        etag: res.headers.get("etag") || undefined,
        contentType: res.headers.get("content-type") || undefined,
        uploadedAt:
          res.headers.get("last-modified") || new Date().toISOString(),
      };

      return {
        data: arrayBuf,
        meta,
      };
    } catch (err: unknown) {
      if (err instanceof StorageError) throw err;
      throw new StorageError(
        "STORAGE_UNAVAILABLE",
        `Cloudflare R2 GET error for "${key}": ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  async head(key: string): Promise<ObjectStoreMeta | null> {
    try {
      // Cloudflare's object REST API supports GET, not HEAD. The documented
      // list endpoint returns metadata without downloading an object's body.
      const url = new URL(
        `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/r2/buckets/${this.bucketName}/objects`,
      );
      url.searchParams.set("prefix", key);
      url.searchParams.set("per_page", "1");
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
        },
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) {
        throw new StorageError(
          "STORAGE_UNAVAILABLE",
          `Cloudflare R2 HEAD failed with status ${res.status}`,
        );
      }

      const response = (await res.json()) as {
        success: boolean;
        result?: Array<{
          key?: string;
          size?: number;
          etag?: string;
          last_modified?: string;
          http_metadata?: { contentType?: string };
          custom_metadata?: Record<string, string>;
        }>;
      };
      if (!response.success || !Array.isArray(response.result)) {
        throw new StorageError(
          "STORAGE_UNAVAILABLE",
          "Cloudflare R2 metadata lookup failed.",
        );
      }
      const object = response.result.find((item) => item.key === key);
      if (!object) return null;
      return {
        key,
        size: object.size || 0,
        etag: object.etag,
        contentType: object.http_metadata?.contentType,
        uploadedAt: object.last_modified || new Date().toISOString(),
        customMetadata: object.custom_metadata,
      };
    } catch (err: unknown) {
      if (err instanceof StorageError) throw err;
      throw new StorageError(
        "STORAGE_UNAVAILABLE",
        `Cloudflare R2 HEAD error for "${key}": ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const url = this.getObjectUrl(key);
      const res = await fetch(url, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
        },
      });

      return res.ok;
    } catch (err: unknown) {
      if (err instanceof StorageError) throw err;
      throw new StorageError(
        "STORAGE_UNAVAILABLE",
        `Cloudflare R2 DELETE error for "${key}": ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
