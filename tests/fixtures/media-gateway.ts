import { MemoryObjectStore } from "../../packages/storage/src/ports/memory-object-store";
import type { MediaAsset, MediaAssetRepository, ObjectStore } from "../../packages/storage/src";

// Isolated unit fixtures; application routes never import this module.
const rows = new Map<string, MediaAsset>();
const stores = new Map<string, ObjectStore>();
const repository: MediaAssetRepository = {
  findById: async id => rows.get(id) || null,
  findByObjectKey: async key => [...rows.values()].find(asset => asset.objectKey === key) || null,
  findByOwner: async (type, id) => [...rows.values()].filter(asset => asset.ownerType === type && asset.ownerId === id),
  save: async asset => { rows.set(asset.id, asset); return asset; },
  updateStatus: async (id, status, updates = {}) => {
    const existing = rows.get(id);
    if (!existing) throw new Error("Fixture asset not found");
    const updated = { ...existing, ...updates, status };
    rows.set(id, updated);
    return updated;
  },
  delete: async id => rows.delete(id),
};
export const getMediaAssetRepository = () => repository;
export function getObjectStoreForBucket(bucket: string): ObjectStore {
  if (!stores.has(bucket)) stores.set(bucket, new MemoryObjectStore());
  return stores.get(bucket)!;
}
