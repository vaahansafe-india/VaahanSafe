DO $test$
DECLARE
  fixture record;
  session_id uuid;
  request_id uuid := gen_random_uuid();
  primary_choice uuid;
  secondary_choice uuid;
  reservation jsonb;
  report_id text;
  other_vehicle text;
  violated_constraint text;
BEGIN
  SELECT a.qr_id,a.user_id,a.vehicle_id,q.public_id,v.id AS secondary_id
    INTO STRICT fixture
    FROM public.qr_assignments a
    JOIN public.qr_stickers q ON q.id=a.qr_id AND q.status='ACTIVATED'
    JOIN public.users u ON u.id::text=a.user_id AND u.status='ACTIVE'
      AND u.deleted_at IS NULL AND u.phone_verified_at IS NOT NULL
    JOIN public.vehicles v ON v.user_id=a.user_id AND v.status='ACTIVE' AND v.deleted_at IS NULL
    WHERE a.ended_at IS NULL AND a.slot=1
      AND NOT EXISTS(SELECT 1 FROM public.qr_assignments a2 WHERE a2.vehicle_id=v.id AND a2.ended_at IS NULL)
      AND NOT EXISTS(SELECT 1 FROM public.replacement_requests r WHERE r.old_qr_sticker_id=q.id
        AND r.status NOT IN ('REJECTED','COMPLETED','CANCELLED'))
      AND NOT EXISTS(SELECT 1 FROM public.qr_scan_reports r WHERE r.qr_id=q.id AND r.created_at>now()-interval '5 minutes')
      AND EXISTS(SELECT 1 FROM public.auth_identities i WHERE i.user_id=u.id AND i.provider='PHONE'
        AND i.provider_user_id=u.primary_phone AND i.verified_at IS NOT NULL)
      AND 3=(SELECT count(*) FROM public.service_entitlements e
        WHERE e.qr_sticker_id=q.id AND e.vehicle_id=a.vehicle_id AND e.user_id=a.user_id
          AND e.capability IN ('SAFETY_VIEW_ACTIVE','EMERGENCY_ROUTING','SCAN_HISTORY_LOGGING')
          AND e.status='ENABLED' AND e.verified_at IS NOT NULL AND (e.expires_at IS NULL OR e.expires_at>now()))
    ORDER BY a.id LIMIT 1;

  IF has_function_privilege('anon','public.customer_set_secondary_qr_vehicle(text,text,text,boolean)','EXECUTE')
    OR has_function_privilege('authenticated','public.customer_set_secondary_qr_vehicle(text,text,text,boolean)','EXECUTE')
    OR has_function_privilege('anon','public.begin_qr_scan_report(text,uuid,text,text,uuid)','EXECUTE') THEN
    RAISE EXCEPTION 'Binding or report function is exposed to browser roles';
  END IF;

  -- Grant only a transaction-local session for an existing verified account.
  INSERT INTO public.sessions(user_id,token_hash,expires_at)
    VALUES(fixture.user_id::uuid,replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-',''),now()+interval '5 minutes')
    RETURNING id INTO session_id;
  SELECT id INTO STRICT other_vehicle FROM public.vehicles
    WHERE user_id<>fixture.user_id AND status='ACTIVE' AND deleted_at IS NULL LIMIT 1;
  IF public.customer_set_secondary_qr_vehicle(session_id::text,fixture.qr_id,other_vehicle,true)<>'NOT_AVAILABLE' THEN
    RAISE EXCEPTION 'A customer could attach a different owner''s vehicle';
  END IF;
  IF public.customer_set_secondary_qr_vehicle(session_id::text,fixture.qr_id,fixture.secondary_id,true)<>'OK'
    OR public.customer_set_secondary_qr_vehicle(session_id::text,fixture.qr_id,fixture.secondary_id,true)<>'OK' THEN
    RAISE EXCEPTION 'Attach or retry failed';
  END IF;
  IF public.customer_set_secondary_qr_vehicle(session_id::text,fixture.qr_id,fixture.vehicle_id,true)<>'LIMIT_REACHED' THEN
    RAISE EXCEPTION 'Third attachment was not rejected';
  END IF;
  BEGIN
    INSERT INTO public.qr_assignments(id,qr_id,vehicle_id,user_id,slot)
      VALUES('qra_'||gen_random_uuid(),fixture.qr_id,fixture.secondary_id,fixture.user_id,3);
    RAISE EXCEPTION 'Database accepted a third slot';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO public.qr_assignments(id,qr_id,vehicle_id,user_id,slot)
      VALUES('qra_'||gen_random_uuid(),fixture.qr_id,fixture.secondary_id,fixture.user_id,2);
    RAISE EXCEPTION 'Database accepted a duplicate second slot';
  EXCEPTION WHEN unique_violation THEN
    GET STACKED DIAGNOSTICS violated_constraint = CONSTRAINT_NAME;
    IF violated_constraint NOT IN ('qr_assignments_active_slot','idx_qr_assignments_current_vehicle') THEN
      RAISE;
    END IF;
  END;
  IF public.customer_remove_qr_vehicle(fixture.user_id,fixture.vehicle_id)<>'DETACH_SECOND_VEHICLE_FIRST' THEN
    RAISE EXCEPTION 'Database allowed removal of the primary binding';
  END IF;

  SELECT public_vehicle_choice INTO STRICT primary_choice FROM public.qr_assignments
    WHERE qr_id=fixture.qr_id AND slot=1 AND ended_at IS NULL;
  SELECT public_vehicle_choice INTO STRICT secondary_choice FROM public.qr_assignments
    WHERE qr_id=fixture.qr_id AND slot=2 AND ended_at IS NULL;

  reservation := public.begin_qr_scan_report(fixture.public_id,request_id,repeat('0',64),'PARKING');
  IF reservation->>'error' IS DISTINCT FROM 'UNAVAILABLE' THEN
    RAISE EXCEPTION 'Legacy report picked a vehicle without explicit selection';
  END IF;
  reservation := public.begin_qr_scan_report(fixture.public_id,request_id,repeat('0',64),'PARKING',secondary_choice);
  report_id := reservation->>'id';
  IF reservation->>'status' IS DISTINCT FROM 'NEW' OR NOT EXISTS (
    SELECT 1 FROM public.qr_scan_reports WHERE id=report_id AND vehicle_id=fixture.secondary_id
  ) THEN RAISE EXCEPTION 'Report did not target the selected vehicle'; END IF;
  reservation := public.begin_qr_scan_report(fixture.public_id,request_id,repeat('0',64),'PARKING',primary_choice);
  IF reservation->>'error' IS DISTINCT FROM 'UNAVAILABLE' THEN
    RAISE EXCEPTION 'Report retry accepted a different vehicle';
  END IF;
  IF NOT public.complete_qr_scan_report(report_id,NULL,'[]'::jsonb,'PARKING','',true) THEN
    RAISE EXCEPTION 'Report completion failed for the second vehicle';
  END IF;
  IF NOT EXISTS (
      SELECT 1 FROM public.qr_scan_reports r JOIN public.qr_scan_events e ON e.id=r.scan_event_id
      WHERE r.id=report_id AND r.status='READY' AND e.vehicle_id=fixture.secondary_id
    ) THEN RAISE EXCEPTION 'Completed report stored the wrong scan vehicle'; END IF;
  IF NOT EXISTS (
      SELECT 1 FROM public.notification_intents i WHERE i.source_id=report_id AND i.source_type='QR_REPORT'
        AND i.recipient_kind='ACCOUNT' AND i.recipient_user_id=fixture.user_id
        AND public.can_view_qr_report_intent(i.id)
    ) THEN RAISE EXCEPTION 'Owner viewer authorization failed for the second vehicle'; END IF;

  IF public.customer_set_secondary_qr_vehicle(session_id::text,fixture.qr_id,fixture.secondary_id,false)<>'OK' THEN
    RAISE EXCEPTION 'Detachment failed';
  END IF;
  IF EXISTS(SELECT 1 FROM public.qr_assignments WHERE public_vehicle_choice=secondary_choice AND ended_at IS NULL)
    OR EXISTS(SELECT 1 FROM public.service_entitlements WHERE qr_sticker_id=fixture.qr_id
      AND vehicle_id=fixture.secondary_id AND status='ENABLED')
    OR NOT EXISTS(SELECT 1 FROM public.qr_assignments WHERE public_vehicle_choice=primary_choice AND ended_at IS NULL)
    OR NOT EXISTS(SELECT 1 FROM public.qr_scan_reports WHERE id=report_id AND vehicle_id=fixture.secondary_id) THEN
    RAISE EXCEPTION 'Detachment did not preserve history and the primary binding';
  END IF;
  reservation := public.begin_qr_scan_report(fixture.public_id,gen_random_uuid(),repeat('0',64),'PARKING',secondary_choice);
  IF reservation->>'error' IS DISTINCT FROM 'UNAVAILABLE' THEN
    RAISE EXCEPTION 'Detached selection can still reserve a report';
  END IF;
  IF EXISTS (SELECT 1 FROM public.notification_intents i WHERE i.source_id=report_id
    AND i.source_type='QR_REPORT' AND public.can_view_qr_report_intent(i.id)) THEN
    RAISE EXCEPTION 'Detached binding still grants a public report link';
  END IF;
END;
$test$;
