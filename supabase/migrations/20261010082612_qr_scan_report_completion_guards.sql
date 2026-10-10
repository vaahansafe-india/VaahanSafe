-- Strengthen completion checks and recover interrupted uploads without duplicating READY reports.
-- Keep the original migration immutable; all functions retain service-only grants.
BEGIN;
DO $guard$
DECLARE definition text;
BEGIN
  SELECT pg_get_functiondef('public.begin_qr_scan_report(text,uuid,text)'::regprocedure) INTO definition;
  IF position('SELECT r.id,r.status INTO old_report' IN definition)=0 THEN
    RAISE EXCEPTION 'Unexpected report reservation contract';
  END IF;
  definition:=replace(definition,'SELECT r.id,r.status INTO old_report','SELECT r.id,r.status,r.created_at INTO old_report');
  definition:=replace(definition,
    'IF FOUND THEN RETURN jsonb_build_object(''id'',old_report.id,''status'',old_report.status); END IF;',
    'IF FOUND THEN
      IF old_report.status=''UPLOADING'' AND old_report.created_at<clock_timestamp()-interval ''5 minutes'' THEN
        UPDATE public.qr_scan_reports SET status=''FAILED'' WHERE id=old_report.id AND status=''UPLOADING'';
        old_report.status:=''FAILED'';
      END IF;
      RETURN jsonb_build_object(''id'',old_report.id,''status'',old_report.status);
    END IF;');
  EXECUTE definition;

  SELECT pg_get_functiondef('public.complete_qr_scan_report(text,jsonb,jsonb,text,text)'::regprocedure) INTO definition;
  IF position('JOIN public.vehicles v ON v.id=a.vehicle_id WHERE' IN definition)=0 THEN
    RAISE EXCEPTION 'Unexpected report completion contract';
  END IF;
  -- Acquire the QR lock before the report lock, matching reservation lock order.
  definition:=replace(definition,'SELECT * INTO r FROM public.qr_scan_reports WHERE id=p_id FOR UPDATE;',
    'PERFORM 1 FROM public.qr_stickers WHERE id=(SELECT qr_id FROM public.qr_scan_reports WHERE id=p_id) FOR UPDATE;
     SELECT * INTO r FROM public.qr_scan_reports WHERE id=p_id FOR UPDATE;');
  definition:=replace(definition,'IF r.status=''READY'' THEN RETURN true; END IF;',
    'IF r.expires_at<=clock_timestamp() THEN RETURN false; END IF;
     IF r.status=''READY'' THEN RETURN true; END IF;');
  definition:=replace(definition,'JOIN public.vehicles v ON v.id=a.vehicle_id WHERE',
    'JOIN public.vehicles v ON v.id=a.vehicle_id JOIN public.users u ON u.id=r.owner_user_id WHERE');
  definition:=replace(definition,'AND a.vehicle_id=r.vehicle_id',
    'AND u.status=''ACTIVE'' AND u.deleted_at IS NULL AND u.phone_verified_at IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM public.qr_assignments other WHERE other.qr_id=q.id AND other.ended_at IS NULL AND other.id<>a.id)
     AND a.vehicle_id=r.vehicle_id');
  definition:=replace(definition,'''EMERGENCY_TRIGGER'',''RESOLVED_ACTIVE'',''Browser'',''FINDER_REPORT''',
    'CASE WHEN p_reason=''EMERGENCY'' THEN ''EMERGENCY_TRIGGER'' ELSE ''PUBLIC_RESOLVE'' END,''RESOLVED_ACTIVE'',''Browser'',''FINDER_REPORT''');
  definition:=replace(definition,'/scan-history?report=','/scan-history?period=90D&report=');
  EXECUTE definition;
END; $guard$;
COMMIT;
