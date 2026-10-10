-- Finder-consented reports. Photos stay in private Cloudflare R2, never Supabase Storage.
-- RESTRICT retains safety/audit records when a QR, vehicle or account changes.
BEGIN;
CREATE TABLE public.scan_report_template_approvals (
  template_name text PRIMARY KEY CHECK (template_name IN ('vhn_vehicle_report_v1','vhn_vehicle_emergency_report_v1')),
  status text NOT NULL CHECK (status IN ('PENDING','APPROVED','REJECTED','PAUSED','DISABLED')),
  checked_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
ALTER TABLE public.scan_report_template_approvals ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.scan_report_template_approvals FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.scan_report_template_approvals TO service_role;
CREATE POLICY scan_report_templates_service ON public.scan_report_template_approvals FOR ALL TO service_role USING (true) WITH CHECK (true);
INSERT INTO public.scan_report_template_approvals(template_name,status) VALUES
 ('vhn_vehicle_report_v1','PENDING'),('vhn_vehicle_emergency_report_v1','PENDING');
CREATE TABLE public.qr_scan_reports (
  id text PRIMARY KEY,
  request_id uuid NOT NULL UNIQUE,
  qr_id text NOT NULL REFERENCES public.qr_stickers(id) ON DELETE RESTRICT,
  vehicle_id text NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
  owner_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  scan_event_id text UNIQUE REFERENCES public.qr_scan_events(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'UPLOADING' CHECK (status IN ('UPLOADING','READY','FAILED')),
  reason text CHECK (reason IN ('PARKING','EMERGENCY','LIGHTS_ON','DAMAGE','OTHER')),
  note text NOT NULL DEFAULT '' CHECK (length(note)<=300),
  location jsonb CHECK (location IS NULL OR (jsonb_typeof(location)='object'
    AND (location->>'latitude')::double precision BETWEEN -90 AND 90
    AND (location->>'longitude')::double precision BETWEEN -180 AND 180
    AND (location->>'accuracy')::double precision BETWEEN 0 AND 100000)),
  photos jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(photos)='array' AND jsonb_array_length(photos)<=3),
  ip_hash text NOT NULL CHECK (length(ip_hash)=64),
  consented_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  expires_at timestamptz NOT NULL DEFAULT (clock_timestamp()+interval '90 days')
);
CREATE INDEX qr_scan_reports_qr_created ON public.qr_scan_reports(qr_id,created_at DESC);
CREATE INDEX qr_scan_reports_owner_created ON public.qr_scan_reports(owner_user_id,created_at DESC);
CREATE INDEX qr_scan_reports_vehicle ON public.qr_scan_reports(vehicle_id);
CREATE INDEX qr_scan_reports_ip_created ON public.qr_scan_reports(ip_hash,created_at DESC);
ALTER TABLE public.qr_scan_reports ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.qr_scan_reports FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.qr_scan_reports TO service_role;
CREATE POLICY scan_reports_service ON public.qr_scan_reports FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Called only by the server after Turnstile. Serialize claims per QR and per hashed IP.
CREATE FUNCTION public.begin_qr_scan_report(p_public_id text,p_request_id uuid,p_ip_hash text)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $fn$
DECLARE q record; a record; old_report record; report_id text;
BEGIN
  IF length(p_ip_hash)<>64 THEN RETURN jsonb_build_object('error','UNAVAILABLE'); END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_ip_hash,0));
  SELECT id,status INTO q FROM public.qr_stickers WHERE public_id=p_public_id FOR UPDATE;
  IF NOT FOUND OR q.status<>'ACTIVATED' THEN RETURN jsonb_build_object('error','UNAVAILABLE'); END IF;
  SELECT r.id,r.status INTO old_report FROM public.qr_scan_reports r WHERE r.request_id=p_request_id AND r.qr_id=q.id;
  IF FOUND THEN RETURN jsonb_build_object('id',old_report.id,'status',old_report.status); END IF;
  SELECT x.vehicle_id,x.user_id INTO a FROM public.qr_assignments x JOIN public.vehicles v ON v.id=x.vehicle_id
    JOIN public.users u ON u.id::text=x.user_id
    WHERE x.qr_id=q.id AND x.ended_at IS NULL AND v.user_id=x.user_id AND v.status='ACTIVE'
      AND u.status='ACTIVE' AND u.deleted_at IS NULL AND u.phone_verified_at IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.qr_assignments other WHERE other.qr_id=q.id AND other.ended_at IS NULL AND other.id<>x.id)
      AND NOT EXISTS (SELECT 1 FROM (VALUES ('EMERGENCY_ROUTING'),('SCAN_HISTORY_LOGGING'),('SAFETY_VIEW_ACTIVE')) AS needed(capability)
        WHERE NOT EXISTS (SELECT 1 FROM public.service_entitlements e WHERE e.qr_sticker_id=q.id AND e.vehicle_id=v.id
          AND e.user_id=x.user_id AND e.capability=needed.capability AND e.status='ENABLED' AND e.verified_at IS NOT NULL
          AND (e.expires_at IS NULL OR e.expires_at>clock_timestamp()))) LIMIT 1;
  IF NOT FOUND THEN RETURN jsonb_build_object('error','UNAVAILABLE'); END IF;
  IF EXISTS (SELECT 1 FROM public.qr_scan_reports WHERE qr_id=q.id AND created_at>clock_timestamp()-interval '5 minutes')
    OR (SELECT count(*) FROM public.qr_scan_reports WHERE ip_hash=p_ip_hash AND created_at>clock_timestamp()-interval '1 hour')>=12
    THEN RETURN jsonb_build_object('error','COOLDOWN'); END IF;
  report_id:='report_'||gen_random_uuid()::text;
  INSERT INTO public.qr_scan_reports(id,request_id,qr_id,vehicle_id,owner_user_id,ip_hash)
    VALUES(report_id,p_request_id,q.id,a.vehicle_id,a.user_id::uuid,p_ip_hash);
  RETURN jsonb_build_object('id',report_id,'status','NEW');
