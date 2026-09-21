-- ==============================================================================
-- Migration: 0008_service_entitlements_and_idempotency.sql
-- Description: Authoritative Service Entitlements, Gating & Webhook Idempotency Schema
-- Engine: Cloudflare D1 (SQLite)
-- Invariants:
--   - Payment != QR Inventory != Entitlement != Subscription
--   - No active service (Digital QR, Safety View, Routing) without authoritative entitlement record
--   - Webhook events are strictly idempotent via UNIQUE provider event index
--   - Financial, audit, and entitlement records NEVER cascade-delete on vehicle/user updates
-- ==============================================================================

PRAGMA foreign_keys = ON;

-- ------------------------------------------------------------------------------
-- 1. Service Entitlements Table (Authoritative Service Gating)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS service_entitlements (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    qr_sticker_id TEXT NOT NULL REFERENCES qr_stickers(id) ON DELETE RESTRICT,
    capability TEXT NOT NULL CHECK (
        capability IN (
            'DIGITAL_QR_ACCESS',
            'SAFETY_VIEW_ACTIVE',
            'EMERGENCY_ROUTING',
            'SCAN_HISTORY_LOGGING',
            'REPLACEMENT_ELIGIBLE'
        )
    ),
    status TEXT NOT NULL DEFAULT 'ENABLED' 
        CHECK (status IN ('ENABLED', 'SUSPENDED', 'REVOKED', 'EXPIRED')),
    acquisition_source TEXT NOT NULL 
        CHECK (acquisition_source IN ('ONLINE_PURCHASE', 'RETAIL_ACTIVATION')),
    order_id TEXT REFERENCES orders(id) ON DELETE RESTRICT,
    verified_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_service_entitlements_unique 
    ON service_entitlements(vehicle_id, qr_sticker_id, capability);

CREATE INDEX IF NOT EXISTS idx_service_entitlements_user 
    ON service_entitlements(user_id, status);

CREATE INDEX IF NOT EXISTS idx_service_entitlements_qr 
    ON service_entitlements(qr_sticker_id, status);

CREATE INDEX IF NOT EXISTS idx_service_entitlements_lookup 
    ON service_entitlements(qr_sticker_id, capability, status);

-- ------------------------------------------------------------------------------
-- 2. Webhook Idempotency Unique Index
-- ------------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_webhooks_provider_event 
    ON payment_webhook_events(provider, provider_event_id) 
    WHERE provider_event_id IS NOT NULL;
