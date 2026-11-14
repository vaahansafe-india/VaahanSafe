BEGIN;
SET LOCAL lock_timeout = '5s';

-- Match the account's registered phone to its verified sign-in identity.
CREATE FUNCTION public.qr_verified_owner_phone(p_user text) RETURNS text
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $fn$
  SELECT public.qr_alert_phone(coalesce(nullif(u.primary_phone,''),u.phone))
  FROM public.users u
  WHERE u.id=p_user::uuid AND u.status='ACTIVE' AND u.deleted_at IS NULL
    AND EXISTS(SELECT 1 FROM public.auth_identities a
      WHERE a.user_id=u.id AND a.provider='PHONE' AND a.verified_at IS NOT NULL
        AND public.qr_alert_phone(a.provider_user_id)=public.qr_alert_phone(coalesce(nullif(u.primary_phone,''),u.phone)));
$fn$;

DO $migration$
DECLARE definition text; updated text; signature text;
BEGIN
  SELECT pg_get_functiondef('public.qr_report_contact_phone(text)'::regprocedure) INTO definition;
  updated:=replace(definition,
    'AND i.recipient_phone IS DISTINCT FROM public.qr_alert_phone(coalesce(u.phone,u.primary_phone))',
    'AND i.recipient_phone IS DISTINCT FROM public.qr_alert_phone(u.phone)
     AND i.recipient_phone IS DISTINCT FROM public.qr_alert_phone(u.primary_phone)');
  IF updated=definition THEN RAISE EXCEPTION 'Unexpected contact report destination guard'; END IF;
  EXECUTE updated;

  SELECT pg_get_functiondef('public.enqueue_qr_report_contacts()'::regprocedure) INTO definition;
  updated:=replace(definition,'owner_phone text;', 'owner_phone text; legacy_phone text;');
  updated:=replace(updated,'SELECT public.qr_alert_phone(coalesce(u.phone,u.primary_phone)) INTO owner_phone',
    'SELECT public.qr_alert_phone(u.primary_phone),public.qr_alert_phone(u.phone) INTO owner_phone,legacy_phone');
  updated:=replace(updated,'IS DISTINCT FROM owner_phone',
    'IS DISTINCT FROM owner_phone AND public.qr_alert_phone(c.phone) IS DISTINCT FROM legacy_phone');
  IF position('INTO owner_phone,legacy_phone' IN updated)=0 THEN RAISE EXCEPTION 'Unexpected report contact enqueue definition'; END IF;
  EXECUTE updated;

  FOREACH signature IN ARRAY ARRAY[
    'public.claim_notification_batch(integer)', 'public.claim_notification_batch_v2(integer)'
  ] LOOP
    SELECT pg_get_functiondef(signature::regprocedure) INTO definition;
    updated:=replace(definition,'''EMERGENCY_SCAN_ALERT_V1'',','');
    IF signature LIKE '%_v2%' THEN
      updated:=replace(updated,'WHEN u.phone_verified_at IS NOT NULL THEN coalesce(u.phone,u.primary_phone) END',
        'WHEN i.template_key=''VEHICLE_SCAN_REPORT_V1'' THEN public.qr_verified_owner_phone(i.recipient_user_id)
         WHEN u.phone_verified_at IS NOT NULL THEN coalesce(u.phone,u.primary_phone) END');
    ELSE
      updated:=replace(updated,'WHEN u.phone_verified_at IS NOT NULL THEN coalesce(u.phone,u.primary_phone) END',
        'WHEN c.template_key=''VEHICLE_SCAN_REPORT_V1'' THEN public.qr_verified_owner_phone(c.recipient_user_id)
         WHEN u.phone_verified_at IS NOT NULL THEN coalesce(u.phone,u.primary_phone) END');
    END IF;
    IF position('EMERGENCY_SCAN_ALERT_V1' IN updated)>0 OR position('qr_verified_owner_phone' IN updated)=0 THEN
      RAISE EXCEPTION 'Unexpected notification claim definition in %', signature;
    END IF;
    EXECUTE updated;
  END LOOP;

  SELECT pg_get_functiondef('public.prepare_notification_delivery(text,uuid,text,jsonb)'::regprocedure) INTO definition;
  updated:=replace(definition,'v_id text;','v_id text; destination_phone text;');
  updated:=replace(updated,'v_id:=''delivery_''',
    'IF i.template_key=''EMERGENCY_SCAN_ALERT_V1'' THEN
       RETURN jsonb_build_object(''claimed'',false);
     END IF;
     IF p_channel=''WHATSAPP'' AND i.template_key IN (''VEHICLE_SCAN_REPORT_V1'',''EMERGENCY_CONTACT_REPORT_V1'') THEN
       IF i.recipient_kind=''EMERGENCY_CONTACT'' THEN
         destination_phone:=public.qr_report_contact_phone(i.id);
       ELSIF i.recipient_kind=''ACCOUNT'' AND i.template_key=''VEHICLE_SCAN_REPORT_V1'' AND i.source_type=''QR_REPORT''
         AND EXISTS(SELECT 1 FROM public.qr_scan_reports r
           JOIN public.qr_assignments a ON a.qr_id=r.qr_id AND a.vehicle_id=r.vehicle_id
             AND a.user_id=i.recipient_user_id AND a.ended_at IS NULL
           JOIN public.qr_stickers q ON q.id=r.qr_id AND q.status=''ACTIVATED''
           JOIN public.vehicles v ON v.id=r.vehicle_id AND v.user_id=a.user_id
             AND v.status=''ACTIVE'' AND v.deleted_at IS NULL
           WHERE r.id=i.source_id AND r.owner_user_id::text=i.recipient_user_id
             AND r.status=''READY'' AND r.expires_at>now()) THEN
         destination_phone:=public.qr_verified_owner_phone(i.recipient_user_id);
       END IF;
       IF destination_phone IS NULL THEN RETURN jsonb_build_object(''claimed'',false); END IF;
     END IF;
     v_id:=''delivery_''');
  updated:=replace(updated,'''attempt'',d.attempt_count)', '''attempt'',d.attempt_count,''recipientPhone'',destination_phone)');
  IF position('destination_phone text' IN updated)=0 OR position('''recipientPhone'',destination_phone' IN updated)=0 THEN
    RAISE EXCEPTION 'Unexpected notification preparation definition';
  END IF;
  EXECUTE updated;
END;
$migration$;

REVOKE ALL ON FUNCTION public.qr_verified_owner_phone(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.qr_verified_owner_phone(text) TO service_role;

COMMIT;