END; $fn$;
REVOKE ALL ON FUNCTION public.begin_qr_scan_report(text,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.begin_qr_scan_report(text,uuid,text) TO service_role;

CREATE FUNCTION public.complete_qr_scan_report(p_id text,p_location jsonb,p_photos jsonb,p_reason text,p_note text)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $fn$
DECLARE r record; scan_id text; plate text; location_text text; event_payload jsonb;
BEGIN
  SELECT * INTO r FROM public.qr_scan_reports WHERE id=p_id FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  IF r.status='READY' THEN RETURN true; END IF;
  IF r.status<>'UPLOADING' OR r.created_at<clock_timestamp()-interval '5 minutes' THEN RETURN false; END IF;
  -- Recheck current ownership and all capabilities after uploading; payment/activation gates remain authoritative.
  SELECT v.registration_number INTO plate FROM public.qr_stickers q JOIN public.qr_assignments a ON a.qr_id=q.id
    JOIN public.vehicles v ON v.id=a.vehicle_id WHERE q.id=r.qr_id AND q.status='ACTIVATED' AND a.ended_at IS NULL
      AND a.vehicle_id=r.vehicle_id AND a.user_id=r.owner_user_id::text AND v.user_id=a.user_id AND v.status='ACTIVE'
      AND NOT EXISTS (SELECT 1 FROM (VALUES ('EMERGENCY_ROUTING'),('SCAN_HISTORY_LOGGING'),('SAFETY_VIEW_ACTIVE')) AS needed(capability)
        WHERE NOT EXISTS (SELECT 1 FROM public.service_entitlements e WHERE e.qr_sticker_id=q.id AND e.vehicle_id=v.id
          AND e.user_id=a.user_id AND e.capability=needed.capability AND e.status='ENABLED' AND e.verified_at IS NOT NULL
          AND (e.expires_at IS NULL OR e.expires_at>clock_timestamp())));
  IF NOT FOUND THEN RETURN false; END IF;
  IF p_reason NOT IN ('PARKING','EMERGENCY','LIGHTS_ON','DAMAGE','OTHER') OR length(p_note)>300
    OR jsonb_typeof(p_photos)<>'array' OR jsonb_array_length(p_photos)>3 THEN RETURN false; END IF;
  IF EXISTS (SELECT 1 FROM jsonb_array_elements(p_photos) photo
    WHERE photo->>'key' NOT LIKE 'scan-reports/'||p_id||'/%' OR photo->>'mimeType' NOT IN ('image/jpeg','image/png','image/webp')
      OR (photo->>'size')::integer NOT BETWEEN 1 AND 1048576) THEN RETURN false; END IF;
  scan_id:='qse_'||gen_random_uuid()::text;
  INSERT INTO public.qr_scan_events(id,qr_id,vehicle_id,scan_type,result,user_agent_family,referrer_class)
    VALUES(scan_id,r.qr_id,r.vehicle_id,'EMERGENCY_TRIGGER','RESOLVED_ACTIVE','Browser','FINDER_REPORT');
  UPDATE public.qr_scan_reports SET status='READY',scan_event_id=scan_id,reason=p_reason,note=p_note,
    location=NULLIF(p_location,'null'::jsonb),photos=p_photos WHERE id=p_id;
  location_text:=CASE WHEN p_location IS NULL OR p_location='null'::jsonb THEN 'Location was not shared' ELSE
    'Finder-shared GPS (accuracy +/-'||ceil((p_location->>'accuracy')::numeric)::text||' m): https://www.google.com/maps/search/?api=1&query='||
      (p_location->>'latitude')||','||(p_location->>'longitude') END;
  event_payload:=jsonb_build_object('vehicleMaskedReg',left(plate,2)||'••••'||right(plate,4),
    'scannedAtFormatted',to_char(clock_timestamp() AT TIME ZONE 'Asia/Kolkata','DD Mon YYYY, HH24:MI')||' IST',
    'reportId',p_id,'reason',p_reason,'locationText',location_text,'photoCount',jsonb_array_length(p_photos));
  PERFORM public.enqueue_notification_event('EMERGENCY_SCAN_ALERT',r.owner_user_id::text,'QR_REPORT',p_id,event_payload,'report:'||p_id);
  UPDATE public.notification_intents SET template_key='VEHICLE_SCAN_REPORT_V1' WHERE dedupe_key='report:'||p_id;
  -- Immediately expose the saved report in-app while provider approval/delivery remains pending.
  INSERT INTO public.notifications(id,user_id,intent_id,event_type,category,priority,title,body_safe,action_type,action_target)
    SELECT 'notice_'||md5(i.id),i.recipient_user_id,i.id,i.event_type,i.category,i.priority,
      CASE WHEN p_reason='EMERGENCY' THEN 'Possible vehicle emergency' ELSE 'Vehicle safety report' END,
      'A finder submitted a vehicle report. Review the shared details and photos.','VIEW_QR','/scan-history?report='||p_id
    FROM public.notification_intents i WHERE i.dedupe_key='report:'||p_id ON CONFLICT(id) DO NOTHING;
  RETURN true;
END; $fn$;
REVOKE ALL ON FUNCTION public.complete_qr_scan_report(text,jsonb,jsonb,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.complete_qr_scan_report(text,jsonb,jsonb,text,text) TO service_role;

-- Finder reports create their own rich intent; suppress the ordinary scan notice for those events.
DO $block$
DECLARE definition text;
BEGIN
 SELECT pg_get_functiondef('public.capture_notification_event()'::regprocedure) INTO definition;
 IF position('IF NEW.result=''RESOLVED_ACTIVE'' THEN' IN definition)=0 THEN
   RAISE EXCEPTION 'Unexpected scan notification trigger definition';
 END IF;
 EXECUTE replace(definition,'IF NEW.result=''RESOLVED_ACTIVE'' THEN',
   'IF NEW.result=''RESOLVED_ACTIVE'' AND NEW.referrer_class IS DISTINCT FROM ''FINDER_REPORT'' THEN');
END; $block$;
-- Keep rich reports durable and pending while their exact provider template is unapproved.
DO $block$
DECLARE definition text;
BEGIN
 SELECT pg_get_functiondef('public.claim_notification_batch(integer)'::regprocedure) INTO definition;
 IF position('AND template_key IN (' IN definition)=0 THEN RAISE EXCEPTION 'Unexpected notification claim function'; END IF;
 EXECUTE replace(definition,'AND template_key IN (',
   'AND (template_key<>''VEHICLE_SCAN_REPORT_V1'' OR EXISTS (SELECT 1 FROM public.scan_report_template_approvals approved
     WHERE approved.template_name=CASE WHEN payload_json::jsonb->>''reason''=''EMERGENCY'' THEN ''vhn_vehicle_emergency_report_v1'' ELSE ''vhn_vehicle_report_v1'' END
       AND approved.status=''APPROVED'')) AND template_key IN (''VEHICLE_SCAN_REPORT_V1'',');
END; $block$;
COMMIT;
