-- ============================================================================
-- VAAHANSAFE PRODUCTION POSTGRESQL DATABASE SCHEMA (SUPABASE)
-- Architecture: Multi-tenant, RLS-hardened, High-Entropy Identity & Safety Platform
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 01. CORE ENUMS & HELPER TYPES
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('CUSTOMER', 'FLEET_MANAGER', 'RETAILER', 'SUPPORT', 'ADMIN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE vehicle_type AS ENUM ('TWO_WHEELER', 'FOUR_WHEELER', 'COMMERCIAL', 'EMERGENCY_FLEET');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE qr_lifecycle_state AS ENUM (
    'INVENTORY', 'ALLOCATED', 'PRINTED', 'DISTRIBUTED', 
    'ASSIGNED', 'ACTIVATED', 'REPLACED', 'DAMAGED', 
    'LOST', 'BLOCKED', 'RETIRED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_state AS ENUM (
    'PENDING', 'PROCESSING', 'PAID', 'FAILED', 
    'CANCELLED', 'EXPIRED', 'REFUNDED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE subscription_tier AS ENUM (
    'TIER_FREE', 'TIER_STANDARD', 'TIER_PREMIUM', 
    'EXPIRED', 'GRACE_PERIOD'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE scan_event_type AS ENUM (
    'EMERGENCY_SCAN', 'PARKING_ALERT', 'CONTACT_CALL', 
    'ROUTINE_INSPECTION', 'SECURITY_CHECK'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 02. BASE FUNCTION: AUTOMATIC UPDATED_AT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 03. USERS & IDENTITY
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT UNIQUE NOT NULL,
  phone_verified_at TIMESTAMPTZ,
  email TEXT UNIQUE,
  email_verified_at TIMESTAMPTZ,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'CUSTOMER',
  status user_status NOT NULL DEFAULT 'ACTIVE',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users (phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users (status);

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 04. AUTH IDENTITIES (PHONE & GOOGLE OAUTH 2.0)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.auth_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'PHONE', 'GOOGLE'
  provider_user_id TEXT NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_auth_provider_uid UNIQUE (provider, provider_user_id)
);

CREATE INDEX IF NOT EXISTS idx_auth_identities_user_id ON public.auth_identities (user_id);

-- ============================================================================
-- 05. AUTH SESSIONS (RFC 6265 HTTPONLY COOKIES BACKEND)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON public.sessions (token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON public.sessions (expires_at);

-- ============================================================================
-- 06. VEHICLES (PROJECTION & OWNERSHIP)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  registration_number TEXT NOT NULL,
  vehicle_type vehicle_type NOT NULL DEFAULT 'FOUR_WHEELER',
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  color TEXT,
  manufacturing_year INT,
  fuel_type TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_vehicle_user_reg UNIQUE (user_id, registration_number)
);

CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON public.vehicles (user_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_reg_number ON public.vehicles (registration_number);

CREATE TRIGGER trg_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 07. QR STICKERS & LIFECYCLE (HIGH-ENTROPY OPAQUE IDENTIFIERS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.qr_stickers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_code TEXT UNIQUE NOT NULL, -- Opaque resolver slug: vs_xxxx
  internal_batch_id TEXT,
  qr_type TEXT NOT NULL DEFAULT 'PHYSICAL_STICKER', -- 'PHYSICAL_STICKER', 'DIGITAL_ONLY'
  lifecycle_state qr_lifecycle_state NOT NULL DEFAULT 'INVENTORY',
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  activation_secret_hash TEXT, -- Stored one-way hash of scratch card PIN
  activation_attempts INT NOT NULL DEFAULT 0,
  assigned_at TIMESTAMPTZ,
  activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qr_stickers_public_code ON public.qr_stickers (public_code);
CREATE INDEX IF NOT EXISTS idx_qr_stickers_vehicle_id ON public.qr_stickers (vehicle_id) WHERE vehicle_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_qr_stickers_user_id ON public.qr_stickers (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_qr_stickers_lifecycle ON public.qr_stickers (lifecycle_state);

CREATE TRIGGER trg_qr_stickers_updated_at
  BEFORE UPDATE ON public.qr_stickers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 08. EMERGENCY CONTACTS (PRIORITY-BASED ROUTING)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  relationship TEXT NOT NULL,
  priority INT NOT NULL DEFAULT 1,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emergency_contacts_vehicle_id ON public.emergency_contacts (vehicle_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id ON public.emergency_contacts (user_id);

CREATE TRIGGER trg_emergency_contacts_updated_at
  BEFORE UPDATE ON public.emergency_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 09. ORDERS & COMMERCE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  order_number TEXT UNIQUE NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'PENDING',
  payment_state payment_state NOT NULL DEFAULT 'PENDING',
  shipping_name TEXT,
  shipping_phone TEXT,
  shipping_address_line1 TEXT,
  shipping_address_line2 TEXT,
  shipping_city TEXT,
  shipping_state TEXT,
  shipping_postal_code TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders (order_number);
CREATE INDEX IF NOT EXISTS idx_orders_payment_state ON public.orders (payment_state);

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items (order_id);

-- ============================================================================
-- 10. PAYMENTS & AUTHORITATIVE IDEMPOTENCY
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  provider TEXT NOT NULL, -- 'CASHFREE', 'RAZORPAY'
  provider_payment_id TEXT UNIQUE,
  provider_order_id TEXT,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status payment_state NOT NULL DEFAULT 'PENDING',
  raw_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments (order_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_id ON public.payments (provider, provider_payment_id);

CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  provider_event_id TEXT UNIQUE NOT NULL, -- Deduplication key
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_events_provider_event ON public.payment_events (provider, provider_event_id);

-- ============================================================================
-- 11. SUBSCRIPTIONS & SERVICE ENTITLEMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  tier subscription_tier NOT NULL DEFAULT 'TIER_FREE',
  billing_interval TEXT NOT NULL DEFAULT 'ANNUAL',
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_vehicle_id ON public.subscriptions (vehicle_id) WHERE vehicle_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subscriptions_tier ON public.subscriptions (tier);

CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.plan_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  capability TEXT NOT NULL, -- 'DIGITAL_QR_ACCESS', 'SAFETY_VIEW_ACTIVE', 'EMERGENCY_ROUTING', 'SCAN_HISTORY_LOGGING'
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  quota INT,
  quota_used INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_sub_capability UNIQUE (subscription_id, capability)
);

CREATE INDEX IF NOT EXISTS idx_plan_entitlements_sub ON public.plan_entitlements (subscription_id);

-- ============================================================================
-- 12. SCAN EVENTS (PASSERBY ALERTS & EMERGENCY TELEMETRY)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.scan_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_sticker_id UUID NOT NULL REFERENCES public.qr_stickers(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  event_type scan_event_type NOT NULL DEFAULT 'EMERGENCY_SCAN',
  scanner_ip_hash TEXT NOT NULL,
  scanner_user_agent TEXT,
  scanner_city TEXT,
  scanner_state TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scan_events_qr ON public.scan_events (qr_sticker_id);
CREATE INDEX IF NOT EXISTS idx_scan_events_vehicle ON public.scan_events (vehicle_id);
CREATE INDEX IF NOT EXISTS idx_scan_events_created ON public.scan_events (created_at DESC);

-- ============================================================================
-- 13. STATUS HEARTBEATS & CLOUDFLARE UPTIME KEEP-ALIVE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.status_heartbeats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL DEFAULT 'supabase_database',
  status TEXT NOT NULL DEFAULT 'OPERATIONAL', -- 'OPERATIONAL', 'DEGRADED', 'DOWN'
  latency_ms NUMERIC(8, 2) NOT NULL DEFAULT 0,
  message TEXT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_status_heartbeats_checked ON public.status_heartbeats (checked_at DESC);

-- ============================================================================
-- 14. AUDIT LOGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs (created_at DESC);

-- ============================================================================
-- 15. STORED PROCEDURES & BUSINESS LOGIC FUNCTIONS
-- ============================================================================

-- A. Database Keep-Alive & Status Ping RPC (Called by Cloudflare Cron Worker)
CREATE OR REPLACE FUNCTION public.ping_heartbeat(
  p_service_name TEXT DEFAULT 'supabase_database',
  p_latency_ms NUMERIC DEFAULT 0,
  p_message TEXT DEFAULT 'Uptime keep-alive ping from Cloudflare Edge'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_heartbeat_id UUID;
  v_retention_cutoff TIMESTAMPTZ;
BEGIN
  -- Insert fresh heartbeat
  INSERT INTO public.status_heartbeats (service_name, status, latency_ms, message, checked_at)
  VALUES (p_service_name, 'OPERATIONAL', p_latency_ms, p_message, NOW())
  RETURNING id INTO v_heartbeat_id;

  -- Trim heartbeats older than 30 days to prevent table bloat
  v_retention_cutoff := NOW() - INTERVAL '30 days';
  DELETE FROM public.status_heartbeats WHERE checked_at < v_retention_cutoff;

  RETURN jsonb_build_object(
    'success', true,
    'heartbeat_id', v_heartbeat_id,
    'status', 'OPERATIONAL',
    'timestamp', NOW()
  );
END;
$$;

-- B. Atomic Scan Logger Function
CREATE OR REPLACE FUNCTION public.record_qr_scan(
  p_public_code TEXT,
  p_event_type scan_event_type,
  p_scanner_ip_hash TEXT,
  p_user_agent TEXT,
  p_city TEXT DEFAULT NULL,
  p_state TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_qr RECORD;
  v_scan_id UUID;
BEGIN
  -- Fetch QR and vehicle
  SELECT q.id AS qr_id, q.vehicle_id, q.lifecycle_state, v.is_active
  INTO v_qr
  FROM public.qr_stickers q
  LEFT JOIN public.vehicles v ON q.vehicle_id = v.id
  WHERE q.public_code = p_public_code;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'QR_NOT_FOUND');
  END IF;

  IF v_qr.lifecycle_state != 'ACTIVATED' OR v_qr.vehicle_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'QR_NOT_ACTIVATED');
  END IF;

  -- Record scan event atomically
  INSERT INTO public.scan_events (
    qr_sticker_id, vehicle_id, event_type,
    scanner_ip_hash, scanner_user_agent, scanner_city, scanner_state, metadata
  ) VALUES (
    v_qr.qr_id, v_qr.vehicle_id, p_event_type,
    p_scanner_ip_hash, p_user_agent, p_city, p_state, p_metadata
  )
  RETURNING id INTO v_scan_id;

  RETURN jsonb_build_object(
    'success', true,
    'scan_id', v_scan_id,
    'vehicle_id', v_qr.vehicle_id
  );
END;
$$;

-- C. Retail QR Activation Secret Verification & Claiming
CREATE OR REPLACE FUNCTION public.claim_retail_qr(
  p_public_code TEXT,
  p_secret_hash TEXT,
  p_user_id UUID,
  p_vehicle_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_qr RECORD;
  v_vehicle RECORD;
BEGIN
  -- 1. Check vehicle ownership
  SELECT id, user_id INTO v_vehicle
  FROM public.vehicles
  WHERE id = p_vehicle_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'UNAUTHORIZED_VEHICLE');
  END IF;

  -- 2. Fetch and lock QR record
  SELECT id, lifecycle_state, activation_secret_hash, activation_attempts
  INTO v_qr
  FROM public.qr_stickers
  WHERE public_code = p_public_code
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'QR_NOT_FOUND');
  END IF;

  IF v_qr.lifecycle_state != 'DISTRIBUTED' AND v_qr.lifecycle_state != 'INVENTORY' THEN
    RETURN jsonb_build_object('success', false, 'error', 'QR_ALREADY_CLAIMED');
  END IF;

  -- 3. Rate limiting / guessing protection
  IF v_qr.activation_attempts >= 5 THEN
    UPDATE public.qr_stickers
    SET lifecycle_state = 'BLOCKED'
    WHERE id = v_qr.id;
    RETURN jsonb_build_object('success', false, 'error', 'TOO_MANY_FAILED_ATTEMPTS');
  END IF;

  -- 4. Check secret hash
  IF v_qr.activation_secret_hash IS NOT NULL AND v_qr.activation_secret_hash != p_secret_hash THEN
    UPDATE public.qr_stickers
    SET activation_attempts = activation_attempts + 1
    WHERE id = v_qr.id;
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_ACTIVATION_PROOF');
  END IF;

  -- 5. Atomic Claim & Binding
  UPDATE public.qr_stickers
  SET user_id = p_user_id,
      vehicle_id = p_vehicle_id,
      lifecycle_state = 'ACTIVATED',
      activated_at = NOW(),
      activation_attempts = 0
  WHERE id = v_qr.id;

  -- 6. Create default subscription & entitlements
  INSERT INTO public.subscriptions (user_id, vehicle_id, tier, current_period_end)
  VALUES (p_user_id, p_vehicle_id, 'TIER_STANDARD', NOW() + INTERVAL '1 year');

  RETURN jsonb_build_object(
    'success', true,
    'qr_id', v_qr.id,
    'public_code', p_public_code,
    'vehicle_id', p_vehicle_id
  );
END;
$$;

-- ============================================================================
-- 16. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_stickers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_heartbeats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- USERS POLICIES
CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- VEHICLES POLICIES
CREATE POLICY "Users can view their own vehicles"
  ON public.vehicles FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert their own vehicles"
  ON public.vehicles FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own vehicles"
  ON public.vehicles FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own vehicles"
  ON public.vehicles FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- EMERGENCY CONTACTS POLICIES
CREATE POLICY "Users can view their own emergency contacts"
  ON public.emergency_contacts FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can manage their emergency contacts"
  ON public.emergency_contacts FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- ORDERS & ITEMS POLICIES
CREATE POLICY "Users can view their own orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can view their own order items"
  ON public.order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
      AND o.user_id = (SELECT auth.uid())
    )
  );

-- SUBSCRIPTIONS & ENTITLEMENTS POLICIES
CREATE POLICY "Users can view their own subscriptions"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can view their own plan entitlements"
  ON public.plan_entitlements FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.subscriptions s
      WHERE s.id = plan_entitlements.subscription_id
      AND s.user_id = (SELECT auth.uid())
    )
  );

-- SCAN EVENTS POLICIES
CREATE POLICY "Users can view scan events for their own vehicles"
  ON public.scan_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id = scan_events.vehicle_id
      AND v.user_id = (SELECT auth.uid())
    )
  );

-- PUBLIC ACCESS POLICIES (ANON)
-- Status heartbeats are publicly readable for the status page
CREATE POLICY "Public can view recent status heartbeats"
  ON public.status_heartbeats FOR SELECT
  TO anon, authenticated
  USING (true);

-- SAFE PUBLIC RESOLVER VIEW (Vehicles with active QR only)
CREATE OR REPLACE VIEW public.public_safety_view
WITH (security_invoker = true)
AS
SELECT
  q.public_code,
  v.registration_number,
  v.make,
  v.model,
  v.color,
  v.vehicle_type,
  c.name AS emergency_contact_name,
  c.phone AS emergency_contact_phone,
  c.relationship AS emergency_contact_relationship,
  c.priority AS emergency_contact_priority
FROM public.qr_stickers q
JOIN public.vehicles v ON q.vehicle_id = v.id
LEFT JOIN public.emergency_contacts c ON v.id = c.vehicle_id
WHERE q.lifecycle_state = 'ACTIVATED'
  AND v.is_active = true;

-- Grant access on public_safety_view to anon & authenticated
GRANT SELECT ON public.public_safety_view TO anon, authenticated;
GRANT SELECT ON public.status_heartbeats TO anon, authenticated;
