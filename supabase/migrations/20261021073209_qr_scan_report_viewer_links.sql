BEGIN;
-- Sharing is explicit for new reports. Historical photos remain owner-private.
ALTER TABLE public.qr_scan_reports ADD COLUMN viewer_consented_at timestamptz;
ALTER TABLE public.qr_scan_reports ADD COLUMN viewer_revoked_at timestamptz;
CREATE TABLE public.qr_report_view_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- RESTRICT retains report/delivery audit relationships; revocation changes access.
  report_id text NOT NULL REFERENCES public.qr_scan_reports(id) ON DELETE RESTRICT,
  intent_id text NOT NULL UNIQUE REFERENCES public.notification_intents(id) ON DELETE RESTRICT,
  token_hash text NOT NULL UNIQUE CHECK (token_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  expires_at timestamptz NOT NULL DEFAULT (clock_timestamp()+interval '24 hours'),
  revoked_at timestamptz,
  CHECK (expires_at>created_at AND expires_at<=created_at+interval '24 hours')
);
CREATE INDEX qr_report_view_links_report ON public.qr_report_view_links(report_id);
ALTER TABLE public.qr_report_view_links ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.qr_report_view_links FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.qr_report_view_links TO service_role;
CREATE POLICY report_view_links_service ON public.qr_report_view_links FOR ALL TO service_role USING(true) WITH CHECK(true);

CREATE FUNCTION public.complete_qr_scan_report(p_id text,p_location jsonb,p_photos jsonb,p_reason text,p_note text,p_viewer_consent boolean)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $fn$
DECLARE saved boolean; prior_status text;
BEGIN
  -- Use the same QR->report lock order as reservation and original completion.
  PERFORM 1 FROM public.qr_stickers WHERE id=(SELECT qr_id FROM public.qr_scan_reports WHERE id=p_id) FOR UPDATE;
  SELECT status INTO prior_status FROM public.qr_scan_reports WHERE id=p_id FOR UPDATE;
  saved:=public.complete_qr_scan_report(p_id,p_location,p_photos,p_reason,p_note);
  IF saved AND prior_status='UPLOADING' AND p_viewer_consent IS TRUE THEN
    UPDATE public.qr_scan_reports SET viewer_consented_at=clock_timestamp() WHERE id=p_id;
  END IF;
  RETURN saved;
END; $fn$;

-- Common current-state authorization for issuing and reading a report link.
-- Contact permission is checked without the dispatch-only 15-minute freshness
-- limit: an accepted alert link remains useful throughout its own 24-hour life.
CREATE FUNCTION public.can_view_qr_report_intent(p_intent text) RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $fn$
  SELECT EXISTS(SELECT 1 FROM public.notification_intents i
    JOIN public.qr_scan_reports r ON r.id=i.source_id AND i.source_type='QR_REPORT' AND r.owner_user_id::text=i.recipient_user_id
    JOIN public.vehicles v ON v.id=r.vehicle_id AND v.user_id=r.owner_user_id::text AND v.status='ACTIVE'
    JOIN public.users u ON u.id=r.owner_user_id AND u.status='ACTIVE' AND u.deleted_at IS NULL AND u.phone_verified_at IS NOT NULL
    JOIN public.qr_stickers q ON q.id=r.qr_id AND q.status='ACTIVATED'
    JOIN public.qr_assignments a ON a.qr_id=q.id AND a.vehicle_id=v.id AND a.user_id=v.user_id AND a.ended_at IS NULL
    WHERE i.id=p_intent AND i.template_key IN ('VEHICLE_SCAN_REPORT_V1','EMERGENCY_CONTACT_REPORT_V1')
      AND r.status='READY' AND r.expires_at>now() AND r.viewer_consented_at IS NOT NULL AND r.viewer_revoked_at IS NULL
      AND (i.recipient_kind='ACCOUNT' OR (i.recipient_kind='EMERGENCY_CONTACT' AND r.reason='EMERGENCY' AND EXISTS(
        SELECT 1 FROM public.emergency_contacts c JOIN public.emergency_profiles p ON p.id=c.emergency_profile_id
        WHERE c.id=i.emergency_contact_id AND p.vehicle_id=v.id AND p.status='ACTIVE'
          AND c.is_enabled=1 AND c.allow_message=1 AND public.qr_alert_phone(c.phone)=i.recipient_phone)))
      AND NOT EXISTS(SELECT 1 FROM public.qr_assignments other WHERE other.qr_id=q.id AND other.ended_at IS NULL AND other.id<>a.id)
      AND NOT EXISTS(SELECT 1 FROM (VALUES('EMERGENCY_ROUTING'),('SCAN_HISTORY_LOGGING'),('SAFETY_VIEW_ACTIVE')) needed(capability)
        WHERE NOT EXISTS(SELECT 1 FROM public.service_entitlements e WHERE e.qr_sticker_id=q.id AND e.vehicle_id=v.id
          AND e.user_id=a.user_id AND e.capability=needed.capability AND e.status='ENABLED' AND e.verified_at IS NOT NULL
          AND (e.expires_at IS NULL OR e.expires_at>now()))));
$fn$;

