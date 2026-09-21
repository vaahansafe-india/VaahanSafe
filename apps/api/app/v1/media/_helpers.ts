/**
 * API Worker Storage Gateway Helpers
 *
 * Resolves Cloudflare D1 and R2 bindings safely with fallbacks for
 * local development, testing, and edge runtime execution.
 */

import { D1DatabaseAdapter, D1MediaAssetRepository } from "@vaahansafe/database";
import type { D1DatabaseBinding } from "@vaahansafe/database";
import { R2ObjectStore, MemoryObjectStore } from "@vaahansafe/storage";
import type { ObjectStore, MediaAssetRepository, CloudflareR2Bucket } from "@vaahansafe/storage";

// Global in-memory singletons for test/dev environments
let localMemoryStore: MemoryObjectStore | null = null;

export function getObjectStoreForBucket(bucketClass: "PUBLIC" | "PRIVATE" | "EXPORT"): ObjectStore {
  const env = process.env as Record<string, unknown>;
  const bindingName = `${bucketClass}_STORAGE`;
  const bucketBinding = env[bindingName];

  if (bucketBinding && typeof (bucketBinding as { put?: unknown }).put === "function") {
    return new R2ObjectStore(bucketBinding as unknown as CloudflareR2Bucket);
  }

  // Fallback to in-memory store for local/testing
  if (!localMemoryStore) {
    localMemoryStore = new MemoryObjectStore();
  }
  return localMemoryStore;
}

let localMediaRepo: MockMediaAssetRepository | null = null;

export function getMediaAssetRepository(): MediaAssetRepository {
  const env = process.env as Record<string, unknown>;
  const d1Binding = env.DB;

  if (d1Binding && typeof (d1Binding as { prepare?: unknown }).prepare === "function") {
    const client = new D1DatabaseAdapter(d1Binding as unknown as D1DatabaseBinding);
    return new D1MediaAssetRepository(client);
  }

  // Fallback memory repository for test double
  if (!localMediaRepo) {
    localMediaRepo = new MockMediaAssetRepository();
  }
  return localMediaRepo;
}

/**
 * In-memory fallback repository when running outside Cloudflare Workers context
 */
class MockMediaAssetRepository implements MediaAssetRepository {
  private assets = new Map<string, import("@vaahansafe/storage").MediaAsset>();

  async findById(id: string) {
    return this.assets.get(id) || null;
  }

  async findByObjectKey(key: string) {
    for (const a of this.assets.values()) {
      if (a.objectKey === key) return a;
    }
    return null;
  }

  async findByOwner(ownerType: string, ownerId: string) {
    const res: import("@vaahansafe/storage").MediaAsset[] = [];
    for (const a of this.assets.values()) {
      if (a.ownerType === ownerType && a.ownerId === ownerId) {
        res.push(a);
      }
    }
    return res;
  }

  async save(asset: import("@vaahansafe/storage").MediaAsset) {
    this.assets.set(asset.id, { ...asset });
    return { ...asset };
  }

  async updateStatus(
    id: string,
    status: import("@vaahansafe/storage").AssetStatus,
    updates: Partial<import("@vaahansafe/storage").MediaAsset> = {}
  ) {
    const existing = this.assets.get(id);
    if (!existing) throw new Error(`Asset ${id} not found`);
    const updated = { ...existing, ...updates, status, updatedAt: new Date().toISOString() };
    this.assets.set(id, updated);
    return updated;
  }

  async delete(id: string) {
    return this.assets.delete(id);
  }
}
