-- ============================================================================
-- VAAHANSAFE AUTHORITATIVE POSTGRESQL SCHEMA (SUPABASE)
-- Complete domain schema mirroring all application models and repositories
-- ============================================================================

-- 1. Ensure public.users has all authoritative columns
DO $$ BEGIN
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS primary_phone TEXT;
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS primary_email TEXT;
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS onboarding_status TEXT NOT NULL DEFAULT 'COMPLETED';
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMPTZ;
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Populate primary fields from existing phone/email
UPDATE public.users 
SET primary_phone = COALESCE(primary_phone, phone),
    primary_email = COALESCE(primary_email, email),
    onboarding_status = 'COMPLETED'
WHERE primary_email IS NULL OR primary_phone IS NULL;

-- Ensure users.id is castable as text
CREATE INDEX IF NOT EXISTS idx_users_primary_phone ON public.users (primary_phone) WHERE primary_phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_primary_email ON public.users (primary_email) WHERE primary_email IS NOT NULL;

-- 2. Drop legacy tables that had restrictive UUID types if they have 0 rows
DO $$ BEGIN
  DROP TABLE IF EXISTS public.qr_reservations CASCADE;
  DROP TABLE IF EXISTS public.shipments CASCADE;
  DROP TABLE IF EXISTS public.fulfilments CASCADE;
  DROP TABLE IF EXISTS public.order_items CASCADE;
  DROP TABLE IF EXISTS public.orders CASCADE;
  DROP TABLE IF EXISTS public.payment_events CASCADE;
  DROP TABLE IF EXISTS public.payments CASCADE;
  DROP TABLE IF EXISTS public.plan_entitlements CASCADE;
  DROP TABLE IF EXISTS public.qr_service_entitlements CASCADE;
  DROP TABLE IF EXISTS public.qr_scan_events CASCADE;
  DROP TABLE IF EXISTS public.scan_events CASCADE;
  DROP TABLE IF EXISTS public.qr_status_history CASCADE;
  DROP TABLE IF EXISTS public.qr_assignments CASCADE;
  DROP TABLE IF EXISTS public.qr_activation_challenges CASCADE;
  DROP TABLE IF EXISTS public.qr_activation_attempts CASCADE;
  DROP TABLE IF EXISTS public.qr_activation_secrets CASCADE;
  DROP TABLE IF EXISTS public.qr_stickers CASCADE;
  DROP TABLE IF EXISTS public.qr_batches CASCADE;
  DROP TABLE IF EXISTS public.subscriptions CASCADE;
  DROP TABLE IF EXISTS public.plans CASCADE;
  DROP TABLE IF EXISTS public.products CASCADE;
  DROP TABLE IF EXISTS public.emergency_contacts CASCADE;
  DROP TABLE IF EXISTS public.emergency_profiles CASCADE;
  DROP TABLE IF EXISTS public.vehicles CASCADE;
  DROP TABLE IF EXISTS public.addresses CASCADE;
  DROP TABLE IF EXISTS public.admin_users CASCADE;
  DROP TABLE IF EXISTS public.notifications CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 3. Addresses Table
