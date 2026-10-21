DO $tests$
DECLARE r public.qr_scan_reports; target public.notification_intents; expected_count integer;
  actual_count integer; original_phone text; token uuid; answer jsonb;
  public_id text; request_id uuid; reserved_id text;
BEGIN
  IF has_function_privilege('anon','public.claim_notification_batch_v2(integer)','EXECUTE')
    OR has_function_privilege('authenticated','public.qr_report_contact_phone(text)','EXECUTE')
    OR has_table_privilege('anon','public.notification_intents','SELECT') THEN
    RAISE EXCEPTION 'Private alert routing is exposed';
  END IF;
  SELECT report.* INTO r FROM public.qr_scan_reports report WHERE report.status='READY'
    AND EXISTS(SELECT 1 FROM public.emergency_profiles p JOIN public.emergency_contacts c ON c.emergency_profile_id=p.id
      WHERE p.vehicle_id=report.vehicle_id AND p.status='ACTIVE' AND c.is_enabled=1 AND c.allow_message=1)
    ORDER BY report.created_at DESC LIMIT 1;
  IF r.id IS NULL THEN RAISE EXCEPTION 'No existing real report with contacts available for rollback verification'; END IF;
  -- Discard only test-transaction intents for this real report; outer block rolls back.
  IF EXISTS(SELECT 1 FROM public.notification_intents WHERE source_id=r.id AND recipient_kind='EMERGENCY_CONTACT') THEN
    RAISE EXCEPTION 'Select a real report without dispatched contact alerts for this verification';
  END IF;
  UPDATE public.qr_scan_reports SET status='UPLOADING',reason='PARKING',created_at=clock_timestamp(),expires_at=clock_timestamp()+interval '1 day' WHERE id=r.id;
  UPDATE public.qr_scan_reports SET status='READY' WHERE id=r.id;
  IF EXISTS(SELECT 1 FROM public.notification_intents WHERE source_id=r.id AND recipient_kind='EMERGENCY_CONTACT') THEN
    RAISE EXCEPTION 'Parking alerted emergency contacts';
  END IF;
  SELECT q.public_id INTO public_id FROM public.qr_stickers q WHERE q.id=r.qr_id;
  answer:=public.begin_qr_scan_report(public_id,gen_random_uuid(),repeat('c',64),'PARKING');
  IF answer->>'error' IS DISTINCT FROM 'COOLDOWN' THEN RAISE EXCEPTION 'Parking cooldown bypassed'; END IF;
  request_id:=gen_random_uuid();
  answer:=public.begin_qr_scan_report(public_id,request_id,repeat('c',64),'EMERGENCY');
  IF answer->>'status' IS DISTINCT FROM 'NEW' THEN RAISE EXCEPTION 'Parking report suppressed emergency'; END IF;
  reserved_id:=answer->>'id';
  answer:=public.begin_qr_scan_report(public_id,request_id,repeat('c',64),'EMERGENCY');
  IF answer->>'id' IS DISTINCT FROM reserved_id THEN RAISE EXCEPTION 'Emergency retry created another report'; END IF;
  answer:=public.begin_qr_scan_report(public_id,gen_random_uuid(),repeat('c',64),'EMERGENCY');
  IF answer->>'error' IS DISTINCT FROM 'COOLDOWN' THEN RAISE EXCEPTION 'Emergency cooldown bypassed'; END IF;
  UPDATE public.qr_scan_reports SET status='UPLOADING',reason='EMERGENCY' WHERE id=r.id;
  UPDATE public.qr_scan_reports SET status='READY' WHERE id=r.id;
  SELECT count(DISTINCT public.qr_alert_phone(c.phone)) INTO expected_count
    FROM public.emergency_contacts c JOIN public.emergency_profiles p ON p.id=c.emergency_profile_id
    JOIN public.users u ON u.id=r.owner_user_id
    WHERE p.vehicle_id=r.vehicle_id AND p.status='ACTIVE' AND c.is_enabled=1 AND c.allow_message=1
      AND public.qr_alert_phone(c.phone) IS NOT NULL
      AND public.qr_alert_phone(c.phone) IS DISTINCT FROM public.qr_alert_phone(coalesce(u.phone,u.primary_phone));
  SELECT count(*) INTO actual_count FROM public.notification_intents WHERE source_id=r.id AND recipient_kind='EMERGENCY_CONTACT';
  IF expected_count=0 OR actual_count<>expected_count THEN RAISE EXCEPTION 'Emergency recipient count mismatch'; END IF;
  UPDATE public.qr_scan_reports SET status='UPLOADING' WHERE id=r.id;
  UPDATE public.qr_scan_reports SET status='READY' WHERE id=r.id;
  IF actual_count<>(SELECT count(*) FROM public.notification_intents WHERE source_id=r.id AND recipient_kind='EMERGENCY_CONTACT') THEN
    RAISE EXCEPTION 'Duplicate report duplicated contact alerts';
  END IF;
  answer:=public.qr_scan_report_receipt(r.id,r.request_id);
  IF (answer->>'emergencyContactsQueued')::boolean IS DISTINCT FROM true THEN RAISE EXCEPTION 'Untruthful report acknowledgement'; END IF;
  SELECT * INTO target FROM public.notification_intents WHERE source_id=r.id AND recipient_kind='EMERGENCY_CONTACT' LIMIT 1;
  IF target.payload_json::jsonb ? 'reportId' OR target.payload_json LIKE '%scan-history%' OR target.payload_json LIKE '%photos%' THEN
    RAISE EXCEPTION 'Private owner report was included in contact alert';
  END IF;
  IF public.qr_report_contact_phone(target.id) IS NULL THEN RAISE EXCEPTION 'Real eligible contact failed service gate'; END IF;
  -- Isolate the new intent from unrelated production work inside this rollback.
  UPDATE public.notification_intents SET next_attempt_at=clock_timestamp()+interval '1 day'
    WHERE id<>target.id AND status IN ('PENDING','QUEUED');
  UPDATE public.scan_report_template_approvals SET status='PENDING' WHERE template_name='vhn_emergency_contact_report_v1';
  answer:=public.claim_notification_batch_v2(5);
  IF jsonb_array_length(answer)<>0 THEN RAISE EXCEPTION 'Unapproved contact template was claimed'; END IF;
  UPDATE public.scan_report_template_approvals SET status='APPROVED' WHERE template_name='vhn_emergency_contact_report_v1';
  answer:=public.claim_notification_batch(5);
  IF jsonb_array_length(answer)<>0 THEN RAISE EXCEPTION 'Legacy deployment claimed a contact alert'; END IF;
  answer:=public.claim_notification_batch_v2(5);
  IF jsonb_array_length(answer)<>1 OR answer->0->>'recipient_kind'<>'EMERGENCY_CONTACT'
    OR answer->0->'profile'->>'verifiedPhone'<>target.recipient_phone
    OR answer->0->'profile'->>'verifiedEmail' IS NOT NULL THEN
    RAISE EXCEPTION 'Contact claim returned an incorrect trusted destination';
  END IF;
  token:=gen_random_uuid();
  UPDATE public.notification_intents SET status='QUEUED',lease_token=token,lease_expires_at=clock_timestamp()+interval '2 minutes' WHERE id=target.id;
  answer:=public.prepare_notification_delivery(target.id,token,'IN_APP','{}'::jsonb);
  IF (answer->>'claimed')::boolean THEN RAISE EXCEPTION 'Contact delivery reached owner inbox'; END IF;
  answer:=public.prepare_notification_delivery(target.id,token,'WHATSAPP','{}'::jsonb);
  IF NOT (answer->>'claimed')::boolean THEN RAISE EXCEPTION 'Eligible contact could not acquire delivery claim'; END IF;
  answer:=public.prepare_notification_delivery(target.id,token,'WHATSAPP','{}'::jsonb);
  IF (answer->>'claimed')::boolean THEN RAISE EXCEPTION 'Duplicate worker acquired delivery claim'; END IF;
  UPDATE public.emergency_contacts SET allow_message=0 WHERE id=target.emergency_contact_id;
  IF public.qr_report_contact_phone(target.id) IS NOT NULL THEN RAISE EXCEPTION 'Contact opt-out ignored'; END IF;
  answer:=public.prepare_notification_delivery(target.id,token,'WHATSAPP','{}'::jsonb);
  IF (answer->>'claimed')::boolean THEN RAISE EXCEPTION 'Revoked contact acquired delivery claim'; END IF;
  UPDATE public.emergency_contacts SET allow_message=1,is_enabled=0 WHERE id=target.emergency_contact_id;
  IF public.qr_report_contact_phone(target.id) IS NOT NULL THEN RAISE EXCEPTION 'Disabled contact received alert'; END IF;
  UPDATE public.emergency_contacts SET is_enabled=1 WHERE id=target.emergency_contact_id;
  SELECT phone INTO original_phone FROM public.emergency_contacts WHERE id=target.emergency_contact_id;
  UPDATE public.emergency_contacts SET phone='' WHERE id=target.emergency_contact_id;
  IF public.qr_report_contact_phone(target.id) IS NOT NULL THEN RAISE EXCEPTION 'Contact phone snapshot ignored'; END IF;
  UPDATE public.emergency_contacts SET phone=original_phone WHERE id=target.emergency_contact_id;
  UPDATE public.qr_scan_reports SET created_at=clock_timestamp()-interval '16 minutes' WHERE id=r.id;
  IF public.qr_report_contact_phone(target.id) IS NOT NULL THEN RAISE EXCEPTION 'Stale emergency alert allowed'; END IF;
  UPDATE public.qr_scan_reports SET created_at=clock_timestamp() WHERE id=r.id;
  UPDATE public.service_entitlements SET status='DISABLED' WHERE qr_sticker_id=r.qr_id AND capability='EMERGENCY_ROUTING';
  IF public.qr_report_contact_phone(target.id) IS NOT NULL THEN RAISE EXCEPTION 'Missing entitlement allowed alert'; END IF;
END; $tests$;
