BEGIN;
SET LOCAL lock_timeout = '5s';

ALTER TABLE public.qr_assignments
  ADD COLUMN slot smallint NOT NULL DEFAULT 1 CHECK (slot IN (1, 2)),
  ADD COLUMN public_vehicle_choice uuid NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX qr_assignments_active_slot
  ON public.qr_assignments(qr_id, slot) WHERE ended_at IS NULL;
CREATE UNIQUE INDEX qr_assignments_public_vehicle_choice
  ON public.qr_assignments(public_vehicle_choice);
CREATE UNIQUE INDEX IF NOT EXISTS idx_qr_assignments_current_vehicle
  ON public.qr_assignments(vehicle_id) WHERE ended_at IS NULL;
DROP INDEX IF EXISTS public.idx_qr_assignments_current_qr;

-- Serialize primary removal and secondary attachment against the same sticker.
-- A shared ID always retains its original acquisition binding.
CREATE FUNCTION public.guard_qr_assignment_slot() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $fn$
BEGIN
  IF TG_OP='UPDATE' AND OLD.ended_at IS NULL AND
      (NEW.qr_id, NEW.slot, NEW.vehicle_id, NEW.user_id, NEW.public_vehicle_choice)
      IS DISTINCT FROM (OLD.qr_id, OLD.slot, OLD.vehicle_id, OLD.user_id, OLD.public_vehicle_choice) THEN
    RAISE EXCEPTION 'IMMUTABLE_QR_BINDING';
  END IF;
  IF TG_OP='UPDATE' AND OLD.ended_at IS NULL AND NEW.ended_at IS NOT NULL AND OLD.slot=1 THEN
    PERFORM 1 FROM public.qr_stickers WHERE id=OLD.qr_id FOR UPDATE;
    IF EXISTS(SELECT 1 FROM public.qr_assignments WHERE qr_id=OLD.qr_id AND slot=2 AND ended_at IS NULL) THEN
      RAISE EXCEPTION 'DETACH_SECOND_VEHICLE_FIRST';
    END IF;
  ELSIF NEW.ended_at IS NULL AND NEW.slot=2 THEN
    PERFORM 1 FROM public.qr_stickers WHERE id=NEW.qr_id FOR UPDATE;
    IF NOT EXISTS(SELECT 1 FROM public.qr_assignments
      WHERE qr_id=NEW.qr_id AND slot=1 AND ended_at IS NULL AND user_id=NEW.user_id)
      OR NOT EXISTS(SELECT 1 FROM public.vehicles
      WHERE id=NEW.vehicle_id AND user_id=NEW.user_id AND status='ACTIVE' AND deleted_at IS NULL) THEN
      RAISE EXCEPTION 'INVALID_QR_BINDING_OWNER';
    END IF;
  END IF;
  RETURN NEW;
END;
$fn$;
CREATE TRIGGER qr_assignment_slot_guard
  BEFORE INSERT OR UPDATE ON public.qr_assignments
  FOR EACH ROW EXECUTE FUNCTION public.guard_qr_assignment_slot();

