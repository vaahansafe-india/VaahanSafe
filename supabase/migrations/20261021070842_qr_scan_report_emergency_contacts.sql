-- User-approved exception: retain the existing Supabase relational service and
-- Cloudflare reporting protection/storage. No parallel database is introduced.
BEGIN;

ALTER TABLE public.notification_intents
  ADD COLUMN recipient_kind text NOT NULL DEFAULT 'ACCOUNT'
    CHECK (recipient_kind IN ('ACCOUNT','EMERGENCY_CONTACT')),
  -- SET NULL preserves delivery/audit history when a contact is removed. A null
  -- relationship cancels unsent alerts; it never redirects them to the owner.
  ADD COLUMN emergency_contact_id text REFERENCES public.emergency_contacts(id) ON DELETE SET NULL,
  ADD COLUMN recipient_phone text,
  ADD CONSTRAINT notification_contact_destination CHECK (
    (recipient_kind='ACCOUNT' AND emergency_contact_id IS NULL AND recipient_phone IS NULL)
    OR (recipient_kind='EMERGENCY_CONTACT' AND recipient_phone ~ '^91[6-9][0-9]{9}$'
      AND recipient_phone IS NOT NULL AND template_key='EMERGENCY_CONTACT_REPORT_V1'
      AND source_type='QR_REPORT' AND event_type='EMERGENCY_SCAN_ALERT'));
CREATE INDEX notification_emergency_contact ON public.notification_intents(emergency_contact_id)
  WHERE emergency_contact_id IS NOT NULL;

ALTER TABLE public.scan_report_template_approvals DROP CONSTRAINT scan_report_template_approvals_template_name_check;
ALTER TABLE public.scan_report_template_approvals ADD CONSTRAINT scan_report_template_approvals_template_name_check
  CHECK (template_name IN ('vhn_vehicle_report_v1','vhn_vehicle_emergency_report_v1','vhn_emergency_contact_report_v1'));
INSERT INTO public.scan_report_template_approvals(template_name,status)
  VALUES('vhn_emergency_contact_report_v1','PENDING');

CREATE FUNCTION public.qr_alert_phone(p_phone text) RETURNS text
LANGUAGE sql IMMUTABLE STRICT SECURITY INVOKER SET search_path='' AS $fn$
  SELECT CASE WHEN p_phone !~ '^[+0-9 ()-]+$' THEN NULL
    WHEN digits ~ '^[6-9][0-9]{9}$' THEN '91'||digits
    WHEN digits ~ '^91[6-9][0-9]{9}$' THEN digits END
  FROM (SELECT regexp_replace(p_phone,'[^0-9]','','g') AS digits) normalized;
$fn$;

