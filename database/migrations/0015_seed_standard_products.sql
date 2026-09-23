-- ==============================================================================
-- Migration: 0015_seed_standard_products.sql
-- Description: Authoritative Standard Products Catalog Seeding
-- Engine: Cloudflare D1 (SQLite)
-- ==============================================================================

PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO products (
    id,
    code,
    name,
    description,
    product_type,
    status,
    price_minor,
    currency,
    requires_shipping,
    requires_qr_allocation,
    created_at,
    updated_at
) VALUES 
(
    'prod_qr_sticker_kit',
    'PROD_QR_STICKER_INDIVIDUAL',
    'VaahanSafe Automotive Safety Kit',
    '2x UV-Laminated Weatherproof Physical QR Stickers with Cryptographic Safety Routing.',
    'PHYSICAL_QR_STICKER',
    'ACTIVE',
    49900,
    'INR',
    1,
    1,
    datetime('now'),
    datetime('now')
),
(
    'prod_replacement_kit',
    'PROD_QR_REPLACEMENT',
    'VaahanSafe Replacement Safety QR Kit',
    'Official replacement hardware kit for damaged or lost vehicle QR stickers.',
    'REPLACEMENT_STICKER',
    'ACTIVE',
    19900,
    'INR',
    1,
    1,
    datetime('now'),
    datetime('now')
),
(
    'prod_digital_pass',
    'PROD_QR_DIGITAL_PASS',
    'VaahanSafe Digital QR Wallet Pass',
    'Cryptographically signed emergency Apple & Google Wallet pass projection.',
    'DIGITAL_QR',
    'ACTIVE',
    0,
    'INR',
    0,
    0,
    datetime('now'),
    datetime('now')
);
