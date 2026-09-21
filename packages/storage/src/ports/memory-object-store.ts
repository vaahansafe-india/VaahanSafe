/**
 * In-Memory ObjectStore Test Double & Local Emulation
 *
 * Implements ObjectStore in-memory for testing, local execution,
 * and deterministic simulation of storage failure scenarios.
 */

import type { ObjectStore, ObjectStoreMeta, PutObjectOptions } from "./object-store";
import { StorageError } from "../errors/storage-error";

interface StoredEntry {
  data: Uint8Array;
  meta: ObjectStoreMeta;
}

export class MemoryObjectStore implements ObjectStore {
  private store = new Map<string, StoredEntry>();

  public failNextPut = false;
  public failNextHead = false;
  public failNextGet = false;
  public failNextDelete = false;

  async put(
    key: string,
    data: ArrayBuffer | Uint8Array | ReadableStream,
    options?: PutObjectOptions
  ): Promise<ObjectStoreMeta> {
    if (this.failNextPut) {
      this.failNextPut = false;
      throw new StorageError("STORAGE_UNAVAILABLE", "Simulated R2 put failure.");
    }

    let bytes: Uint8Array;
    if (data instanceof Uint8Array) {
      bytes = data;
    } else if (data instanceof ArrayBuffer) {
      bytes = new Uint8Array(data);
    } else {
      // ReadableStream (Web stream)
      const reader = (data as ReadableStream<Uint8Array>).getReader();
      const chunks: Uint8Array[] = [];
      let totalLen = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          totalLen += value.length;
        }
      }
      bytes = new Uint8Array(totalLen);
      let offset = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.length;
      }
    }

    const meta: ObjectStoreMeta = {
      key,
      size: bytes.length,
      etag: `etag_${Date.now()}_${bytes.length}`,
      contentType: options?.contentType || "application/octet-stream",
      uploadedAt: new Date().toISOString(),
      customMetadata: options?.customMetadata,
    };

    this.store.set(key, { data: bytes, meta });
    return meta;
  }

  async get(
    key: string
  ): Promise<{ data: ReadableStream | ArrayBuffer; meta: ObjectStoreMeta } | null> {
    if (this.failNextGet) {
      this.failNextGet = false;
      throw new StorageError("STORAGE_UNAVAILABLE", "Simulated R2 get failure.");
    }

    const entry = this.store.get(key);
    if (!entry) return null;

    const copy = new Uint8Array(entry.data.length);
    copy.set(entry.data);
    return {
      data: copy.buffer as ArrayBuffer,
      meta: { ...entry.meta },
    };
  }

  async head(key: string): Promise<ObjectStoreMeta | null> {
    if (this.failNextHead) {
      this.failNextHead = false;
      throw new StorageError("STORAGE_UNAVAILABLE", "Simulated R2 head failure.");
    }

    const entry = this.store.get(key);
    return entry ? { ...entry.meta } : null;
  }

  async delete(key: string): Promise<boolean> {
    if (this.failNextDelete) {
      this.failNextDelete = false;
      throw new StorageError("STORAGE_UNAVAILABLE", "Simulated R2 delete failure.");
    }

    return this.store.delete(key);
  }

  // Helpers for testing
  has(key: string): boolean {
    return this.store.has(key);
  }

  clear(): void {
    this.store.clear();
  }
}

/**
 * Legacy test double of ObjectStorage for @vaahansafe/types compatibility.
 */
export class MockObjectStorage {
  private publicBaseUrl: string;

  constructor(publicBaseUrl = "https://assets.vaahansafe.com") {
    this.publicBaseUrl = publicBaseUrl;
  }

  async put(input: {
    key: string;
    data: ArrayBuffer | Uint8Array | ReadableStream;
    contentType?: string;
    visibility: "PUBLIC" | "PRIVATE" | "INTERNAL" | "CONTROLLED";
    customMetadata?: Record<string, string>;
  }) {
    return {
      key: input.key,
      size: 1024,
      contentType: input.contentType || "application/octet-stream",
      visibility: input.visibility,
      uploadedAt: new Date().toISOString(),
      customMetadata: input.customMetadata,
    };
  }

  async get(_key: string) {
    return null;
  }

  async head(key: string) {
    return {
      key,
      size: 1024,
      contentType: "application/octet-stream",
      visibility: "PRIVATE" as const,
      uploadedAt: new Date().toISOString(),
    };
  }

  async delete(_key: string): Promise<boolean> {
    return true;
  }

  async createSignedReadUrl(key: string, _expiresInSeconds = 3600): Promise<string> {
    return `https://storage.vaahansafe.com/signed/read/${key}?sig=mock_token`;
  }

  async createSignedUploadUrl(key: string, _expiresInSeconds = 3600): Promise<string> {
    return `https://storage.vaahansafe.com/signed/upload/${key}?sig=mock_token`;
  }

  getPublicUrl(key: string): string {
    return `${this.publicBaseUrl}/${key.replace(/^\//, "")}`;
  }
}

export class MockStorageService {
  private publicBaseUrl: string;

  constructor(publicBaseUrl = "https://assets.vaahansafe.com") {
    this.publicBaseUrl = publicBaseUrl;
  }

  async putObject(
    _bucket: "public" | "private" | "exports",
    key: string,
    _data: ArrayBuffer | Uint8Array | ReadableStream,
    options?: { contentType?: string; customMetadata?: Record<string, string> }
  ) {
    return {
      key,
      size: 1024,
      contentType: options?.contentType || "application/octet-stream",
      uploadedAt: new Date().toISOString(),
    };
  }

  async getObject(_bucket: "public" | "private" | "exports", _key: string) {
    return null;
  }

  async deleteObject(_bucket: "public" | "private" | "exports", _key: string) {
    return true;
  }

  getPublicUrl(key: string): string {
    return `${this.publicBaseUrl}/${key.replace(/^\//, "")}`;
  }

  async createSignedAccessUrl(
    _bucket: "private" | "exports",
    key: string,
    _expiresInSeconds = 3600
  ): Promise<string> {
    return `https://storage.vaahansafe.com/signed/${key}?sig=mock_signature`;
  }
}