-- New reports only. Never backfill historical accident alerts to real contacts.
CREATE FUNCTION public.enqueue_qr_report_contacts() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $fn$
DECLARE contact record; event_payload jsonb; owner_phone text;
BEGIN
  IF NEW.status<>'READY' OR OLD.status='READY' OR NEW.reason<>'EMERGENCY' THEN RETURN NEW; END IF;
  SELECT public.qr_alert_phone(coalesce(u.phone,u.primary_phone)) INTO owner_phone
    FROM public.users u WHERE u.id=NEW.owner_user_id;
  SELECT jsonb_build_object('vehicleMaskedReg',left(v.registration_number,2)||'••••'||right(v.registration_number,4),
    'scannedAtFormatted',to_char(NEW.created_at AT TIME ZONE 'Asia/Kolkata','DD Mon YYYY, HH24:MI')||' IST',
    'reason','EMERGENCY','locationText',CASE WHEN NEW.location IS NULL THEN 'Location was not shared' ELSE
      'Finder-shared GPS (accuracy +/-'||ceil((NEW.location->>'accuracy')::numeric)::text||' m): https://www.google.com/maps/search/?api=1&query='||
      (NEW.location->>'latitude')||','||(NEW.location->>'longitude') END)
    INTO event_payload FROM public.vehicles v WHERE v.id=NEW.vehicle_id AND v.user_id=NEW.owner_user_id::text;
  IF event_payload IS NULL THEN RETURN NEW; END IF;
  FOR contact IN
    SELECT DISTINCT ON (public.qr_alert_phone(c.phone)) c.id,public.qr_alert_phone(c.phone) AS phone
    FROM public.emergency_contacts c JOIN public.emergency_profiles p ON p.id=c.emergency_profile_id
    WHERE p.vehicle_id=NEW.vehicle_id AND p.status='ACTIVE' AND c.is_enabled=1 AND c.allow_message=1
      AND public.qr_alert_phone(c.phone) IS NOT NULL
      AND public.qr_alert_phone(c.phone) IS DISTINCT FROM owner_phone
    ORDER BY public.qr_alert_phone(c.phone),c.priority,c.id
  LOOP
    INSERT INTO public.notification_intents(id,event_type,recipient_user_id,category,priority,template_key,template_version,
      payload_json,source_type,source_id,dedupe_key,status,recipient_kind,emergency_contact_id,recipient_phone)
    VALUES('outbox_'||md5('report-contact:'||NEW.id||':'||contact.phone),'EMERGENCY_SCAN_ALERT',NEW.owner_user_id::text,
      'SAFETY','CRITICAL','EMERGENCY_CONTACT_REPORT_V1',1,event_payload::text,'QR_REPORT',NEW.id,
      'report-contact:'||NEW.id||':'||contact.phone,'PENDING','EMERGENCY_CONTACT',contact.id,contact.phone)
    ON CONFLICT(dedupe_key) DO NOTHING;
  END LOOP;
  RETURN NEW;
