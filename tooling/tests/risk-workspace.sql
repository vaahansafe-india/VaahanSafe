-- Runs ONLY inside the rollback wrapper in verify-risk-workspace.mjs.
-- Uses existing QR inventory and admin identities; nothing is seeded into the product.
DO $checks$
DECLARE qr text; ses uuid; actor text; signal uuid; case_id uuid; job uuid; request uuid:=gen_random_uuid(); r jsonb; n integer;
BEGIN
 IF EXISTS(SELECT 1 FROM pg_class WHERE relname IN ('risk_cases','risk_signals','risk_signal_events','risk_commands') AND NOT relrowsecurity) THEN RAISE EXCEPTION 'RLS_MISSING';END IF;
 IF has_table_privilege('anon','public.risk_signals','SELECT') OR has_table_privilege('authenticated','public.risk_cases','UPDATE') THEN RAISE EXCEPTION 'PUBLIC_TABLE_ACCESS';END IF;
 IF has_function_privilege('anon','public.admin_risk_command(uuid,text,uuid,text,integer,text,text,text,uuid)','EXECUTE') OR has_function_privilege('authenticated','public.admin_risk_signal_detail(uuid,uuid)','EXECUTE') THEN RAISE EXCEPTION 'PUBLIC_RPC_ACCESS';END IF;
 BEGIN PERFORM public.admin_risk_summary(gen_random_uuid());RAISE EXCEPTION 'ANONYMOUS_ALLOWED';EXCEPTION WHEN SQLSTATE 'P0001' THEN IF SQLERRM<>'ADMIN_REQUIRED' THEN RAISE;END IF;END;
 SELECT id INTO qr FROM public.qr_stickers ORDER BY created_at LIMIT 1;
 SELECT s.id,s.admin_id INTO ses,actor FROM public.admin_sessions s JOIN public.admin_users a ON a.id=s.admin_id WHERE a.role IN ('SUPER_ADMIN','OPS_ADMIN') ORDER BY s.created_at DESC LIMIT 1;
 IF qr IS NULL OR ses IS NULL THEN RAISE EXCEPTION 'REAL_TEST_CONTEXT_UNAVAILABLE';END IF;
 -- Refresh a real session only in this rollback transaction to exercise authorization.
 UPDATE public.admin_sessions SET created_at=now(),expires_at=now()+interval '1 hour',revoked_at=NULL,email_verified_at=now() WHERE id=ses;
 INSERT INTO public.qr_activation_attempts(id,qr_id,outcome,created_at) VALUES('risk_preview_'||request::text,qr,'VEHICLE_MISMATCH','2026-10-13T19:00:00Z');
 SELECT id INTO signal FROM public.risk_signals WHERE source_event_id='risk_preview_'||request::text;
 IF signal IS NULL THEN RAISE EXCEPTION 'SIGNAL_TRIGGER_MISSING';END IF;
 PERFORM public.risk_capture_event('ACTIVATION','risk_preview_'||request::text);
 IF (SELECT count(*) FROM public.risk_signals WHERE source_event_id='risk_preview_'||request::text)<>1 THEN RAISE EXCEPTION 'DUPLICATE_EVALUATION';END IF;
 r:=public.admin_risk_signal_detail(ses,signal);IF r->'events' IS NULL OR r->'signal'->>'reference_code' NOT LIKE 'SIG-%' OR r::text~'(secret_hash|ip_hash|primary_phone|primary_email)' THEN RAISE EXCEPTION 'DETAIL_PRIVACY';END IF;
 SELECT count(*) INTO n FROM public.admin_risk_signals(ses,'{"from":"2026-10-14","to":"2026-10-14"}');IF n<>1 THEN RAISE EXCEPTION 'IST_DATE_BOUNDARY';END IF;
 SELECT count(*) INTO n FROM public.admin_risk_signals(ses,'{"from":"2026-10-13","to":"2026-10-13"}');IF n<>0 THEN RAISE EXCEPTION 'IST_DATE_EXCLUSION';END IF;
 PERFORM public.admin_risk_pulse(ses);PERFORM public.admin_risk_patterns(ses);PERFORM public.admin_risk_cases(ses);
 r:=public.admin_risk_command(ses,'signal',signal,'create_case',0,'Review actual source evidence','','',request);case_id:=(r->>'caseId')::uuid;
 IF case_id IS NULL THEN RAISE EXCEPTION 'CASE_NOT_CREATED';END IF;
 IF public.admin_risk_command(ses,'signal',signal,'create_case',0,'Review actual source evidence','','',request)<>r THEN RAISE EXCEPTION 'COMMAND_NOT_IDEMPOTENT';END IF;
 BEGIN PERFORM public.admin_risk_command(ses,'signal',signal,'review',0,'Changed request payload','','',request);RAISE EXCEPTION 'REQUEST_REUSE_ALLOWED';EXCEPTION WHEN SQLSTATE 'P0001' THEN IF SQLERRM<>'REQUEST_CONFLICT' THEN RAISE;END IF;END;
 BEGIN PERFORM public.admin_risk_command(ses,'signal',signal,'resolve',0,'Review actual source evidence','EXPECTED_ACTIVITY','',gen_random_uuid());RAISE EXCEPTION 'STALE_REVISION_ALLOWED';EXCEPTION WHEN SQLSTATE 'P0001' THEN IF SQLERRM<>'STATE_CHANGED' THEN RAISE;END IF;END;
 BEGIN PERFORM public.admin_risk_command(ses,'case',case_id,'resolve',0,'Review actual source evidence','EXPECTED_ACTIVITY','',gen_random_uuid());RAISE EXCEPTION 'UNREVIEWED_CASE_CLOSED';EXCEPTION WHEN SQLSTATE 'P0001' THEN IF SQLERRM<>'UNREVIEWED_SIGNALS' THEN RAISE;END IF;END;
 PERFORM public.admin_risk_case_detail(ses,case_id);PERFORM public.admin_risk_options(ses,'investigators');PERFORM public.admin_risk_options(ses,'cases');
 job:=public.admin_risk_request_export(ses,'{"category":"ACTIVATION"}',gen_random_uuid());
 UPDATE public.admin_export_jobs SET status='PROCESSING' WHERE id=job;
 r:=public.admin_risk_export_page(job);
 IF jsonb_array_length(r)<>1 OR r::text~'(secret_hash|ip_hash|primary_phone|primary_email)' THEN RAISE EXCEPTION 'EXPORT_PRIVACY';END IF;
 r:=public.admin_risk_backfill(ses,'ACTIVATION');IF (r->>'processed')::integer<>1 THEN RAISE EXCEPTION 'BACKFILL_FAILED';END IF;
 IF (SELECT count(*) FROM public.risk_signals)<>1 THEN RAISE EXCEPTION 'BACKFILL_DUPLICATE';END IF;
 PERFORM public.admin_risk_command(ses,'signal',signal,'dismiss',1,'Expected test observation reviewed','EXPECTED_ACTIVITY','',gen_random_uuid());
 PERFORM public.admin_risk_command(ses,'case',case_id,'resolve',0,'All linked observations reviewed','EXPECTED_ACTIVITY','',gen_random_uuid());
 PERFORM public.admin_risk_command(ses,'case',case_id,'close',1,'Investigation review completed','','',gen_random_uuid());
 UPDATE public.admin_users SET role='READ_ONLY_ANALYST' WHERE id=actor;
 PERFORM public.admin_risk_summary(ses);
 BEGIN PERFORM public.admin_risk_command(ses,'signal',signal,'review',2,'Read-only unauthorized review','','',gen_random_uuid());RAISE EXCEPTION 'ANALYST_MUTATION_ALLOWED';EXCEPTION WHEN SQLSTATE 'P0001' THEN IF SQLERRM<>'ADMIN_REQUIRED' THEN RAISE;END IF;END;
 UPDATE public.admin_users SET role='SUPPORT_AGENT' WHERE id=actor;PERFORM public.admin_risk_summary(ses);
 BEGIN PERFORM public.admin_risk_request_export(ses,'{}',gen_random_uuid());RAISE EXCEPTION 'SUPPORT_EXPORT_ALLOWED';EXCEPTION WHEN SQLSTATE 'P0001' THEN IF SQLERRM<>'ADMIN_REQUIRED' THEN RAISE;END IF;END;
 BEGIN PERFORM public.risk_admin_actor(ses,true);RAISE EXCEPTION 'SUPPORT_MUTATION_ALLOWED';EXCEPTION WHEN SQLSTATE 'P0001' THEN IF SQLERRM<>'ADMIN_REQUIRED' THEN RAISE;END IF;END;
 UPDATE public.admin_users SET role='FINANCE_ADMIN' WHERE id=actor;
 BEGIN PERFORM public.admin_risk_summary(ses);RAISE EXCEPTION 'FINANCE_READ_ALLOWED';EXCEPTION WHEN SQLSTATE 'P0001' THEN IF SQLERRM<>'ADMIN_REQUIRED' THEN RAISE;END IF;END;
 BEGIN DELETE FROM public.risk_signal_events WHERE signal_id=signal;RAISE EXCEPTION 'EVIDENCE_DELETE_ALLOWED';EXCEPTION WHEN SQLSTATE 'P0001' THEN IF SQLERRM<>'Audit records are immutable' THEN RAISE;END IF;END;
 UPDATE public.admin_sessions SET revoked_at=now() WHERE id=ses;
 BEGIN PERFORM public.admin_risk_summary(ses);RAISE EXCEPTION 'REVOKED_SESSION_ALLOWED';EXCEPTION WHEN SQLSTATE 'P0001' THEN IF SQLERRM<>'ADMIN_REQUIRED' THEN RAISE;END IF;END;
END;$checks$;
