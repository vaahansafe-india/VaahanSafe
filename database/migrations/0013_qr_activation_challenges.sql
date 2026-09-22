-- ==============================================================================
-- Migration: 0013_qr_activation_challenges.sql
-- Description: Short-Lived Possession Verification Activation Challenges Schema
-- Engine: Cloudflare D1 (SQLite)
-- Invariants:
--   - Public ID != Activation Secret != Activation Challenge
--   - Challenge is short-lived (15 minutes TTL) and strictly single-use (consumed_at)
--   - Bearer token is NEVER stored in plaintext (challenge_token_hash only)
--   - Prevents race conditions and TOCTOU exploits during the identity binding ceremony
-- ==============================================================================

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS qr_activation_challenges (
    id TEXT PRIMARY KEY,
    challenge_token_hash TEXT NOT NULL UNIQUE,
    qr_id TEXT NOT NULL REFERENCES qr_stickers(id) ON DELETE CASCADE,
    public_id TEXT NOT NULL,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    proof_verified_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL,
    consumed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_qr_activation_challenges_token ON qr_activation_challenges(challenge_token_hash);
CREATE INDEX IF NOT EXISTS idx_qr_activation_challenges_qr ON qr_activation_challenges(qr_id);
CREATE INDEX IF NOT EXISTS idx_qr_activation_challenges_user ON qr_activation_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_qr_activation_challenges_expires ON qr_activation_challenges(expires_at);
