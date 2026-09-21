-- ==============================================================================
-- Migration: 0007_fulfilment_shipping_replacement.sql
-- Description: Fulfilment, Physical QR Reservation, Shipments & Replacement Schema
-- Engine: Cloudflare D1 (SQLite)
-- Invariants:
--   - Order != Payment != Fulfilment != Shipment != QR Activation != Replacement
--   - Physical QR stickers originate strictly from Phase 08 inventory (qr_stickers)
--   - Partial unique indexes prevent concurrent double-reservations of the same QR
--   - Replaced QRs are never deleted; old->new linkage is immutably recorded
--   - Scratch plaintext secrets are NEVER stored or exposed in fulfilment tables
-- ==============================================================================

PRAGMA foreign_keys = ON;

-- ------------------------------------------------------------------------------
-- 1. Fulfilments Table (Physical packing & order completion tasks)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fulfilments (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    type TEXT NOT NULL CHECK(type IN ('PHYSICAL_QR', 'REPLACEMENT_QR')),
    status TEXT NOT NULL DEFAULT 'PAID' 
        CHECK(status IN (
            'PAID',
            'PROCESSING',
            'PACKED',
            'SHIPPED',
            'OUT_FOR_DELIVERY',
            'DELIVERED',
            'DELIVERY_FAILED',
            'RTO',
            'RECEIVED_RTO',
            'CANCELLED'
        )),
    shipping_address_snapshot_json TEXT NOT NULL,
    exception_code TEXT,
    processing_at TEXT,
    packed_at TEXT,
    completed_at TEXT,
    cancelled_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(order_id, type)
);

CREATE INDEX IF NOT EXISTS idx_fulfilments_user ON fulfilments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_fulfilments_status ON fulfilments(status);

-- ------------------------------------------------------------------------------
-- 2. QR Reservations Table (Temporary claim & physical allocation)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS qr_reservations (
    id TEXT PRIMARY KEY,
    qr_sticker_id TEXT NOT NULL REFERENCES qr_stickers(id) ON DELETE RESTRICT,
    fulfilment_id TEXT REFERENCES fulfilments(id) ON DELETE RESTRICT,
    order_id TEXT REFERENCES orders(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'RESERVED' 
        CHECK(status IN ('RESERVED', 'ALLOCATED', 'RELEASED', 'CANCELLED')),
    reserved_at TEXT NOT NULL DEFAULT (datetime('now')),
    allocated_at TEXT,
    released_at TEXT,
    expires_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- INVARIANT: Exactly one active reservation or allocation per physical QR sticker!
CREATE UNIQUE INDEX IF NOT EXISTS idx_qr_reservations_active_qr 
    ON qr_reservations(qr_sticker_id) 
    WHERE status IN ('RESERVED', 'ALLOCATED');

-- INVARIANT: Exactly one active reservation per fulfilment!
CREATE UNIQUE INDEX IF NOT EXISTS idx_qr_reservations_active_fulfilment 
    ON qr_reservations(fulfilment_id) 
    WHERE status IN ('RESERVED', 'ALLOCATED');

CREATE INDEX IF NOT EXISTS idx_qr_reservations_status ON qr_reservations(status);

-- ------------------------------------------------------------------------------
-- 3. Shipments Table (Courier transit lifecycle)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shipments (
    id TEXT PRIMARY KEY,
    fulfilment_id TEXT NOT NULL UNIQUE REFERENCES fulfilments(id) ON DELETE RESTRICT,
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    provider TEXT NOT NULL DEFAULT 'MANUAL',
    provider_shipment_id TEXT,
    tracking_reference TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' 
        CHECK(status IN (
            'PENDING',
            'MANIFESTED',
            'PICKED_UP',
            'IN_TRANSIT',
            'OUT_FOR_DELIVERY',
            'DELIVERED',
            'DELIVERY_FAILED',
            'RTO_INITIATED',
            'RTO_DELIVERED',
            'CANCELLED'
        )),
    shipping_address_snapshot_json TEXT NOT NULL,
    shipped_at TEXT,
    delivered_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON shipments(tracking_reference);
CREATE INDEX IF NOT EXISTS idx_shipments_user ON shipments(user_id, status);

-- ------------------------------------------------------------------------------
-- 4. Replacement Requests Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS replacement_requests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    old_qr_sticker_id TEXT NOT NULL REFERENCES qr_stickers(id) ON DELETE RESTRICT,
    reason TEXT NOT NULL CHECK(reason IN ('LOST', 'DAMAGED', 'PRINT_DEFECT', 'DELIVERY_DAMAGE', 'OTHER')),
    user_notes TEXT,
    status TEXT NOT NULL DEFAULT 'REQUESTED' 
        CHECK(status IN (
            'REQUESTED',
            'UNDER_REVIEW',
            'APPROVED',
            'REJECTED',
            'QR_ALLOCATED',
            'MIGRATED',
            'SHIPPED',
            'COMPLETED',
            'CANCELLED'
        )),
    risk_level TEXT NOT NULL DEFAULT 'LOW' CHECK(risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
    requires_step_up INTEGER NOT NULL DEFAULT 0 CHECK(requires_step_up IN (0, 1)),
    approved_by TEXT,
    rejection_reason TEXT,
    requested_at TEXT NOT NULL DEFAULT (datetime('now')),
    approved_at TEXT,
    rejected_at TEXT,
    completed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- INVARIANT: Only one active open replacement request per QR sticker at any time!
CREATE UNIQUE INDEX IF NOT EXISTS idx_replacement_active_old_qr 
    ON replacement_requests(old_qr_sticker_id) 
    WHERE status NOT IN ('REJECTED', 'COMPLETED', 'CANCELLED');

CREATE INDEX IF NOT EXISTS idx_replacement_user ON replacement_requests(user_id, status);
CREATE INDEX IF NOT EXISTS idx_replacement_vehicle ON replacement_requests(vehicle_id);

-- ------------------------------------------------------------------------------
-- 5. Sticker Replacements Table (Immutable old -> new migration linkage)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sticker_replacements (
    id TEXT PRIMARY KEY,
    replacement_request_id TEXT NOT NULL UNIQUE REFERENCES replacement_requests(id) ON DELETE RESTRICT,
    old_qr_sticker_id TEXT NOT NULL REFERENCES qr_stickers(id) ON DELETE RESTRICT,
    new_qr_sticker_id TEXT NOT NULL REFERENCES qr_stickers(id) ON DELETE RESTRICT,
    vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    reason TEXT NOT NULL,
    migrated_at TEXT NOT NULL DEFAULT (datetime('now')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    CHECK(old_qr_sticker_id != new_qr_sticker_id)
);

CREATE INDEX IF NOT EXISTS idx_sticker_replacements_old_qr ON sticker_replacements(old_qr_sticker_id);
CREATE INDEX IF NOT EXISTS idx_sticker_replacements_new_qr ON sticker_replacements(new_qr_sticker_id);
CREATE INDEX IF NOT EXISTS idx_sticker_replacements_vehicle ON sticker_replacements(vehicle_id);
