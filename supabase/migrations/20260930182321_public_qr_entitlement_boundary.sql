-- Resolver returns a minimum public projection only after an explicit QR
-- entitlement exists. A scan, QR image, or public identifier never grants use.
CREATE OR REPLACE FUNCTION public.resolve_public_qr(p_public_code text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_qr record;
DECLARE v_vehicle record;
BEGIN
  IF p_public_code IS NULL OR length(p_public_code) < 16 OR length(p_public_code) > 128 THEN
    RETURN jsonb_build_object('state', 'UNRECOGNIZED');
  END IF;
  SELECT q.id, q.lifecycle_state, q.vehicle_id, q.user_id INTO v_qr
  FROM public.qr_stickers q WHERE q.public_code = p_public_code;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('state', 'UNRECOGNIZED');
  END IF;
  IF v_qr.lifecycle_state = 'DISTRIBUTED' THEN
    RETURN jsonb_build_object('state', 'ACTIVATION_REQUIRED');
  END IF;
  IF v_qr.lifecycle_state <> 'ACTIVATED' THEN
    RETURN jsonb_build_object('state', 'UNAVAILABLE');
  END IF;
  SELECT v.id, v.registration_number, v.vehicle_type, v.make, v.model, v.color
    INTO v_vehicle FROM public.vehicles v
  JOIN public.users u ON u.id = v.user_id
  WHERE v.id = v_qr.vehicle_id AND v.user_id = v_qr.user_id
    AND v.is_active AND u.status = 'ACTIVE'
    AND EXISTS (SELECT 1 FROM public.qr_service_entitlements e
                WHERE e.qr_sticker_id = v_qr.id AND e.vehicle_id = v.id
                  AND e.user_id = v.user_id AND e.capability = 'SAFETY_VIEW_ACTIVE'
                  AND e.revoked_at IS NULL);
  IF NOT FOUND THEN
    RETURN jsonb_build_object('state', 'UNAVAILABLE');
  END IF;
  RETURN jsonb_build_object(
    'state', 'ACTIVE',
    'vehicle', jsonb_build_object(
      'registrationNumber', v_vehicle.registration_number,
      'type', v_vehicle.vehicle_type, 'make', v_vehicle.make,
      'model', v_vehicle.model, 'color', v_vehicle.color
    )
  );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.resolve_public_qr(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_public_qr(text) TO anon, authenticated;

-- Scan writes are server-only and require the same bound QR entitlement.
CREATE OR REPLACE FUNCTION public.record_qr_scan(
  p_public_code text, p_event_type public.scan_event_type,
  p_scanner_ip_hash text, p_user_agent text,
  p_city text DEFAULT NULL, p_state text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_qr record;
DECLARE v_scan_id uuid;
BEGIN
  SELECT q.id, q.vehicle_id INTO v_qr FROM public.qr_stickers q
  JOIN public.vehicles v ON v.id = q.vehicle_id AND v.user_id = q.user_id AND v.is_active
  JOIN public.users u ON u.id = q.user_id AND u.status = 'ACTIVE'
  WHERE q.public_code = p_public_code AND q.lifecycle_state = 'ACTIVATED'
    AND EXISTS (SELECT 1 FROM public.qr_service_entitlements e
                WHERE e.qr_sticker_id = q.id AND e.vehicle_id = v.id
                  AND e.user_id = q.user_id AND e.capability = 'SCAN_HISTORY_LOGGING'
                  AND e.revoked_at IS NULL);
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'UNAVAILABLE'); END IF;
  IF p_scanner_ip_hash IS NULL OR length(p_scanner_ip_hash) <> 64 THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_SCAN');
  END IF;
  INSERT INTO public.scan_events
    (qr_sticker_id, vehicle_id, event_type, scanner_ip_hash,
     scanner_user_agent, scanner_city, scanner_state, metadata)
  VALUES (v_qr.id, v_qr.vehicle_id, p_event_type, p_scanner_ip_hash,
          left(p_user_agent, 500), left(p_city, 100), left(p_state, 100),
          COALESCE(p_metadata, '{}'::jsonb)) RETURNING id INTO v_scan_id;
  RETURN jsonb_build_object('success', true, 'scan_id', v_scan_id);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.record_qr_scan(text, public.scan_event_type, text, text, text, text, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_qr_scan(text, public.scan_event_type, text, text, text, text, jsonb)
  TO service_role;

-- Financial records, QR history, and scan evidence must survive user changes.
DROP POLICY IF EXISTS "Users can delete their own vehicles" ON public.vehicles;
ALTER TABLE public.vehicles DROP CONSTRAINT vehicles_user_id_fkey;
ALTER TABLE public.vehicles ADD CONSTRAINT vehicles_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE RESTRICT;
ALTER TABLE public.qr_stickers DROP CONSTRAINT qr_stickers_user_id_fkey;
ALTER TABLE public.qr_stickers ADD CONSTRAINT qr_stickers_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE RESTRICT;
ALTER TABLE public.qr_stickers DROP CONSTRAINT qr_stickers_vehicle_id_fkey;
ALTER TABLE public.qr_stickers ADD CONSTRAINT qr_stickers_vehicle_id_fkey
  FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE RESTRICT;
ALTER TABLE public.scan_events DROP CONSTRAINT scan_events_qr_sticker_id_fkey;
ALTER TABLE public.scan_events ADD CONSTRAINT scan_events_qr_sticker_id_fkey
  FOREIGN KEY (qr_sticker_id) REFERENCES public.qr_stickers(id) ON DELETE RESTRICT;
ALTER TABLE public.scan_events DROP CONSTRAINT scan_events_vehicle_id_fkey;
ALTER TABLE public.scan_events ADD CONSTRAINT scan_events_vehicle_id_fkey
  FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE RESTRICT;
ALTER TABLE public.subscriptions DROP CONSTRAINT subscriptions_user_id_fkey;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE RESTRICT;
ALTER TABLE public.order_items DROP CONSTRAINT order_items_order_id_fkey;
ALTER TABLE public.order_items ADD CONSTRAINT order_items_order_id_fkey
  FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE RESTRICT;
