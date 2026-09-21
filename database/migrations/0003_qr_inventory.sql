-- ==============================================================================
-- Migration: 0003_qr_inventory.sql
-- Description: Safety-Critical QR Lifecycle, Inventory, Assignments & Secrets Schema
-- Engine: Cloudflare D1 (SQLite)
-- Invariants:
--   - public_id is unique and indexed (hot-path resolution)
--   - visible_code is unique (physical sticker tracking)
--   - Plaintext scratch secret NEVER exists in database (secret_hash only)
--   - Exactly one current assignment per QR and per Vehicle enforced by partial unique indexes
--   - QR status transitions are captured append-only in qr_status_history
--   - Fraud/rate-limit attempts and analytics are strictly privacy-minimized
-- ==============================================================================

PRAGMA foreign_keys = ON;

-- ------------------------------------------------------------------------------
-- 1. QR Batches Table (Manufacturing & print lot management)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS qr_batches (
    id TEXT PRIMARY KEY,
    reference_code TEXT NOT NULL UNIQUE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    status TEXT NOT NULL DEFAULT 'DRAFT' 
        CHECK (status IN ('DRAFT', 'GENERATED', 'EXPORTED', 'PRINTED', 'CLOSED', 'CANCELLED')),
    manufacturer_name TEXT,
    manufacturer_reference TEXT,
    generated_at TEXT,
    exported_at TEXT,
    printed_at TEXT,
    created_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_qr_batches_status ON qr_batches(status);

-- ------------------------------------------------------------------------------
-- 2. QR Stickers Table (Physical stickers and authoritative lifecycle states)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS qr_stickers (
    id TEXT PRIMARY KEY,
    public_id TEXT NOT NULL UNIQUE,
    visible_code TEXT NOT NULL UNIQUE,
    batch_id TEXT NOT NULL REFERENCES qr_batches(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'PRINTED' 
        CHECK (status IN (
            'PRINTED',
            'IN_TRANSIT_DISTRIBUTOR',
            'WITH_DISTRIBUTOR',
            'WITH_RETAILER',
            'SOLD',
            'ACTIVATED',
            'EXPIRED_UNSOLD',
            'LOST_DAMAGED',
            'REPLACED',
            'BLOCKED'
        )),
    current_distributor_id TEXT,
    current_retailer_id TEXT,
    activated_at TEXT,
    replaced_by_qr_id TEXT REFERENCES qr_stickers(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_qr_stickers_public_id ON qr_stickers(public_id);
CREATE INDEX IF NOT EXISTS idx_qr_stickers_visible_code ON qr_stickers(visible_code);
CREATE INDEX IF NOT EXISTS idx_qr_stickers_batch_status ON qr_stickers(batch_id, status);
CREATE INDEX IF NOT EXISTS idx_qr_stickers_status ON qr_stickers(status);

-- ------------------------------------------------------------------------------
-- 3. QR Activation Secrets Table (Cryptographic hash only, lockout counters)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS qr_activation_secrets (
    id TEXT PRIMARY KEY,
    qr_id TEXT NOT NULL UNIQUE REFERENCES qr_stickers(id) ON DELETE CASCADE,
    secret_hash TEXT NOT NULL,
    hash_version TEXT NOT NULL DEFAULT 'v1',
    failed_attempts INTEGER NOT NULL DEFAULT 0 CHECK (failed_attempts >= 0),
    locked_until TEXT,
    consumed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_qr_activation_secrets_qr ON qr_activation_secrets(qr_id);

-- ------------------------------------------------------------------------------
-- 4. QR Assignments Table (Historical and current vehicle/user linkage)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS qr_assignments (
    id TEXT PRIMARY KEY,
    qr_id TEXT NOT NULL REFERENCES qr_stickers(id) ON DELETE RESTRICT,
    vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    assignment_type TEXT NOT NULL DEFAULT 'INITIAL' 
        CHECK (assignment_type IN ('INITIAL', 'REPLACEMENT', 'TRANSFER')),
    assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
    ended_at TEXT,
    end_reason TEXT CHECK (end_reason IN ('REPLACED', 'TRANSFERRED', 'DEACTIVATED', 'UNLINKED') OR end_reason IS NULL),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- PARTIAL UNIQUE INDEXES: Enforce the one-current-assignment invariant at the database engine level!
CREATE UNIQUE INDEX IF NOT EXISTS idx_qr_assignments_current_qr 
    ON qr_assignments(qr_id) WHERE ended_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_qr_assignments_current_vehicle 
    ON qr_assignments(vehicle_id) WHERE ended_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_qr_assignments_user_active 
    ON qr_assignments(user_id, ended_at);

-- ------------------------------------------------------------------------------
-- 5. QR Status History Table (Append-only state audit)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS qr_status_history (
    id TEXT PRIMARY KEY,
    qr_id TEXT NOT NULL REFERENCES qr_stickers(id) ON DELETE CASCADE,
    from_status TEXT NOT NULL,
    to_status TEXT NOT NULL,
    reason_code TEXT NOT NULL,
    actor_type TEXT NOT NULL CHECK (actor_type IN ('SYSTEM', 'USER', 'ADMIN', 'DISTRIBUTOR', 'RETAILER')),
    actor_id TEXT,
    metadata_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_qr_status_history_qr ON qr_status_history(qr_id, created_at);

-- ------------------------------------------------------------------------------
-- 6. QR Activation Attempts Table (Rate limiting & fraud analysis)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS qr_activation_attempts (
    id TEXT PRIMARY KEY,
    qr_id TEXT NOT NULL REFERENCES qr_stickers(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    outcome TEXT NOT NULL CHECK (outcome IN ('SUCCESS', 'INVALID_SECRET', 'QR_LOCKED', 'ALREADY_ACTIVATED', 'RATE_LIMITED', 'VEHICLE_MISMATCH')),
    failure_reason_code TEXT,
    request_fingerprint_hash TEXT,
    ip_hash TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_qr_activation_attempts_qr ON qr_activation_attempts(qr_id, created_at);

-- ------------------------------------------------------------------------------
-- 7. QR Scan Events Table (Privacy-minimized telemetry)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS qr_scan_events (
    id TEXT PRIMARY KEY,
    qr_id TEXT NOT NULL REFERENCES qr_stickers(id) ON DELETE CASCADE,
    scan_type TEXT NOT NULL DEFAULT 'PUBLIC_RESOLVE' 
        CHECK (scan_type IN ('PUBLIC_RESOLVE', 'EMERGENCY_TRIGGER', 'ADMIN_INSPECT')),
    result TEXT NOT NULL 
        CHECK (result IN ('RESOLVED_ACTIVE', 'RESOLVED_INACTIVE', 'RESOLVED_REPLACED', 'RESOLVED_BLOCKED', 'NOT_FOUND')),
    city TEXT,
    state TEXT,
    user_agent_family TEXT,
    referrer_class TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_qr_scan_events_qr_created ON qr_scan_events(qr_id, created_at);
