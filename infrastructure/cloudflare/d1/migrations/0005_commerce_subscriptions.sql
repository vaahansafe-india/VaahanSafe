-- ==============================================================================
-- Migration: 0005_commerce_subscriptions.sql
-- Description: Commerce, Orders, Payments, Subscriptions & Entitlements Schema
-- Engine: Cloudflare D1 (SQLite)
-- Invariants:
--   - Product != Plan != Order != Payment != Subscription != Entitlement != QR Inventory
--   - All monetary values are strictly INTEGER minor units (paise in INR); NEVER REAL/FLOAT
--   - Server is authoritative for final order prices and payment reconciliation
--   - Subscriptions are independent of physical QR stickers (QR identity not deleted on expiry)
-- ==============================================================================

PRAGMA foreign_keys = ON;

-- ------------------------------------------------------------------------------
-- 1. Product Catalog Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    product_type TEXT NOT NULL 
        CHECK (product_type IN ('PHYSICAL_QR_STICKER', 'DIGITAL_QR', 'REPLACEMENT_STICKER')),
    status TEXT NOT NULL DEFAULT 'ACTIVE' 
        CHECK (status IN ('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED')),
    price_minor INTEGER NOT NULL CHECK (price_minor >= 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    requires_shipping INTEGER NOT NULL DEFAULT 0 CHECK (requires_shipping IN (0, 1)),
    requires_qr_allocation INTEGER NOT NULL DEFAULT 0 CHECK (requires_qr_allocation IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_products_type_status ON products(product_type, status);
CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);

-- ------------------------------------------------------------------------------
-- 2. Commercial Plans Table (Subscription tiers)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    billing_interval TEXT NOT NULL DEFAULT 'ANNUAL' 
        CHECK (billing_interval IN ('ANNUAL', 'MONTHLY')),
    price_minor INTEGER NOT NULL CHECK (price_minor >= 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    vehicle_limit INTEGER NOT NULL DEFAULT 1 CHECK (vehicle_limit >= 1),
    contact_limit INTEGER NOT NULL DEFAULT 3 CHECK (contact_limit >= 1),
    features_json TEXT,
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_plans_code_active ON plans(code, is_active);

-- ------------------------------------------------------------------------------
-- 3. Orders Table (Commercial Transactions)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    order_number TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'DRAFT' 
        CHECK (status IN (
            'DRAFT',
            'PENDING_PAYMENT',
            'PAID',
            'FULFILMENT_PENDING',
            'FULFILLED',
            'PAYMENT_FAILED',
            'EXPIRED',
            'REFUNDED',
            'CANCELLED'
        )),
    currency TEXT NOT NULL DEFAULT 'INR',
    subtotal_minor INTEGER NOT NULL CHECK (subtotal_minor >= 0),
    discount_minor INTEGER NOT NULL DEFAULT 0 CHECK (discount_minor >= 0),
    shipping_minor INTEGER NOT NULL DEFAULT 0 CHECK (shipping_minor >= 0),
    tax_minor INTEGER NOT NULL DEFAULT 0 CHECK (tax_minor >= 0),
    total_minor INTEGER NOT NULL CHECK (total_minor >= 0),
    shipping_address_id TEXT REFERENCES addresses(id) ON DELETE RESTRICT,
    vehicle_id TEXT REFERENCES vehicles(id) ON DELETE SET NULL,
    idempotency_key TEXT UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    paid_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_idempotency ON orders(idempotency_key);

-- ------------------------------------------------------------------------------
-- 4. Order Items Table (Immutable line items & purchase snapshots)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL 
        CHECK (item_type IN ('PRODUCT', 'PLAN', 'REPLACEMENT_FEE', 'SHIPPING_FEE')),
    product_id TEXT REFERENCES products(id) ON DELETE RESTRICT,
    plan_id TEXT REFERENCES plans(id) ON DELETE RESTRICT,
    catalog_code TEXT NOT NULL,
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price_minor INTEGER NOT NULL CHECK (unit_price_minor >= 0),
    total_price_minor INTEGER NOT NULL CHECK (total_price_minor >= 0),
    snapshot_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- ------------------------------------------------------------------------------
-- 5. Payments Table (Financial attempts & states)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    provider TEXT NOT NULL DEFAULT 'CASHFREE' 
        CHECK (provider IN ('CASHFREE', 'INTERNAL', 'MANUAL')),
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

CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_ref ON payments(provider, provider_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- ------------------------------------------------------------------------------
-- 6. Payment Webhook Events Table (Deduplication & audit)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_webhook_events (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL DEFAULT 'CASHFREE',
    provider_event_id TEXT,
    event_type TEXT NOT NULL,
    provider_order_id TEXT,
    provider_payment_id TEXT,
    processing_status TEXT NOT NULL DEFAULT 'RECEIVED' 
        CHECK (processing_status IN ('RECEIVED', 'PROCESSED', 'DUPLICATE', 'IGNORED', 'FAILED')),
    received_at TEXT NOT NULL DEFAULT (datetime('now')),
    processed_at TEXT,
    request_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_payment_webhooks_dedupe 
    ON payment_webhook_events(provider, provider_event_id);
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_order 
    ON payment_webhook_events(provider_order_id);

-- ------------------------------------------------------------------------------
-- 7. Refunds Table (Financial refund records)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS refunds (
    id TEXT PRIMARY KEY,
    payment_id TEXT NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    provider TEXT NOT NULL DEFAULT 'CASHFREE',
    provider_refund_id TEXT,
    amount_minor INTEGER NOT NULL CHECK (amount_minor > 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'REQUESTED' 
        CHECK (status IN ('REQUESTED', 'PENDING', 'PROCESSED', 'FAILED', 'REJECTED')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_refunds_payment ON refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_refunds_order ON refunds(order_id);

-- ------------------------------------------------------------------------------
-- 8. Subscriptions Table (Time-bound service entitlements)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscriptions (
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
        CHECK (provider IN ('INTERNAL', 'CASHFREE')),
    provider_subscription_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_vehicle ON subscriptions(vehicle_id);

-- ------------------------------------------------------------------------------
-- 9. Subscription Events Table (Append-only lifecycle timeline)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscription_events (
    id TEXT PRIMARY KEY,
    subscription_id TEXT NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    payload_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_subscription_events_sub ON subscription_events(subscription_id, created_at);
