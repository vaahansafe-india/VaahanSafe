-- Close public execution of privileged RPCs installed by the initial migration.
-- The application must verify payment webhooks and retail possession on its server.
REVOKE EXECUTE ON FUNCTION public.ping_heartbeat(text, numeric, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.claim_retail_qr(text, text, uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.record_qr_scan(text, public.scan_event_type, text, text, text, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_auth_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ping_heartbeat(text, numeric, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_retail_qr(text, text, uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_qr_scan(text, public.scan_event_type, text, text, text, text, jsonb) TO service_role;

-- Account identity and verified-phone fields are written only by trusted auth code.
-- A Google account exists before its required phone verification is completed.
ALTER TABLE public.users ALTER COLUMN phone DROP NOT NULL;
UPDATE public.users SET phone = NULL WHERE phone = '';
REVOKE UPDATE ON public.users FROM authenticated;
GRANT UPDATE (full_name) ON public.users TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.media_assets FROM authenticated;

-- The initial view depended on owner-only RLS, so it could not safely serve an
-- anonymous resolver. Keep private contact data inaccessible until a dedicated
-- consent-aware projection is implemented.
REVOKE SELECT ON public.public_safety_view FROM anon, authenticated;

-- A sticker payment, the physical QR lifecycle, and a subscription tier are
-- separate facts. This table records the acquired QR capabilities only.
CREATE TABLE IF NOT EXISTS public.qr_service_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
  qr_sticker_id uuid NOT NULL REFERENCES public.qr_stickers(id) ON DELETE RESTRICT,
  capability text NOT NULL CHECK (capability IN
    ('DIGITAL_QR_ACCESS', 'SAFETY_VIEW_ACTIVE', 'EMERGENCY_ROUTING',
     'SCAN_HISTORY_LOGGING', 'REPLACEMENT_ELIGIBLE')),
  acquisition_source text NOT NULL CHECK (acquisition_source IN ('ONLINE_PAYMENT', 'RETAIL_PROOF')),
  payment_id uuid REFERENCES public.payments(id) ON DELETE RESTRICT,
  enabled_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT qr_entitlement_acquisition_check CHECK (
    (acquisition_source = 'ONLINE_PAYMENT' AND payment_id IS NOT NULL)
    OR (acquisition_source = 'RETAIL_PROOF' AND payment_id IS NULL)
  )
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_qr_capability
  ON public.qr_service_entitlements(qr_sticker_id, capability)
  WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_qr_entitlements_owner
  ON public.qr_service_entitlements(user_id, vehicle_id, enabled_at DESC)
  WHERE revoked_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_qr_per_vehicle
  ON public.qr_stickers(vehicle_id)
  WHERE lifecycle_state = 'ACTIVATED' AND vehicle_id IS NOT NULL;
ALTER TABLE public.qr_service_entitlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY qr_entitlements_owner_read ON public.qr_service_entitlements
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
GRANT SELECT ON public.qr_service_entitlements TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.qr_service_entitlements FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.validate_qr_entitlement()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  v_qr record;
  v_payment record;
BEGIN
  SELECT user_id, vehicle_id, lifecycle_state INTO v_qr
  FROM public.qr_stickers WHERE id = NEW.qr_sticker_id;
  IF v_qr.user_id IS DISTINCT FROM NEW.user_id
     OR v_qr.vehicle_id IS DISTINCT FROM NEW.vehicle_id
     OR v_qr.lifecycle_state <> 'ACTIVATED'
     OR NOT EXISTS (SELECT 1 FROM public.vehicles v
                    WHERE v.id = NEW.vehicle_id AND v.user_id = NEW.user_id AND v.is_active)
  THEN
    RAISE EXCEPTION 'QR entitlement requires an active owned vehicle and bound QR';
  END IF;

  IF NEW.acquisition_source = 'ONLINE_PAYMENT' THEN
    SELECT p.status, p.amount, p.currency, o.user_id, o.total_amount, o.currency AS order_currency
    INTO v_payment FROM public.payments p
    JOIN public.orders o ON o.id = p.order_id
    WHERE p.id = NEW.payment_id;
    IF v_payment.status IS DISTINCT FROM 'PAID'::public.payment_state
       OR v_payment.user_id IS DISTINCT FROM NEW.user_id
       OR v_payment.amount IS DISTINCT FROM v_payment.total_amount
       OR v_payment.currency IS DISTINCT FROM v_payment.order_currency
    THEN
      RAISE EXCEPTION 'Verified payment and matching order required for online QR entitlement';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_validate_qr_entitlement ON public.qr_service_entitlements;
CREATE TRIGGER trg_validate_qr_entitlement
  BEFORE INSERT OR UPDATE OF user_id, vehicle_id, qr_sticker_id, acquisition_source, payment_id, revoked_at
  ON public.qr_service_entitlements FOR EACH ROW
  EXECUTE FUNCTION public.validate_qr_entitlement();
REVOKE EXECUTE ON FUNCTION public.validate_qr_entitlement() FROM PUBLIC, anon, authenticated;

-- No sticker purchase or retail claim grants an unrelated paid plan.
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS source_payment_id uuid
  REFERENCES public.payments(id) ON DELETE RESTRICT;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscription_period_valid
  CHECK (current_period_end > current_period_start);
CREATE INDEX IF NOT EXISTS idx_subscription_vehicle_period
  ON public.subscriptions(vehicle_id, current_period_end DESC)
  WHERE vehicle_id IS NOT NULL;
CREATE OR REPLACE FUNCTION public.validate_subscription_payment()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF NEW.tier IN ('TIER_STANDARD', 'TIER_PREMIUM') AND NOT EXISTS (
    SELECT 1 FROM public.payments p
    JOIN public.orders o ON o.id = p.order_id
    WHERE p.id = NEW.source_payment_id
      AND p.status = 'PAID'
      AND p.amount = o.total_amount
      AND p.currency = o.currency
      AND o.user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'Paid subscription tier requires a verified matching payment';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_validate_subscription_payment ON public.subscriptions;
CREATE TRIGGER trg_validate_subscription_payment
  BEFORE INSERT OR UPDATE OF tier, source_payment_id, user_id
  ON public.subscriptions FOR EACH ROW
  EXECUTE FUNCTION public.validate_subscription_payment();
REVOKE EXECUTE ON FUNCTION public.validate_subscription_payment() FROM PUBLIC, anon, authenticated;

-- Supersede the original retail claim. Only distributed stock with a stored
-- nonempty hash can be claimed. The caller is a trusted server after Turnstile
-- and MSG91 checks; the database still enforces ownership and atomicity.
CREATE OR REPLACE FUNCTION public.claim_retail_qr(
  p_public_code text, p_secret_hash text, p_user_id uuid, p_vehicle_id uuid
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_qr record;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = p_user_id
                 AND u.phone_verified_at IS NOT NULL AND u.status = 'ACTIVE')
     OR NOT EXISTS (SELECT 1 FROM public.vehicles v WHERE v.id = p_vehicle_id
                    AND v.user_id = p_user_id AND v.is_active)
  THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_ELIGIBLE');
  END IF;

  SELECT id, lifecycle_state, activation_secret_hash, activation_attempts
    INTO v_qr FROM public.qr_stickers WHERE public_code = p_public_code FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_ELIGIBLE');
  END IF;
  IF v_qr.lifecycle_state <> 'DISTRIBUTED'
     OR v_qr.activation_secret_hash IS NULL OR v_qr.activation_secret_hash = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_ELIGIBLE');
  END IF;
  IF v_qr.activation_attempts >= 5 THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_ELIGIBLE');
  END IF;
  IF p_secret_hash IS NULL OR p_secret_hash = '' OR v_qr.activation_secret_hash <> p_secret_hash THEN
    UPDATE public.qr_stickers SET activation_attempts = activation_attempts + 1,
      lifecycle_state = CASE WHEN activation_attempts + 1 >= 5 THEN 'BLOCKED'::public.qr_lifecycle_state
                             ELSE lifecycle_state END
    WHERE id = v_qr.id;
    RETURN jsonb_build_object('success', false, 'error', 'NOT_ELIGIBLE');
  END IF;

  UPDATE public.qr_stickers SET user_id = p_user_id, vehicle_id = p_vehicle_id,
    lifecycle_state = 'ACTIVATED', activated_at = now(), activation_attempts = 0
  WHERE id = v_qr.id AND lifecycle_state = 'DISTRIBUTED';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_ELIGIBLE');
  END IF;
  INSERT INTO public.qr_service_entitlements
    (user_id, vehicle_id, qr_sticker_id, capability, acquisition_source)
  SELECT p_user_id, p_vehicle_id, v_qr.id, capability, 'RETAIL_PROOF'
  FROM (VALUES ('DIGITAL_QR_ACCESS'), ('SAFETY_VIEW_ACTIVE'),
               ('EMERGENCY_ROUTING'), ('SCAN_HISTORY_LOGGING')) AS c(capability);
  RETURN jsonb_build_object('success', true, 'qr_id', v_qr.id, 'vehicle_id', p_vehicle_id);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.claim_retail_qr(text, text, uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_retail_qr(text, text, uuid, uuid) TO service_role;

-- The browser cannot claim an entitlement by inventing a user ID.
CREATE OR REPLACE FUNCTION public.can_use_qr_service(
  p_vehicle_id uuid, p_qr_sticker_id uuid, p_capability text
) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT (SELECT auth.uid()) IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.qr_service_entitlements e
      JOIN public.vehicles v ON v.id = e.vehicle_id
      JOIN public.qr_stickers q ON q.id = e.qr_sticker_id
      WHERE e.vehicle_id = p_vehicle_id AND e.qr_sticker_id = p_qr_sticker_id
        AND e.capability = p_capability AND e.revoked_at IS NULL
        AND e.user_id = (SELECT auth.uid()) AND v.user_id = (SELECT auth.uid())
        AND v.is_active AND q.lifecycle_state = 'ACTIVATED'
    );
$$;
REVOKE EXECUTE ON FUNCTION public.can_use_qr_service(uuid, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_use_qr_service(uuid, uuid, text) TO authenticated;

-- Allow the edge monitor to read a bounded recent history. Writes remain
-- service-role only and every failed probe must be surfaced as a failure.
CREATE INDEX IF NOT EXISTS idx_status_heartbeats_service_checked
  ON public.status_heartbeats(service_name, checked_at DESC);

-- Supabase Auth owns identity truth. Google profile metadata is display-only;
-- only auth.users.phone_confirmed_at is allowed to satisfy the phone gate.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.users
    (id, phone, phone_verified_at, email, email_verified_at, full_name, role, status)
  VALUES
    (NEW.id, NULLIF(NEW.phone, ''), NEW.phone_confirmed_at,
     NEW.email, NEW.email_confirmed_at,
     COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
              NULLIF(NEW.raw_user_meta_data->>'name', ''),
              NULLIF(split_part(COALESCE(NEW.email, ''), '@', 1), ''), 'VaahanSafe User'),
     'CUSTOMER',
     CASE WHEN NEW.phone_confirmed_at IS NULL THEN 'PENDING_VERIFICATION'::public.user_status
          ELSE 'ACTIVE'::public.user_status END)
  ON CONFLICT (id) DO UPDATE SET
    phone = EXCLUDED.phone,
    phone_verified_at = EXCLUDED.phone_verified_at,
    email = EXCLUDED.email,
    email_verified_at = EXCLUDED.email_verified_at,
    status = CASE WHEN public.users.status IN ('SUSPENDED', 'DEACTIVATED')
                  THEN public.users.status ELSE EXCLUDED.status END;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.handle_new_auth_user() FROM PUBLIC, anon, authenticated;