CREATE FUNCTION public.customer_set_secondary_qr_vehicle(
  p_session text, p_qr text, p_vehicle text, p_attach boolean
) RETURNS text LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $fn$
DECLARE actor text; primary_vehicle text; secondary_vehicle text;
BEGIN
  IF p_attach IS NULL THEN RETURN 'NOT_AVAILABLE'; END IF;
  actor := public.replacement_customer_actor(p_session);
  IF NOT EXISTS(SELECT 1 FROM public.users WHERE id::text=actor AND deleted_at IS NULL) THEN
    RETURN 'NOT_AVAILABLE';
  END IF;
  PERFORM 1 FROM public.vehicles
    WHERE id=p_vehicle AND user_id=actor AND status='ACTIVE' AND deleted_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RETURN 'NOT_AVAILABLE'; END IF;
  PERFORM 1 FROM public.qr_stickers WHERE id=p_qr AND status='ACTIVATED' FOR UPDATE;
  IF NOT FOUND THEN RETURN 'NOT_AVAILABLE'; END IF;
  SELECT a.vehicle_id INTO primary_vehicle FROM public.qr_assignments a
    JOIN public.vehicles v ON v.id=a.vehicle_id AND v.user_id=a.user_id
    WHERE a.qr_id=p_qr AND a.slot=1 AND a.ended_at IS NULL AND a.user_id=actor
      AND v.status='ACTIVE' AND v.deleted_at IS NULL;
  IF NOT FOUND THEN RETURN 'NOT_AVAILABLE'; END IF;
  SELECT vehicle_id INTO secondary_vehicle FROM public.qr_assignments
    WHERE qr_id=p_qr AND slot=2 AND ended_at IS NULL;

  IF p_attach THEN
    IF p_vehicle=secondary_vehicle THEN RETURN 'OK'; END IF;
    IF secondary_vehicle IS NOT NULL THEN RETURN 'LIMIT_REACHED'; END IF;
    IF EXISTS(SELECT 1 FROM public.qr_assignments WHERE vehicle_id=p_vehicle AND ended_at IS NULL) THEN
      RETURN 'ALREADY_LINKED';
    END IF;
    IF EXISTS(SELECT 1 FROM public.replacement_requests
       WHERE old_qr_sticker_id=p_qr AND status NOT IN ('REJECTED','COMPLETED','CANCELLED')) THEN
      RETURN 'REPLACEMENT_PENDING';
    END IF;
    IF NOT EXISTS(SELECT 1 FROM public.service_entitlements
      WHERE qr_sticker_id=p_qr AND vehicle_id=primary_vehicle AND user_id=actor
        AND capability='SAFETY_VIEW_ACTIVE' AND status='ENABLED' AND verified_at IS NOT NULL
        AND (expires_at IS NULL OR expires_at>now())) THEN
      RETURN 'NOT_AVAILABLE';
    END IF;
    INSERT INTO public.qr_assignments(id,qr_id,vehicle_id,user_id,slot)
      VALUES('qra_'||gen_random_uuid(),p_qr,p_vehicle,actor,2);
    -- Share only verified QR capabilities, with the same acquisition proof and
    -- expiry. Sticker replacement remains tied to the original vehicle.
    INSERT INTO public.service_entitlements
      (id,user_id,vehicle_id,qr_sticker_id,capability,status,acquisition_source,order_id,verified_at,expires_at)
      SELECT 'ent_'||gen_random_uuid(),actor,p_vehicle,p_qr,capability,'ENABLED',
        acquisition_source,order_id,verified_at,expires_at
      FROM public.service_entitlements
      WHERE qr_sticker_id=p_qr AND vehicle_id=primary_vehicle AND user_id=actor
        AND capability IN ('DIGITAL_QR_ACCESS','SAFETY_VIEW_ACTIVE','EMERGENCY_ROUTING','SCAN_HISTORY_LOGGING')
        AND status='ENABLED' AND verified_at IS NOT NULL AND (expires_at IS NULL OR expires_at>now())
      ON CONFLICT(vehicle_id,qr_sticker_id,capability) DO UPDATE
      SET status='ENABLED', acquisition_source=excluded.acquisition_source,
        order_id=excluded.order_id, verified_at=excluded.verified_at,
        expires_at=excluded.expires_at, updated_at=now();
  ELSE
    IF secondary_vehicle IS DISTINCT FROM p_vehicle THEN RETURN 'NOT_AVAILABLE'; END IF;
    UPDATE public.qr_assignments SET ended_at=now(),end_reason='UNLINKED',is_current=0,updated_at=now()
      WHERE qr_id=p_qr AND slot=2 AND vehicle_id=p_vehicle AND user_id=actor AND ended_at IS NULL;
    UPDATE public.service_entitlements SET status='REVOKED',updated_at=now()
      WHERE qr_sticker_id=p_qr AND vehicle_id=p_vehicle AND user_id=actor AND status='ENABLED';
  END IF;
  RETURN 'OK';
END;
$fn$;

CREATE FUNCTION public.customer_remove_qr_vehicle(p_actor text, p_vehicle text)
RETURNS text LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $fn$
DECLARE registration text; binding public.qr_assignments;
BEGIN
  SELECT registration_number INTO registration FROM public.vehicles
    WHERE id=p_vehicle AND user_id=p_actor AND status<>'DELETED' FOR UPDATE;
  IF NOT FOUND THEN RETURN 'NOT_AVAILABLE'; END IF;
  SELECT * INTO binding FROM public.qr_assignments
    WHERE vehicle_id=p_vehicle AND user_id=p_actor AND ended_at IS NULL;
  IF FOUND THEN
    PERFORM 1 FROM public.qr_stickers WHERE id=binding.qr_id FOR UPDATE;
    IF binding.slot=1 AND EXISTS(SELECT 1 FROM public.qr_assignments
      WHERE qr_id=binding.qr_id AND slot=2 AND ended_at IS NULL) THEN
      RETURN 'DETACH_SECOND_VEHICLE_FIRST';
    END IF;
    UPDATE public.qr_assignments SET ended_at=now(),end_reason='UNLINKED',is_current=0,updated_at=now()
      WHERE id=binding.id AND ended_at IS NULL;
    UPDATE public.service_entitlements SET status='REVOKED',updated_at=now()
      WHERE qr_sticker_id=binding.qr_id AND vehicle_id=p_vehicle AND user_id=p_actor AND status='ENABLED';
  END IF;
  UPDATE public.vehicles SET status='DELETED',deleted_at=now(),updated_at=now()
    WHERE id=p_vehicle AND user_id=p_actor;
  UPDATE public.emergency_profiles SET status='DISABLED',updated_at=now() WHERE vehicle_id=p_vehicle;
  RETURN 'OK';
