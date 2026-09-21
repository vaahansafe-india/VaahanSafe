-- ==============================================================================
-- Migration: 0004_media_assets.sql
-- Description: Media Assets & Object Storage Metadata Schema
-- Engine: Cloudflare D1 (SQLite)
-- Invariants:
--   - D1 stores relational metadata and access authorization; R2 stores binary bytes
--   - Private data NEVER enters PUBLIC bucket
--   - Object key is strictly unique across the system
--   - Lifecycle transitions: UPLOADING -> READY, QUARANTINED, or DELETED
--   - Assets in UPLOADING or QUARANTINED state must NEVER be publicly delivered
-- ==============================================================================

PRAGMA foreign_keys = ON;

-- ------------------------------------------------------------------------------
-- 1. Media Assets Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS media_assets (
    id TEXT PRIMARY KEY,
    bucket TEXT NOT NULL CHECK (bucket IN ('PUBLIC', 'PRIVATE', 'EXPORT')),
    object_key TEXT NOT NULL UNIQUE,
    owner_type TEXT NOT NULL CHECK (owner_type IN (
        'USER',
        'VEHICLE',
        'SUPPORT_TICKET',
        'BLOG_POST',
        'GALLERY_ITEM',
        'DOCUMENT',
        'ORDER',
        'QR_BATCH',
        'REPORT',
        'SYSTEM'
    )),
    owner_id TEXT NOT NULL,
    visibility TEXT NOT NULL CHECK (visibility IN ('PUBLIC', 'PRIVATE', 'INTERNAL')),
    mime_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL CHECK (size_bytes >= 0),
    sha256 TEXT,
    width INTEGER,
    height INTEGER,
    alt_text TEXT,
    status TEXT NOT NULL DEFAULT 'UPLOADING' 
        CHECK (status IN ('UPLOADING', 'READY', 'QUARANTINED', 'DELETED')),
    original_filename TEXT,
    storage_etag TEXT,
    variant_of_asset_id TEXT REFERENCES media_assets(id) ON DELETE CASCADE,
    ready_at TEXT,
    quarantined_at TEXT,
    deleted_at TEXT,
    metadata_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_media_assets_owner ON media_assets(owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_status ON media_assets(status);
CREATE INDEX IF NOT EXISTS idx_media_assets_object_key ON media_assets(object_key);
CREATE INDEX IF NOT EXISTS idx_media_assets_bucket_status ON media_assets(bucket, status);
CREATE INDEX IF NOT EXISTS idx_media_assets_variant ON media_assets(variant_of_asset_id);
