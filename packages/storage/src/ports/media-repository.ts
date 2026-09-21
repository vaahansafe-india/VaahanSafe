/**
 * Media Asset Metadata Repository Port for VaahanSafe
 *
 * Defines the contract for persisting and retrieving asset metadata in Cloudflare D1.
 */

import type { MediaAsset, AssetStatus, OwnerType } from "../types";

export interface MediaAssetRepository {
  findById(id: string): Promise<MediaAsset | null>;
  findByObjectKey(objectKey: string): Promise<MediaAsset | null>;
  findByOwner(ownerType: OwnerType, ownerId: string): Promise<MediaAsset[]>;
  save(asset: MediaAsset): Promise<MediaAsset>;
  updateStatus(
    id: string,
    status: AssetStatus,
    updates?: Partial<MediaAsset>
  ): Promise<MediaAsset>;
  delete(id: string): Promise<boolean>;
}
