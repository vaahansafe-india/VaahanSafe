-- ==============================================================================
-- Migration: 0001_identity.sql
-- Description: Core Identity & Authentication Schema (Users, Identities, Sessions, Addresses, Admin)
-- Engine: Cloudflare D1 (SQLite)
-- Invariants:
--   - Internal IDs are opaque strings (usr_..., aid_..., ses_..., adr_..., adm_...)
--   - Phone and email are normalized before persistence
--   - 1 User -> Many Auth Identities (PHONE, GOOGLE)
--   - Sessions store cryptographic token hash, never plaintext tokens
--   - Plaintext passwords or secrets are strictly forbidden
-- ==============================================================================

PRAGMA foreign_keys = ON;

-- ------------------------------------------------------------------------------
-- 1. Users Table (Core customer record)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    primary_phone TEXT UNIQUE,
    primary_email TEXT UNIQUE,
    full_name TEXT,
    onboarding_status TEXT NOT NULL DEFAULT 'AUTHENTICATED' 
        CHECK (onboarding_status IN ('AUTHENTICATED', 'PHONE_REQUIRED', 'PROFILE_REQUIRED', 'COMPLETED')),
    status TEXT NOT NULL DEFAULT 'ACTIVE' 
        CHECK (status IN ('ACTIVE', 'SUSPENDED', 'DELETION_PENDING', 'ANONYMIZED')),
    terms_accepted_at TEXT,
    privacy_accepted_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- ------------------------------------------------------------------------------
-- 2. Auth Identities Table (Account linking: Phone OTP, Google OAuth)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auth_identities (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('PHONE', 'GOOGLE', 'EMAIL_OTP')),
    provider_subject TEXT NOT NULL,
    normalized_identifier TEXT,
    verified_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(provider, provider_subject)
);

CREATE INDEX IF NOT EXISTS idx_auth_identities_user_id ON auth_identities(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_identities_provider_lookup ON auth_identities(provider, normalized_identifier);

-- ------------------------------------------------------------------------------
-- 3. Sessions Table (Hashed bearer session tracking)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    user_agent TEXT,
    ip_address TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL,
    revoked_at TEXT,
    revocation_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_active ON sessions(user_id, expires_at) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);

-- ------------------------------------------------------------------------------
-- 4. Addresses Table (Shipping, billing, profile addresses)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS addresses (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    line1 TEXT NOT NULL,
    line2 TEXT,
    landmark TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    country_code TEXT NOT NULL DEFAULT 'IN',
    type TEXT NOT NULL DEFAULT 'SHIPPING' CHECK (type IN ('SHIPPING', 'BILLING', 'PROFILE')),
    is_default INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id, is_default);

-- ------------------------------------------------------------------------------
-- 5. Admin Users Table (Privileged operational users with RBAC)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'SUPPORT_AGENT' 
        CHECK (role IN ('SUPER_ADMIN', 'OPS_ADMIN', 'SUPPORT_AGENT', 'FINANCE_ADMIN', 'CONTENT_EDITOR', 'STATUS_MANAGER', 'READ_ONLY_ANALYST')),
    status TEXT NOT NULL DEFAULT 'ACTIVE' 
        CHECK (status IN ('ACTIVE', 'SUSPENDED', 'DEACTIVATED')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role, status);