END;
$fn$;

-- Share the report reservation logic with the previous public flow, adding an
-- explicit opaque choice for shared stickers. Legacy clients still fail closed
-- when a shared sticker has no vehicle choice.
DO $migration$
DECLARE definition text; updated text; signature text;
BEGIN
  SELECT pg_get_functiondef('public.begin_qr_scan_report(text,uuid,text,text)'::regprocedure) INTO definition;
  updated := replace(definition,'p_reason text)', 'p_reason text, p_vehicle_choice uuid)');
  updated := replace(updated,'SELECT r.id,r.status,r.created_at INTO old_report',
    'SELECT r.id,r.status,r.created_at,selected.public_vehicle_choice INTO old_report');
  updated := replace(updated,'FROM public.qr_scan_reports r WHERE r.request_id',
    'FROM public.qr_scan_reports r LEFT JOIN public.qr_assignments selected ON selected.qr_id=r.qr_id
     AND selected.vehicle_id=r.vehicle_id AND selected.ended_at IS NULL WHERE r.request_id');
  updated := replace(updated,'IF FOUND THEN', 'IF FOUND THEN
      IF old_report.public_vehicle_choice IS DISTINCT FROM p_vehicle_choice THEN
        RETURN jsonb_build_object(''error'',''UNAVAILABLE'');
      END IF;');
  updated := replace(updated,
    'AND NOT EXISTS (SELECT 1 FROM public.qr_assignments other WHERE other.qr_id=q.id AND other.ended_at IS NULL AND other.id<>x.id)',
    'AND x.public_vehicle_choice=p_vehicle_choice
      AND NOT EXISTS (SELECT 1 FROM public.qr_assignments other WHERE other.qr_id=q.id AND other.ended_at IS NULL AND other.user_id<>x.user_id)');
  updated := replace(updated, 'WHERE qr_id=q.id AND (p_reason',
    'WHERE qr_id=q.id AND vehicle_id=a.vehicle_id AND (p_reason');
  IF position('x.public_vehicle_choice=p_vehicle_choice' IN updated)=0
    OR position('old_report.public_vehicle_choice IS DISTINCT' IN updated)=0
    OR position('selected.public_vehicle_choice INTO old_report' IN updated)=0
    OR position('vehicle_id=a.vehicle_id AND (p_reason' IN updated)=0 THEN
    RAISE EXCEPTION 'Unexpected finder report reservation definition';
  END IF;
  EXECUTE updated;

  FOREACH signature IN ARRAY ARRAY[
    'public.complete_qr_scan_report(text,jsonb,jsonb,text,text)',
    'public.qr_report_contact_phone(text)',
    'public.can_view_qr_report_intent(text)'
  ] LOOP
    SELECT pg_get_functiondef(signature::regprocedure) INTO definition;
    updated := replace(definition,'other.id<>a.id','other.user_id<>a.user_id');
    IF updated=definition THEN RAISE EXCEPTION 'Unexpected QR report guard in %', signature; END IF;
    EXECUTE updated;
  END LOOP;

  SELECT pg_get_functiondef('public.customer_request_replacement(text,text,text,text,uuid)'::regprocedure) INTO definition;
  updated := replace(definition,'AND a.user_id=actor AND q.status=',
    'AND a.user_id=actor AND a.slot=1 AND q.status=');
  updated := replace(updated,'IF vehicle IS NULL OR NOT EXISTS',
    'IF vehicle IS NOT NULL AND EXISTS (SELECT 1 FROM public.qr_assignments
       WHERE qr_id=p_qr AND slot=2 AND ended_at IS NULL) THEN RAISE EXCEPTION ''DETACH_SECOND_VEHICLE_FIRST''; END IF;
     IF vehicle IS NULL OR NOT EXISTS');
  IF position('a.slot=1' IN updated)=0 OR position('DETACH_SECOND_VEHICLE_FIRST' IN updated)=0 THEN
    RAISE EXCEPTION 'Unexpected replacement request definition';
  END IF;
  EXECUTE updated;
END;
$migration$;

REVOKE ALL ON FUNCTION public.guard_qr_assignment_slot(),
  public.customer_set_secondary_qr_vehicle(text,text,text,boolean),
  public.customer_remove_qr_vehicle(text,text),
  public.begin_qr_scan_report(text,uuid,text,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.guard_qr_assignment_slot(),
  public.customer_set_secondary_qr_vehicle(text,text,text,boolean),
  public.customer_remove_qr_vehicle(text,text),
  public.begin_qr_scan_report(text,uuid,text,text,uuid) TO service_role;

COMMIT;
