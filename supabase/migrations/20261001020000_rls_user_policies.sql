-- ============================================================================
-- VAAHANSAFE USER SCOPED RLS POLICIES FOR SUBSYSTEMS
-- Adds explicit authenticated user policies for replacement, orders, and entitlements
-- ============================================================================

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can manage own replacement requests" ON public.replacement_requests;
  DROP POLICY IF EXISTS "Users can view own service entitlements" ON public.service_entitlements;
  DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
  DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
  DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
  DROP POLICY IF EXISTS "Public can view active qr stickers" ON public.qr_stickers;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Users can manage own replacement requests" 
  ON public.replacement_requests FOR ALL 
  TO authenticated 
  USING (user_id = (SELECT auth.uid())::text)
  WITH CHECK (user_id = (SELECT auth.uid())::text);

CREATE POLICY "Users can view own service entitlements" 
  ON public.service_entitlements FOR SELECT 
  TO authenticated 
  USING (user_id = (SELECT auth.uid())::text);

CREATE POLICY "Users can view own subscriptions" 
  ON public.subscriptions FOR SELECT 
  TO authenticated 
  USING (user_id = (SELECT auth.uid())::text);

CREATE POLICY "Users can view own order items" 
  ON public.order_items FOR SELECT 
  TO authenticated 
  USING (order_id IN (SELECT id FROM public.orders WHERE user_id = (SELECT auth.uid())::text));

CREATE POLICY "Users can view own payments" 
  ON public.payments FOR SELECT 
  TO authenticated 
  USING (order_id IN (SELECT id FROM public.orders WHERE user_id = (SELECT auth.uid())::text));

CREATE POLICY "Public can view active qr stickers" 
  ON public.qr_stickers FOR SELECT 
  TO public 
  USING (true);