END; $fn$;
CREATE TRIGGER qr_report_contact_alerts AFTER UPDATE OF status ON public.qr_scan_reports
  FOR EACH ROW WHEN (NEW.status='READY' AND OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.enqueue_qr_report_contacts();

-- Resolve contacts from current relational records, never payload phone numbers.
-- Recheck possession, all required service gates, permissions and the original
-- phone snapshot before each send/retry. Stale emergency alerts expire in 15 min.
CREATE FUNCTION public.qr_report_contact_phone(p_intent text) RETURNS text
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $fn$
  SELECT i.recipient_phone FROM public.notification_intents i
    JOIN public.qr_scan_reports r ON r.id=i.source_id AND r.owner_user_id::text=i.recipient_user_id
    JOIN public.emergency_contacts c ON c.id=i.emergency_contact_id
    JOIN public.emergency_profiles p ON p.id=c.emergency_profile_id AND p.vehicle_id=r.vehicle_id AND p.status='ACTIVE'
    JOIN public.vehicles v ON v.id=r.vehicle_id AND v.user_id=r.owner_user_id::text AND v.status='ACTIVE'
    JOIN public.users u ON u.id=r.owner_user_id AND u.status='ACTIVE' AND u.deleted_at IS NULL AND u.phone_verified_at IS NOT NULL
    JOIN public.qr_stickers q ON q.id=r.qr_id AND q.status='ACTIVATED'
    JOIN public.qr_assignments a ON a.qr_id=q.id AND a.vehicle_id=v.id AND a.user_id=v.user_id AND a.ended_at IS NULL
  WHERE i.id=p_intent AND i.recipient_kind='EMERGENCY_CONTACT' AND i.template_key='EMERGENCY_CONTACT_REPORT_V1'
    AND r.status='READY' AND r.reason='EMERGENCY' AND r.created_at>now()-interval '15 minutes' AND r.expires_at>now()
    AND c.is_enabled=1 AND c.allow_message=1 AND public.qr_alert_phone(c.phone)=i.recipient_phone
    AND NOT EXISTS(SELECT 1 FROM public.qr_assignments other WHERE other.qr_id=q.id AND other.ended_at IS NULL AND other.id<>a.id)
    AND NOT EXISTS (SELECT 1 FROM (VALUES ('EMERGENCY_ROUTING'),('SCAN_HISTORY_LOGGING'),('SAFETY_VIEW_ACTIVE')) needed(capability)
      WHERE NOT EXISTS (SELECT 1 FROM public.service_entitlements e WHERE e.qr_sticker_id=q.id AND e.vehicle_id=v.id
        AND e.user_id=a.user_id AND e.capability=needed.capability AND e.status='ENABLED' AND e.verified_at IS NOT NULL
        AND (e.expires_at IS NULL OR e.expires_at>now()))) LIMIT 1;
$fn$;

-- Older application deployments must never claim the new contact-only intents.
DO $guard$
DECLARE definition text; updated text;
BEGIN
  SELECT pg_get_functiondef('public.claim_notification_batch(integer)'::regprocedure) INTO definition;
  updated:=replace(definition,'WHERE status IN (''PENDING'',''QUEUED'')',
    'WHERE recipient_kind=''ACCOUNT'' AND status IN (''PENDING'',''QUEUED'')');
  IF updated=definition THEN RAISE EXCEPTION 'Unexpected notification claim contract'; END IF;
  EXECUTE updated;
  SELECT pg_get_functiondef('public.prepare_notification_delivery(text,uuid,text,jsonb)'::regprocedure) INTO definition;
  updated:=replace(definition,'v_id:=''delivery_''',
    'IF i.recipient_kind=''EMERGENCY_CONTACT'' AND (p_channel<>''WHATSAPP'' OR public.qr_report_contact_phone(i.id) IS NULL) THEN
       RETURN jsonb_build_object(''claimed'',false);
     END IF;
     v_id:=''delivery_''');
  IF updated=definition THEN RAISE EXCEPTION 'Unexpected notification delivery contract'; END IF;
  EXECUTE updated;
END; $guard$;

CREATE FUNCTION public.claim_notification_batch_v2(p_limit integer DEFAULT 5) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $fn$
DECLARE claimed jsonb;
BEGIN
  WITH candidates AS (
    SELECT id FROM public.notification_intents i WHERE status IN ('PENDING','QUEUED')
      AND (lease_expires_at IS NULL OR lease_expires_at<clock_timestamp())
      AND (next_attempt_at IS NULL OR next_attempt_at<=clock_timestamp())
      AND (template_key NOT IN ('VEHICLE_SCAN_REPORT_V1','EMERGENCY_CONTACT_REPORT_V1') OR EXISTS (
        SELECT 1 FROM public.scan_report_template_approvals approved WHERE approved.status='APPROVED'
          AND approved.template_name=CASE WHEN i.template_key='EMERGENCY_CONTACT_REPORT_V1' THEN 'vhn_emergency_contact_report_v1'
            WHEN i.payload_json::jsonb->>'reason'='EMERGENCY' THEN 'vhn_vehicle_emergency_report_v1' ELSE 'vhn_vehicle_report_v1' END))
      AND template_key IN ('ACCOUNT_WELCOME_V1','QR_ACTIVATED_V1','PAYMENT_SUCCESS_V1','SHIPMENT_UPDATE_V1','SUBSCRIPTION_RENEWED_V1',
        'SUBSCRIPTION_RENEWAL_FAILED_V1','REPLACEMENT_APPROVED_V1','EMERGENCY_SCAN_ALERT_V1','SECURITY_CHANGED_V1','SUPPORT_UPDATE_V1',
        'VEHICLE_SCAN_REPORT_V1','EMERGENCY_CONTACT_REPORT_V1')
    ORDER BY CASE WHEN priority='CRITICAL' THEN 0 WHEN priority='HIGH' THEN 1 ELSE 2 END,created_at,id
    FOR UPDATE SKIP LOCKED LIMIT greatest(1,least(p_limit,5))
  ), leased AS (
    UPDATE public.notification_intents i SET status='QUEUED',lease_token=gen_random_uuid(),lease_expires_at=clock_timestamp()+interval '2 minutes'
      FROM candidates c WHERE i.id=c.id RETURNING i.*
  ) SELECT coalesce(jsonb_agg(to_jsonb(i)||jsonb_build_object('profile',jsonb_build_object('userId',i.recipient_user_id,
      'verifiedPhone',CASE WHEN i.recipient_kind='EMERGENCY_CONTACT' THEN public.qr_report_contact_phone(i.id)
        WHEN u.phone_verified_at IS NOT NULL THEN coalesce(u.phone,u.primary_phone) END,
      'verifiedEmail',CASE WHEN i.recipient_kind='ACCOUNT' AND u.email_verified_at IS NOT NULL THEN coalesce(u.email,u.primary_email) END),
      'preferences',CASE WHEN i.recipient_kind='EMERGENCY_CONTACT' THEN '[]'::jsonb ELSE
        (SELECT coalesce(jsonb_agg(jsonb_build_object('userId',p.user_id,'category',p.category,'channel',p.channel,'enabled',p.enabled=1)),'[]'::jsonb)
        FROM public.notification_preferences p WHERE p.user_id=i.recipient_user_id) END)), '[]'::jsonb) INTO claimed
    FROM leased i LEFT JOIN public.users u ON u.id::text=i.recipient_user_id AND u.deleted_at IS NULL;
  RETURN claimed;
END; $fn$;

-- Separate emergency cooldown from ordinary parking reports. The existing
-- three-argument reservation remains available for older deployments.
DO $reservation$
DECLARE definition text; updated text;
BEGIN
  SELECT pg_get_functiondef('public.begin_qr_scan_report(text,uuid,text)'::regprocedure) INTO definition;
  updated:=replace(definition,'p_ip_hash text)','p_ip_hash text, p_reason text)');
  updated:=replace(updated,'IF length(p_ip_hash)<>64 THEN',
    'IF p_reason IS NULL OR p_reason NOT IN (''PARKING'',''EMERGENCY'',''LIGHTS_ON'',''DAMAGE'',''OTHER'') OR length(p_ip_hash)<>64 THEN');
  updated:=replace(updated,'WHERE qr_id=q.id AND created_at>clock_timestamp()-interval ''5 minutes''',
    'WHERE qr_id=q.id AND (p_reason<>''EMERGENCY'' OR reason=''EMERGENCY'' OR reason IS NULL) AND created_at>clock_timestamp()-interval ''5 minutes''');
  updated:=replace(updated,'owner_user_id,ip_hash)', 'owner_user_id,ip_hash,reason)');
  updated:=replace(updated,'a.user_id::uuid,p_ip_hash)', 'a.user_id::uuid,p_ip_hash,p_reason)');
  IF updated=definition OR position('p_reason text' IN updated)=0 OR position('p_ip_hash,p_reason)' IN updated)=0 THEN
    RAISE EXCEPTION 'Unexpected report reservation contract';
  END IF;
  EXECUTE updated;
END; $reservation$;
REVOKE ALL ON FUNCTION public.begin_qr_scan_report(text,uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.begin_qr_scan_report(text,uuid,text,text) TO service_role;

CREATE FUNCTION public.qr_scan_report_receipt(p_id text,p_request uuid) RETURNS jsonb
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $fn$
  SELECT jsonb_build_object('emergencyContactsQueued',EXISTS(SELECT 1 FROM public.notification_intents i
    WHERE i.source_type='QR_REPORT' AND i.source_id=r.id AND i.recipient_kind='EMERGENCY_CONTACT'))
  FROM public.qr_scan_reports r WHERE r.id=p_id AND r.request_id=p_request AND r.status='READY';
$fn$;

REVOKE ALL ON FUNCTION public.qr_alert_phone(text),public.enqueue_qr_report_contacts(),public.qr_report_contact_phone(text),
  public.claim_notification_batch_v2(integer),public.qr_scan_report_receipt(text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.qr_alert_phone(text),public.enqueue_qr_report_contacts(),public.qr_report_contact_phone(text),
  public.claim_notification_batch_v2(integer),public.qr_scan_report_receipt(text,uuid) TO service_role;
COMMIT;
