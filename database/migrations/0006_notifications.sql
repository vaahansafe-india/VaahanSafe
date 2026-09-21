-- ==============================================================================
-- Migration: 0006_notifications.sql
-- Description: Notification Orchestration, In-App Messaging, Deliveries & Preferences Schema
-- Engine: Cloudflare D1 (SQLite)
-- Invariants:
--   - Notifications are side effects; never authoritative business state
--   - OTP is strictly excluded from these tables (OTP belongs to authentication)
--   - Plaintext credentials and secrets must NEVER be persisted
--   - Dedupe keys prevent duplicate intent creation
--   - Channel deliveries track independent lifecycles
-- ==============================================================================

PRAGMA foreign_keys = ON;

-- ------------------------------------------------------------------------------
-- 1. Notification Intents Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notification_intents (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    recipient_user_id TEXT NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('ACCOUNT', 'SECURITY', 'SAFETY', 'COMMERCE', 'SUBSCRIPTION', 'FULFILMENT', 'SUPPORT', 'SYSTEM')),
    priority TEXT NOT NULL DEFAULT 'NORMAL' CHECK(priority IN ('LOW', 'NORMAL', 'HIGH', 'CRITICAL')),
    template_key TEXT NOT NULL,
    template_version INTEGER NOT NULL DEFAULT 1,
    payload_json TEXT NOT NULL,
    source_type TEXT NOT NULL,
    source_id TEXT NOT NULL,
    dedupe_key TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'QUEUED', 'PROCESSED', 'FAILED')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    dispatched_at TEXT,
    FOREIGN KEY (recipient_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notification_intents_recipient ON notification_intents(recipient_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_intents_status ON notification_intents(status, created_at ASC);

-- ------------------------------------------------------------------------------
-- 2. Canonical In-App Notifications Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    intent_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('ACCOUNT', 'SECURITY', 'SAFETY', 'COMMERCE', 'SUBSCRIPTION', 'FULFILMENT', 'SUPPORT', 'SYSTEM')),
    priority TEXT NOT NULL DEFAULT 'NORMAL' CHECK(priority IN ('LOW', 'NORMAL', 'HIGH', 'CRITICAL')),
    title TEXT NOT NULL,
    body_safe TEXT NOT NULL,
    action_type TEXT CHECK(action_type IN ('VIEW_QR', 'VIEW_ORDER', 'VIEW_SUBSCRIPTION', 'VIEW_SHIPMENT', 'VIEW_SUPPORT_TICKET', 'VIEW_SECURITY', 'NONE')),
    action_target TEXT,
    read_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (intent_id) REFERENCES notification_intents(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_intent ON notifications(intent_id);

-- ------------------------------------------------------------------------------
-- 3. Notification Deliveries Table (Per-channel lifecycle)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notification_deliveries (
    id TEXT PRIMARY KEY,
    intent_id TEXT NOT NULL,
    notification_id TEXT,
    channel TEXT NOT NULL CHECK(channel IN ('IN_APP', 'WHATSAPP', 'EMAIL')),
    provider TEXT NOT NULL CHECK(provider IN ('INTERNAL', 'MSG91', 'EMAIL_PROVIDER', 'TEST_STUB')),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'QUEUED', 'PROCESSING', 'DELIVERED', 'FAILED_RETRYABLE', 'FAILED_PERMANENT', 'DEAD_LETTERED', 'SUPPRESSED')),
    provider_message_id TEXT,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    last_failure_code TEXT,
    next_attempt_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    delivered_at TEXT,
    FOREIGN KEY (intent_id) REFERENCES notification_intents(id) ON DELETE CASCADE,
    FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE SET NULL,
    UNIQUE (intent_id, channel)
);

CREATE INDEX IF NOT EXISTS idx_deliveries_status ON notification_deliveries(status, next_attempt_at);
CREATE INDEX IF NOT EXISTS idx_deliveries_provider_msg ON notification_deliveries(provider, provider_message_id) WHERE provider_message_id IS NOT NULL;

-- ------------------------------------------------------------------------------
-- 4. Notification Delivery Attempts Table (Diagnostic history)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notification_delivery_attempts (
    id TEXT PRIMARY KEY,
    delivery_id TEXT NOT NULL,
    attempt_number INTEGER NOT NULL,
    started_at TEXT NOT NULL DEFAULT (datetime('now')),
    finished_at TEXT,
    result TEXT NOT NULL CHECK(result IN ('SUCCESS', 'RETRYABLE_FAILURE', 'PERMANENT_FAILURE')),
    normalized_error_code TEXT,
    provider_reference TEXT,
    request_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (delivery_id) REFERENCES notification_deliveries(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_delivery_attempts_delivery ON notification_delivery_attempts(delivery_id, attempt_number);

-- ------------------------------------------------------------------------------
-- 5. Notification Preferences Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notification_preferences (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('ACCOUNT', 'SECURITY', 'SAFETY', 'COMMERCE', 'SUBSCRIPTION', 'FULFILMENT', 'SUPPORT', 'SYSTEM')),
    channel TEXT NOT NULL CHECK(channel IN ('IN_APP', 'WHATSAPP', 'EMAIL')),
    enabled INTEGER NOT NULL DEFAULT 1 CHECK(enabled IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (user_id, category, channel)
);

CREATE INDEX IF NOT EXISTS idx_user_preferences ON notification_preferences(user_id);
