/**
 * D1 Media Asset Repository Implementation
 *
 * Implements MediaAssetRepository port using Cloudflare D1 / SQLite.
 * Manages the media_assets metadata table as authoritative relational truth.
 */

import type {
  MediaAsset,
  MediaAssetRepository,
  AssetStatus,
  OwnerType,
  BucketClass,
  StorageVisibility,
} from "@vaahansafe/types";
import type { DatabaseClient } from "../client/d1";

interface DbMediaAssetRow {
  id: string;
  bucket: string;
  object_key: string;
  owner_type: string;
  owner_id: string;
  visibility: string;
  mime_type: string;
  size_bytes: number;
  sha256: string | null;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  status: string;
  original_filename: string | null;
  storage_etag: string | null;
  variant_of_asset_id: string | null;
  ready_at: string | null;
  quarantined_at: string | null;
  deleted_at: string | null;
  metadata_json: string | null;
  created_at: string;
  updated_at: string;
}

export class D1MediaAssetRepository implements MediaAssetRepository {
  constructor(private db: DatabaseClient) {}

  private mapRowToDomain(row: DbMediaAssetRow): MediaAsset {
    return {
      id: row.id,
      bucket: row.bucket as BucketClass,
      objectKey: row.object_key,
      ownerType: row.owner_type as OwnerType,
      ownerId: row.owner_id,
      visibility: row.visibility as StorageVisibility,
      mimeType: row.mime_type,
      sizeBytes: row.size_bytes,
      sha256: row.sha256,
      width: row.width,
      height: row.height,
      altText: row.alt_text,
      status: row.status as AssetStatus,
      originalFilename: row.original_filename,
      storageEtag: row.storage_etag,
      variantOfAssetId: row.variant_of_asset_id,
      readyAt: row.ready_at,
      quarantinedAt: row.quarantined_at,
      deletedAt: row.deleted_at,
      metadataJson: row.metadata_json,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async findById(id: string): Promise<MediaAsset | null> {
    const row = await this.db.queryFirst<DbMediaAssetRow>(
      `SELECT id, bucket, object_key, owner_type, owner_id, visibility,
              mime_type, size_bytes, sha256, width, height, alt_text,
              status, original_filename, storage_etag, variant_of_asset_id,
              ready_at, quarantined_at, deleted_at, metadata_json,
              created_at, updated_at
       FROM media_assets
       WHERE id = ?`,
      [id]
    );
    return row ? this.mapRowToDomain(row) : null;
  }

  async findByObjectKey(objectKey: string): Promise<MediaAsset | null> {
    const row = await this.db.queryFirst<DbMediaAssetRow>(
      `SELECT id, bucket, object_key, owner_type, owner_id, visibility,
              mime_type, size_bytes, sha256, width, height, alt_text,
              status, original_filename, storage_etag, variant_of_asset_id,
              ready_at, quarantined_at, deleted_at, metadata_json,
              created_at, updated_at
       FROM media_assets
       WHERE object_key = ?`,
      [objectKey]
    );
    return row ? this.mapRowToDomain(row) : null;
  }

  async findByOwner(ownerType: OwnerType, ownerId: string): Promise<MediaAsset[]> {
    const rows = await this.db.query<DbMediaAssetRow>(
      `SELECT id, bucket, object_key, owner_type, owner_id, visibility,
              mime_type, size_bytes, sha256, width, height, alt_text,
              status, original_filename, storage_etag, variant_of_asset_id,
              ready_at, quarantined_at, deleted_at, metadata_json,
              created_at, updated_at
       FROM media_assets
       WHERE owner_type = ? AND owner_id = ?
       ORDER BY created_at DESC`,
      [ownerType, ownerId]
    );
    return rows.map((r) => this.mapRowToDomain(r));
  }

  async save(asset: MediaAsset): Promise<MediaAsset> {
    const existing = await this.findById(asset.id);
    const now = new Date().toISOString();

    if (existing) {
      await this.db.execute(
        `UPDATE media_assets SET
           bucket = COALESCE(?, bucket),
           object_key = COALESCE(?, object_key),
           owner_type = COALESCE(?, owner_type),
           owner_id = COALESCE(?, owner_id),
           visibility = COALESCE(?, visibility),
           mime_type = COALESCE(?, mime_type),
           size_bytes = COALESCE(?, size_bytes),
           sha256 = COALESCE(?, sha256),
           width = COALESCE(?, width),
           height = COALESCE(?, height),
           alt_text = COALESCE(?, alt_text),
           status = COALESCE(?, status),
           original_filename = COALESCE(?, original_filename),
           storage_etag = COALESCE(?, storage_etag),
           variant_of_asset_id = COALESCE(?, variant_of_asset_id),
           ready_at = COALESCE(?, ready_at),
           quarantined_at = COALESCE(?, quarantined_at),
           deleted_at = COALESCE(?, deleted_at),
           metadata_json = COALESCE(?, metadata_json),
           updated_at = ?
         WHERE id = ?`,
        [
          asset.bucket,
          asset.objectKey,
          asset.ownerType,
          asset.ownerId,
          asset.visibility,
          asset.mimeType,
          asset.sizeBytes,
          asset.sha256 ?? null,
          asset.width ?? null,
          asset.height ?? null,
          asset.altText ?? null,
          asset.status,
          asset.originalFilename ?? null,
          asset.storageEtag ?? null,
          asset.variantOfAssetId ?? null,
          asset.readyAt ?? null,
          asset.quarantinedAt ?? null,
          asset.deletedAt ?? null,
          asset.metadataJson ?? null,
          now,
          asset.id,
        ]
      );
    } else {
      await this.db.execute(
        `INSERT INTO media_assets (
           id, bucket, object_key, owner_type, owner_id, visibility,
           mime_type, size_bytes, sha256, width, height, alt_text,
           status, original_filename, storage_etag, variant_of_asset_id,
           ready_at, quarantined_at, deleted_at, metadata_json,
           created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          asset.id,
          asset.bucket,
          asset.objectKey,
          asset.ownerType,
          asset.ownerId,
          asset.visibility,
          asset.mimeType,
          asset.sizeBytes,
          asset.sha256 ?? null,
          asset.width ?? null,
          asset.height ?? null,
          asset.altText ?? null,
          asset.status,
          asset.originalFilename ?? null,
          asset.storageEtag ?? null,
          asset.variantOfAssetId ?? null,
          asset.readyAt ?? null,
          asset.quarantinedAt ?? null,
          asset.deletedAt ?? null,
          asset.metadataJson ?? null,
          asset.createdAt || now,
          asset.updatedAt || now,
        ]
      );
    }

    const updated = await this.findById(asset.id);
    if (!updated) {
      throw new Error(`Failed to save media asset ${asset.id}`);
    }
    return updated;
  }

  async updateStatus(
    id: string,
    status: AssetStatus,
    updates: Partial<MediaAsset> = {}
  ): Promise<MediaAsset> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Media asset ${id} not found.`);
    }

    const now = new Date().toISOString();
    const readyAt = status === "READY" ? updates.readyAt || now : existing.readyAt;
    const quarantinedAt =
      status === "QUARANTINED"
        ? updates.quarantinedAt || now
        : existing.quarantinedAt;
    const deletedAt =
      status === "DELETED" ? updates.deletedAt || now : existing.deletedAt;

    await this.db.execute(
      `UPDATE media_assets SET
         status = ?,
         size_bytes = COALESCE(?, size_bytes),
         sha256 = COALESCE(?, sha256),
         storage_etag = COALESCE(?, storage_etag),
         width = COALESCE(?, width),
         height = COALESCE(?, height),
         ready_at = ?,
         quarantined_at = ?,
         deleted_at = ?,
         updated_at = ?
       WHERE id = ?`,
      [
        status,
        updates.sizeBytes ?? null,
        updates.sha256 ?? null,
        updates.storageEtag ?? null,
        updates.width ?? null,
        updates.height ?? null,
        readyAt,
        quarantinedAt,
        deletedAt,
        now,
        id,
      ]
    );

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`Failed to update status for media asset ${id}`);
    }
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const res = await this.db.execute("DELETE FROM media_assets WHERE id = ?", [id]);
    return (res.rowsAffected ?? 0) > 0;
  }
}