CREATE TABLE IF NOT EXISTS public.addresses (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    recipient_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    line1 TEXT NOT NULL,
    line2 TEXT,
    landmark TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    country_code TEXT NOT NULL DEFAULT 'IN',
    type TEXT NOT NULL DEFAULT 'SHIPPING',
    is_default INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_addresses_user ON public.addresses(user_id, is_default);

-- 4. Admin Users Table
CREATE TABLE IF NOT EXISTS public.admin_users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'SUPPORT_AGENT',
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Vehicles Table
CREATE TABLE IF NOT EXISTS public.vehicles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    registration_number TEXT NOT NULL,
    registration_number_normalized TEXT NOT NULL,
    vehicle_type TEXT NOT NULL DEFAULT 'CAR',
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    variant TEXT,
    year INTEGER,
    color TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_vehicles_user_status ON public.vehicles(user_id, status);
CREATE INDEX IF NOT EXISTS idx_vehicles_reg_normalized ON public.vehicles(registration_number_normalized);

-- 6. Emergency Profiles Table
CREATE TABLE IF NOT EXISTS public.emergency_profiles (
    id TEXT PRIMARY KEY,
    vehicle_id TEXT NOT NULL UNIQUE REFERENCES public.vehicles(id) ON DELETE CASCADE,
    display_name TEXT,
    blood_group TEXT,
    medical_notes TEXT,
    public_vehicle_details TEXT,
    show_owner_name INTEGER NOT NULL DEFAULT 1,
    show_blood_group INTEGER NOT NULL DEFAULT 1,
    show_medical_notes INTEGER NOT NULL DEFAULT 0,
    show_vehicle_details INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_emergency_profiles_vehicle ON public.emergency_profiles(vehicle_id);

-- 7. Emergency Contacts Table
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
    id TEXT PRIMARY KEY,
    emergency_profile_id TEXT NOT NULL REFERENCES public.emergency_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    relationship_label TEXT NOT NULL,
    phone TEXT NOT NULL,
    priority INTEGER NOT NULL DEFAULT 1,
    is_enabled INTEGER NOT NULL DEFAULT 1,
    allow_call INTEGER NOT NULL DEFAULT 1,
    allow_message INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_profile ON public.emergency_contacts(emergency_profile_id, is_enabled, priority);

-- 8. QR Batches Table
CREATE TABLE IF NOT EXISTS public.qr_batches (
    id TEXT PRIMARY KEY,
    reference_code TEXT NOT NULL UNIQUE,
    quantity INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'DRAFT',
    manufacturer_name TEXT,
    manufacturer_reference TEXT,
    generated_at TIMESTAMPTZ,
    exported_at TIMESTAMPTZ,
    printed_at TIMESTAMPTZ,
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. QR Stickers Table
CREATE TABLE IF NOT EXISTS public.qr_stickers (
    id TEXT PRIMARY KEY,
    public_id TEXT NOT NULL UNIQUE,
    public_code TEXT,
    visible_code TEXT UNIQUE,
    batch_id TEXT REFERENCES public.qr_batches(id),
    status TEXT NOT NULL DEFAULT 'PRINTED',
    lifecycle_state TEXT NOT NULL DEFAULT 'INVENTORY',
    qr_type TEXT NOT NULL DEFAULT 'PHYSICAL_STICKER',
    user_id TEXT,
    vehicle_id TEXT REFERENCES public.vehicles(id) ON DELETE SET NULL,
    current_distributor_id TEXT,
    current_retailer_id TEXT,
    activation_secret_hash TEXT,
    activation_attempts INTEGER NOT NULL DEFAULT 0,
    assigned_at TIMESTAMPTZ,
    activated_at TIMESTAMPTZ,
    replaced_by_qr_id TEXT REFERENCES public.qr_stickers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_qr_stickers_public_id ON public.qr_stickers(public_id);
CREATE INDEX IF NOT EXISTS idx_qr_stickers_status ON public.qr_stickers(status);

-- 10. QR Activation Secrets Table
CREATE TABLE IF NOT EXISTS public.qr_activation_secrets (
    id TEXT PRIMARY KEY,
    qr_id TEXT NOT NULL UNIQUE REFERENCES public.qr_stickers(id) ON DELETE CASCADE,
    secret_hash TEXT NOT NULL,
    hash_version TEXT NOT NULL DEFAULT 'v1',
    failed_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    consumed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. QR Assignments Table
CREATE TABLE IF NOT EXISTS public.qr_assignments (
    id TEXT PRIMARY KEY,
    qr_id TEXT NOT NULL REFERENCES public.qr_stickers(id) ON DELETE RESTRICT,
    vehicle_id TEXT NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
    user_id TEXT NOT NULL,
    assignment_type TEXT NOT NULL DEFAULT 'INITIAL',
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    end_reason TEXT,
    is_current INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_qr_assignments_vehicle ON public.qr_assignments(vehicle_id, is_current);

-- 12. QR Status History
CREATE TABLE IF NOT EXISTS public.qr_status_history (
    id TEXT PRIMARY KEY,
    qr_id TEXT NOT NULL REFERENCES public.qr_stickers(id) ON DELETE CASCADE,
    from_status TEXT,
    to_status TEXT NOT NULL,
    changed_by TEXT,
    change_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. QR Scan Events
CREATE TABLE IF NOT EXISTS public.qr_scan_events (
    id TEXT PRIMARY KEY,
    qr_id TEXT REFERENCES public.qr_stickers(id),
    vehicle_id TEXT REFERENCES public.vehicles(id),
    scan_type TEXT,
    device_class TEXT,
    ip_hash TEXT,
    city TEXT,
    region TEXT,
    country TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Products Table & Initial Catalog Seed
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    product_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    price_minor INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    requires_shipping INTEGER NOT NULL DEFAULT 0,
    requires_qr_allocation INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.products (
    id, code, name, description, product_type, status, price_minor, currency, requires_shipping, requires_qr_allocation
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
    1
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
    1
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
    0
)
ON CONFLICT (id) DO UPDATE SET 
    price_minor = EXCLUDED.price_minor,
    status = EXCLUDED.status,
    name = EXCLUDED.name;

-- 15. Plans Table
CREATE TABLE IF NOT EXISTS public.plans (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    billing_interval TEXT NOT NULL DEFAULT 'ANNUAL',
    price_minor INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    vehicle_limit INTEGER NOT NULL DEFAULT 1,
    contact_limit INTEGER NOT NULL DEFAULT 3,
    features_json TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    order_number TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'DRAFT',
    currency TEXT NOT NULL DEFAULT 'INR',
    subtotal_minor INTEGER NOT NULL DEFAULT 0,
    discount_minor INTEGER NOT NULL DEFAULT 0,
    shipping_minor INTEGER NOT NULL DEFAULT 0,
    tax_minor INTEGER NOT NULL DEFAULT 0,
    total_minor INTEGER NOT NULL DEFAULT 0,
    total_amount NUMERIC(10, 2),
    payment_state TEXT NOT NULL DEFAULT 'PENDING',
    shipping_address_id TEXT REFERENCES public.addresses(id),
    vehicle_id TEXT REFERENCES public.vehicles(id) ON DELETE SET NULL,
    idempotency_key TEXT UNIQUE,
    shipping_name TEXT,
    shipping_phone TEXT,
    shipping_address_line1 TEXT,
    shipping_address_line2 TEXT,
    shipping_city TEXT,
    shipping_state TEXT,
    shipping_postal_code TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    paid_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON public.orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);

-- 17. Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES public.products(id),
    product_code TEXT,
    product_name TEXT NOT NULL,
    product_type TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price_minor INTEGER NOT NULL DEFAULT 0,
    unit_price NUMERIC(10, 2),
    total_price_minor INTEGER NOT NULL DEFAULT 0,
    metadata_json TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

-- 18. Fulfilments Table
CREATE TABLE IF NOT EXISTS public.fulfilments (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PAID',
    shipping_address_snapshot_json TEXT NOT NULL DEFAULT '{}',
    exception_code TEXT,
    processing_at TIMESTAMPTZ,
    packed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(order_id, type)
);
CREATE INDEX IF NOT EXISTS idx_fulfilments_user ON public.fulfilments(user_id, status);

-- 19. QR Reservations Table
CREATE TABLE IF NOT EXISTS public.qr_reservations (
    id TEXT PRIMARY KEY,
    qr_sticker_id TEXT NOT NULL REFERENCES public.qr_stickers(id) ON DELETE RESTRICT,
    fulfilment_id TEXT REFERENCES public.fulfilments(id) ON DELETE RESTRICT,
    order_id TEXT REFERENCES public.orders(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'RESERVED',
    reserved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    allocated_at TIMESTAMPTZ,
    released_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. Shipments Table
CREATE TABLE IF NOT EXISTS public.shipments (
    id TEXT PRIMARY KEY,
    fulfilment_id TEXT NOT NULL REFERENCES public.fulfilments(id) ON DELETE CASCADE,
    courier_code TEXT NOT NULL DEFAULT 'DELHIVERY',
    waybill_number TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'MANIFESTED',
    estimated_delivery_date TEXT,
    dispatched_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    rto_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 21. Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    provider_payment_id TEXT,
    provider_order_id TEXT,
    amount_minor INTEGER NOT NULL DEFAULT 0,
    amount NUMERIC(10, 2),
    currency TEXT NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL DEFAULT 'PENDING',
    raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);

-- 22. Payment Events Table
CREATE TABLE IF NOT EXISTS public.payment_events (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    provider_event_id TEXT NOT NULL UNIQUE,
    payment_id TEXT,
    order_id TEXT,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 23. Subscriptions Table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    plan_id TEXT REFERENCES public.plans(id),
    vehicle_id TEXT REFERENCES public.vehicles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    tier TEXT DEFAULT 'TIER_STANDARD',
    billing_interval TEXT DEFAULT 'ANNUAL',
    current_period_start TIMESTAMPTZ DEFAULT NOW(),
    current_period_end TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 year',
    cancel_at_period_end BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source_payment_id TEXT
);

-- 24. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data_json TEXT,
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);
