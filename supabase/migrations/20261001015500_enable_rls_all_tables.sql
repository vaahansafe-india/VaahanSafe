-- ============================================================================
-- VAAHANSAFE PRODUCTION DATABASE HARDENING: ROW LEVEL SECURITY (RLS)
-- Enables RLS on all public tables to eliminate UNRESTRICTED warnings
-- ============================================================================

-- 1. Enable RLS on all public tables
ALTER TABLE IF EXISTS public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.auth_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.emergency_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.fulfilments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notification_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notification_delivery_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notification_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payment_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.qr_activation_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.qr_activation_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.qr_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.qr_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.qr_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.qr_scan_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.qr_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.qr_stickers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.replacement_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.service_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.status_heartbeats ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sticker_replacements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.vehicles ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if any to avoid duplication
DO $$ BEGIN
  DROP POLICY IF EXISTS "Public read-only products" ON public.products;
  DROP POLICY IF EXISTS "Public read-only plans" ON public.plans;
  DROP POLICY IF EXISTS "Users can manage own vehicles" ON public.vehicles;
  DROP POLICY IF EXISTS "Users can manage own addresses" ON public.addresses;
  DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
  DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
  DROP POLICY IF EXISTS "Users can manage own emergency profiles" ON public.emergency_profiles;
  DROP POLICY IF EXISTS "Users can manage own emergency contacts" ON public.emergency_contacts;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 3. Public catalog policies
CREATE POLICY "Public read-only products" 
  ON public.products FOR SELECT 
  TO public 
  USING (true);

CREATE POLICY "Public read-only plans" 
  ON public.plans FOR SELECT 
  TO public 
  USING (true);

-- 4. User scoped policies
CREATE POLICY "Users can manage own vehicles" 
  ON public.vehicles FOR ALL 
  TO authenticated 
  USING (user_id = (SELECT auth.uid())::text)
  WITH CHECK (user_id = (SELECT auth.uid())::text);

CREATE POLICY "Users can manage own addresses" 
  ON public.addresses FOR ALL 
  TO authenticated 
  USING (user_id = (SELECT auth.uid())::text)
  WITH CHECK (user_id = (SELECT auth.uid())::text);

CREATE POLICY "Users can view own orders" 
  ON public.orders FOR SELECT 
  TO authenticated 
  USING (user_id = (SELECT auth.uid())::text);

CREATE POLICY "Users can view own notifications" 
  ON public.notifications FOR ALL 
  TO authenticated 
  USING (user_id = (SELECT auth.uid())::text)
  WITH CHECK (user_id = (SELECT auth.uid())::text);

CREATE POLICY "Users can manage own emergency profiles" 
  ON public.emergency_profiles FOR ALL 
  TO authenticated 
  USING (vehicle_id IN (SELECT id FROM public.vehicles WHERE user_id = (SELECT auth.uid())::text))
  WITH CHECK (vehicle_id IN (SELECT id FROM public.vehicles WHERE user_id = (SELECT auth.uid())::text));

CREATE POLICY "Users can manage own emergency contacts" 
  ON public.emergency_contacts FOR ALL 
  TO authenticated 
  USING (emergency_profile_id IN (
    SELECT ep.id FROM public.emergency_profiles ep 
    JOIN public.vehicles v ON ep.vehicle_id = v.id 
    WHERE v.user_id = (SELECT auth.uid())::text
  ))
  WITH CHECK (emergency_profile_id IN (
    SELECT ep.id FROM public.emergency_profiles ep 
    JOIN public.vehicles v ON ep.vehicle_id = v.id 
    WHERE v.user_id = (SELECT auth.uid())::text
  ));
