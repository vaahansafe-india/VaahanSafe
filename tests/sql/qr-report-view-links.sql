DO $tests$
DECLARE r public.qr_scan_reports; i public.notification_intents; token uuid;
  receipt jsonb; first_expiry timestamptz; target public.notification_intents;
BEGIN
  IF has_table_privilege('anon','public.qr_report_view_links','SELECT') OR has_table_privilege('authenticated','public.qr_report_view_links','SELECT')
    OR has_function_privilege('anon','public.resolve_qr_report_view_link(text)','EXECUTE') THEN RAISE EXCEPTION 'Viewer grants are public'; END IF;
  IF public.resolve_qr_report_view_link(repeat('0',64)) IS NOT NULL THEN RAISE EXCEPTION 'Unknown grant resolved'; END IF;
  SELECT report.* INTO r FROM public.qr_scan_reports report WHERE report.status='READY' AND EXISTS(
    SELECT 1 FROM public.notification_intents n WHERE n.source_type='QR_REPORT' AND n.source_id=report.id AND n.recipient_kind='ACCOUNT')
    ORDER BY report.created_at DESC LIMIT 1;
  IF r.id IS NULL THEN RAISE EXCEPTION 'No real report available for rollback-only verification'; END IF;
  SELECT * INTO i FROM public.notification_intents WHERE source_id=r.id AND source_type='QR_REPORT' AND recipient_kind='ACCOUNT' LIMIT 1;
  token:=gen_random_uuid();
  UPDATE public.notification_intents SET lease_token=token,lease_expires_at=clock_timestamp()+interval '2 minutes' WHERE id=i.id;
  IF public.issue_qr_report_view_link(i.id,token,repeat('a',64)) IS NOT NULL THEN RAISE EXCEPTION 'Historical consent was assumed'; END IF;
  UPDATE public.qr_scan_reports SET viewer_consented_at=clock_timestamp(),expires_at=clock_timestamp()+interval '2 days' WHERE id=r.id;
  IF public.issue_qr_report_view_link(i.id,gen_random_uuid(),repeat('a',64)) IS NOT NULL THEN RAISE EXCEPTION 'Wrong lease issued grant'; END IF;
  receipt:=public.issue_qr_report_view_link(i.id,token,repeat('a',64));
  IF receipt IS NULL THEN RAISE EXCEPTION 'Valid viewer grant failed'; END IF;
  first_expiry:=(receipt->>'expiresAt')::timestamptz;
  IF first_expiry>clock_timestamp()+interval '24 hours' OR first_expiry<clock_timestamp()+interval '23 hours 59 minutes' THEN RAISE EXCEPTION 'Wrong viewer expiration'; END IF;
  receipt:=public.issue_qr_report_view_link(i.id,token,repeat('a',64));
  IF (receipt->>'expiresAt')::timestamptz<>first_expiry THEN RAISE EXCEPTION 'Retry renewed grant'; END IF;
  receipt:=public.resolve_qr_report_view_link(repeat('a',64));
  IF receipt IS NULL OR receipt ? 'phone' OR receipt ? 'owner_user_id' OR receipt ? 'emergency_contacts' OR receipt ? 'medical_notes' THEN RAISE EXCEPTION 'Invalid viewer projection'; END IF;
  -- Use one stable clock value: two clock_timestamp() calls can differ by a
  -- microsecond and correctly violate the maximum 24-hour database constraint.
  UPDATE public.qr_report_view_links SET created_at=now()-interval '25 hours',expires_at=now()-interval '1 hour' WHERE intent_id=i.id;
  IF public.resolve_qr_report_view_link(repeat('a',64)) IS NOT NULL THEN RAISE EXCEPTION 'Expired grant allowed'; END IF;
  UPDATE public.qr_report_view_links SET created_at=clock_timestamp(),expires_at=clock_timestamp()+interval '23 hours' WHERE intent_id=i.id;
  IF public.revoke_qr_report_view_links(r.id,gen_random_uuid()) THEN RAISE EXCEPTION 'Another owner revoked report'; END IF;
  IF NOT public.revoke_qr_report_view_links(r.id,r.owner_user_id) THEN RAISE EXCEPTION 'Owner revocation failed'; END IF;
  IF public.resolve_qr_report_view_link(repeat('a',64)) IS NOT NULL OR public.issue_qr_report_view_link(i.id,token,repeat('a',64)) IS NOT NULL THEN RAISE EXCEPTION 'Revocation was bypassed'; END IF;
  -- Verify contact access uses current permission, using only existing real records.
  UPDATE public.qr_scan_reports SET viewer_revoked_at=NULL,status='UPLOADING',reason='EMERGENCY',created_at=clock_timestamp() WHERE id=r.id;
  UPDATE public.qr_scan_reports SET status='READY' WHERE id=r.id;
  SELECT * INTO target FROM public.notification_intents WHERE source_id=r.id AND recipient_kind='EMERGENCY_CONTACT' LIMIT 1;
  IF target.id IS NULL THEN RAISE EXCEPTION 'No existing eligible contact for viewer verification'; END IF;
  UPDATE public.notification_intents SET lease_token=token,lease_expires_at=clock_timestamp()+interval '2 minutes' WHERE id=target.id;
  IF public.issue_qr_report_view_link(target.id,token,repeat('b',64)) IS NULL THEN RAISE EXCEPTION 'Contact viewer grant failed'; END IF;
  IF public.resolve_qr_report_view_link(repeat('b',64)) IS NULL THEN RAISE EXCEPTION 'Contact could not view consented report'; END IF;
  UPDATE public.emergency_contacts SET allow_message=0 WHERE id=target.emergency_contact_id;
  IF public.resolve_qr_report_view_link(repeat('b',64)) IS NOT NULL THEN RAISE EXCEPTION 'Contact opt-out did not end access'; END IF;
END; $tests$;
