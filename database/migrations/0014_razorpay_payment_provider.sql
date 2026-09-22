-- ==============================================================================
-- Migration: 0014_razorpay_payment_provider.sql
-- Description: Enable Razorpay Payment Provider in D1 Schema
-- Engine: Cloudflare D1 (SQLite)
-- Invariants:
--   - Historical payments retain provider = 'CASHFREE' for financial audit integrity
--   - New transactions use provider = 'RAZORPAY'
--   - Subscriptions allow 'RAZORPAY' alongside 'INTERNAL' and 'CASHFREE'
-- ==============================================================================

PRAGMA foreign_keys = ON;

-- ------------------------------------------------------------------------------
-- 1. Update payments table to support 'RAZORPAY' provider
-- ------------------------------------------------------------------------------
ALTER TABLE payments RENAME TO payments_old;

CREATE TABLE payments (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    provider TEXT NOT NULL DEFAULT 'RAZORPAY' 
        CHECK (provider IN ('RAZORPAY', 'CASHFREE', 'INTERNAL', 'MANUAL')),
    provider_order_id TEXT,
    provider_payment_id TEXT,
    status TEXT NOT NULL DEFAULT 'CREATED' 
        CHECK (status IN (
            'CREATED',
            'PENDING',
            'SUCCESS',
            'FAILED',
            'EXPIRED',
            'REFUND_PENDING',
            'REFUNDED',
            'REFUND_FAILED'
        )),
    amount_minor INTEGER NOT NULL CHECK (amount_minor >= 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    attempt_number INTEGER NOT NULL DEFAULT 1 CHECK (attempt_number >= 1),
    payment_method TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    confirmed_at TEXT
);

INSERT INTO payments SELECT * FROM payments_old;
DROP TABLE payments_old;

CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_ref ON payments(provider, provider_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- ------------------------------------------------------------------------------
-- 2. Update subscriptions table to support 'RAZORPAY' provider
-- ------------------------------------------------------------------------------
ALTER TABLE subscriptions RENAME TO subscriptions_old;

CREATE TABLE subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    vehicle_id TEXT REFERENCES vehicles(id) ON DELETE SET NULL,
    plan_id TEXT NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'CREATED' 
        CHECK (status IN (
            'CREATED',
            'PENDING_PAYMENT',
            'ACTIVE',
            'PAST_DUE',
            'CANCEL_AT_PERIOD_END',
            'CANCELLED',
            'EXPIRED'
        )),
    current_period_start TEXT,
    current_period_end TEXT,
    cancel_at_period_end INTEGER NOT NULL DEFAULT 0 CHECK (cancel_at_period_end IN (0, 1)),
    provider TEXT NOT NULL DEFAULT 'INTERNAL' 
        CHECK (provider IN ('INTERNAL', 'RAZORPAY', 'CASHFREE')),
    provider_subscription_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO subscriptions SELECT * FROM subscriptions_old;
DROP TABLE subscriptions_old;

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_vehicle ON subscriptions(vehicle_id);

-- ------------------------------------------------------------------------------
-- 3. Update status_services description for payments
-- ------------------------------------------------------------------------------
UPDATE status_services
SET description = 'Authoritative order processing, Razorpay gateway checkout, and invoice generation.'
WHERE id = 'srv_payments';