CREATE FUNCTION public.issue_qr_report_view_link(p_intent text,p_lease uuid,p_token_hash text) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $fn$
DECLARE i public.notification_intents; result public.qr_report_view_links; deadline timestamptz;
BEGIN
  SELECT * INTO i FROM public.notification_intents WHERE id=p_intent AND lease_token=p_lease
    AND lease_expires_at>clock_timestamp() AND source_type='QR_REPORT' FOR UPDATE;
  IF NOT FOUND OR NOT public.can_view_qr_report_intent(p_intent) THEN RETURN NULL; END IF;
  IF p_token_hash IS NULL OR p_token_hash !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'Invalid link proof'; END IF;
  SELECT least(expires_at,clock_timestamp()+interval '24 hours') INTO deadline FROM public.qr_scan_reports WHERE id=i.source_id;
  IF deadline<=clock_timestamp() THEN RETURN NULL; END IF;
  INSERT INTO public.qr_report_view_links(report_id,intent_id,token_hash,expires_at)
    VALUES(i.source_id,i.id,p_token_hash,deadline) ON CONFLICT(intent_id) DO NOTHING;
  SELECT * INTO result FROM public.qr_report_view_links WHERE intent_id=i.id;
  -- Retries never renew a link or override an owner's revocation.
  IF result.token_hash<>p_token_hash OR result.revoked_at IS NOT NULL OR result.expires_at<=clock_timestamp() THEN RETURN NULL; END IF;
  RETURN jsonb_build_object('expiresAt',result.expires_at);
END; $fn$;

CREATE FUNCTION public.resolve_qr_report_view_link(p_token_hash text) RETURNS jsonb
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $fn$
  SELECT jsonb_build_object('reason',r.reason,'vehicleReference',left(v.registration_number,2)||'••••'||right(v.registration_number,4),
    'reportedAt',r.created_at,'expiresAt',l.expires_at,'issuedAt',l.created_at,'note',r.note,'location',r.location,
    'reportReference','RPT-'||upper(right(replace(r.id,'-',''),6)),
    'photos',r.photos,'reportId',r.id)
  FROM public.qr_report_view_links l JOIN public.qr_scan_reports r ON r.id=l.report_id JOIN public.vehicles v ON v.id=r.vehicle_id
  WHERE l.token_hash=p_token_hash AND l.revoked_at IS NULL AND l.expires_at>now()
    AND public.can_view_qr_report_intent(l.intent_id);
$fn$;

CREATE FUNCTION public.revoke_qr_report_view_links(p_report text,p_owner uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $fn$
BEGIN
  UPDATE public.qr_scan_reports SET viewer_revoked_at=clock_timestamp() WHERE id=p_report AND owner_user_id=p_owner;
  IF NOT FOUND THEN RETURN false; END IF;
  UPDATE public.qr_report_view_links SET revoked_at=clock_timestamp() WHERE report_id=p_report AND revoked_at IS NULL;
  RETURN true;
END; $fn$;

-- Consent-aware provider gating. Existing apps can continue their old report
-- flow; new consented reports require the exact viewer-message approvals.
ALTER TABLE public.scan_report_template_approvals DROP CONSTRAINT scan_report_template_approvals_template_name_check;
ALTER TABLE public.scan_report_template_approvals ADD CONSTRAINT scan_report_template_approvals_template_name_check CHECK(template_name IN (
  'vhn_vehicle_report_v1','vhn_vehicle_emergency_report_v1','vhn_emergency_contact_report_v1',
  'vhn_vehicle_report_v2','vhn_vehicle_emergency_report_v2','vhn_emergency_contact_report_v2'));
INSERT INTO public.scan_report_template_approvals(template_name,status) VALUES
  ('vhn_vehicle_report_v2','PENDING'),('vhn_vehicle_emergency_report_v2','PENDING'),('vhn_emergency_contact_report_v2','PENDING');
DO $gate$
DECLARE original text; updated text;
BEGIN
  SELECT pg_get_functiondef('public.claim_notification_batch_v2(integer)'::regprocedure) INTO original;
  updated:=replace(original,
    'CASE WHEN i.template_key=''EMERGENCY_CONTACT_REPORT_V1'' THEN ''vhn_emergency_contact_report_v1''',
    'CASE WHEN EXISTS(SELECT 1 FROM public.qr_scan_reports report WHERE report.id=i.source_id AND report.viewer_consented_at IS NOT NULL) THEN
       CASE WHEN i.template_key=''EMERGENCY_CONTACT_REPORT_V1'' THEN ''vhn_emergency_contact_report_v2''
         WHEN i.payload_json::jsonb->>''reason''=''EMERGENCY'' THEN ''vhn_vehicle_emergency_report_v2'' ELSE ''vhn_vehicle_report_v2'' END
     WHEN i.template_key=''EMERGENCY_CONTACT_REPORT_V1'' THEN ''vhn_emergency_contact_report_v1''');
  IF updated=original THEN RAISE EXCEPTION 'Unexpected viewer template claim contract'; END IF;
  EXECUTE updated;
END; $gate$;
REVOKE ALL ON FUNCTION public.complete_qr_scan_report(text,jsonb,jsonb,text,text,boolean),public.can_view_qr_report_intent(text),
  public.issue_qr_report_view_link(text,uuid,text),public.resolve_qr_report_view_link(text),public.revoke_qr_report_view_links(text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.complete_qr_scan_report(text,jsonb,jsonb,text,text,boolean),public.can_view_qr_report_intent(text),
  public.issue_qr_report_view_link(text,uuid,text),public.resolve_qr_report_view_link(text),public.revoke_qr_report_view_links(text,uuid) TO service_role;
COMMIT;
