-- Admin-only email confirmation; mobile verification is never fabricated.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
ALTER TABLE public.admin_sessions
  ADD COLUMN email_verified_at timestamptz,
  ADD COLUMN email_otp_challenge_hash text,
  ADD COLUMN email_otp_code_hash text,
  ADD COLUMN email_otp_sent_at timestamptz,
  ADD COLUMN email_otp_delivered_at timestamptz,
  ADD COLUMN email_otp_attempts integer NOT NULL DEFAULT 0 CHECK(email_otp_attempts BETWEEN 0 AND 5),
  ADD CONSTRAINT admin_email_challenge_hash CHECK(email_otp_challenge_hash IS NULL OR email_otp_challenge_hash ~ '^[a-f0-9]{64}$'),
  ADD CONSTRAINT admin_email_code_hash CHECK(email_otp_code_hash IS NULL OR email_otp_code_hash ~ '^[a-f0-9]{64}$');
-- Existing admin_sessions RLS and service-only grants cover these columns too.

CREATE FUNCTION public.admin_reserve_email_otp(p_session uuid,p_challenge text,p_code text)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE ses public.admin_sessions; actor public.admin_users; attempts integer;
BEGIN
 IF p_challenge IS NULL OR p_challenge !~ '^[a-f0-9]{64}$' OR p_code IS NULL OR p_code !~ '^[a-f0-9]{64}$' THEN RETURN false; END IF;
 SELECT * INTO ses FROM public.admin_sessions WHERE id=p_session AND revoked_at IS NULL AND expires_at>now() FOR UPDATE;
 SELECT * INTO actor FROM public.admin_users WHERE id=ses.admin_id AND status='ACTIVE';
 IF actor.id IS NULL OR actor.role NOT IN ('SUPER_ADMIN','OPS_ADMIN','SUPPORT_AGENT','FINANCE_ADMIN','CONTENT_EDITOR','STATUS_MANAGER','READ_ONLY_ANALYST') THEN RETURN false; END IF;
 IF ses.email_otp_sent_at>now()-interval '60 seconds' THEN RETURN false; END IF;
 INSERT INTO public.admin_auth_limits AS limits(bucket) VALUES('email_otp:'||actor.id)
 ON CONFLICT(bucket) DO UPDATE SET
  attempts=CASE WHEN limits.window_started_at<=now()-interval '15 minutes' THEN 1 ELSE LEAST(limits.attempts+1,101) END,
  window_started_at=CASE WHEN limits.window_started_at<=now()-interval '15 minutes' THEN now() ELSE limits.window_started_at END
 RETURNING limits.attempts INTO attempts;
 IF attempts>5 THEN RETURN false; END IF;
 UPDATE public.admin_sessions SET email_otp_challenge_hash=p_challenge,email_otp_code_hash=p_code,
  email_otp_sent_at=now(),email_otp_delivered_at=NULL,email_otp_attempts=0 WHERE id=p_session;
 RETURN true;
END; $$;

CREATE FUNCTION public.admin_email_otp_dispatch(p_session uuid,p_challenge text,p_success boolean)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 UPDATE public.admin_sessions SET
  email_otp_delivered_at=CASE WHEN p_success IS TRUE THEN now() ELSE NULL END,
  email_otp_code_hash=CASE WHEN p_success IS TRUE THEN email_otp_code_hash ELSE NULL END,
  email_otp_challenge_hash=CASE WHEN p_success IS TRUE THEN email_otp_challenge_hash ELSE NULL END
 WHERE id=p_session AND revoked_at IS NULL AND expires_at>now()
 AND email_otp_challenge_hash=p_challenge AND email_otp_sent_at>now()-interval '5 minutes';
 RETURN FOUND;
END; $$;

CREATE FUNCTION public.admin_verify_email_otp(p_session uuid,p_challenge text,p_code text,p_request uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE ses public.admin_sessions; actor public.admin_users;
BEGIN
 IF p_request IS NULL OR p_challenge IS NULL OR p_code IS NULL THEN RETURN false; END IF;
 SELECT * INTO ses FROM public.admin_sessions WHERE id=p_session AND revoked_at IS NULL AND expires_at>now() FOR UPDATE;
 SELECT * INTO actor FROM public.admin_users WHERE id=ses.admin_id AND status='ACTIVE';
 IF actor.id IS NULL OR actor.role NOT IN ('SUPER_ADMIN','OPS_ADMIN','SUPPORT_AGENT','FINANCE_ADMIN','CONTENT_EDITOR','STATUS_MANAGER','READ_ONLY_ANALYST')
 OR ses.email_otp_challenge_hash IS DISTINCT FROM p_challenge OR ses.email_otp_code_hash IS NULL
 OR ses.email_otp_delivered_at IS NULL OR ses.email_otp_sent_at IS NULL
 OR ses.email_otp_sent_at<=now()-interval '5 minutes' OR ses.email_otp_attempts>=5 THEN RETURN false; END IF;
 UPDATE public.admin_sessions SET email_otp_attempts=email_otp_attempts+1 WHERE id=p_session;
 IF ses.email_otp_code_hash IS DISTINCT FROM p_code THEN RETURN false; END IF;
 UPDATE public.admin_sessions SET email_verified_at=COALESCE(email_verified_at,now()),step_up_at=now(),
  email_otp_challenge_hash=NULL,email_otp_code_hash=NULL,email_otp_delivered_at=NULL WHERE id=p_session;
 INSERT INTO public.admin_audit_logs(actor_id,action,resource_type,resource_id,reason,request_id,before_summary,after_summary)
 VALUES(actor.id,'EMAIL_OTP_VERIFIED','admin_session',ses.id::text,'Work email code verified',p_request,'{}',jsonb_build_object('emailVerified',true));
 RETURN true;
END; $$;

REVOKE ALL ON FUNCTION public.admin_reserve_email_otp(uuid,text,text),public.admin_email_otp_dispatch(uuid,text,boolean),public.admin_verify_email_otp(uuid,text,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reserve_email_otp(uuid,text,text),public.admin_email_otp_dispatch(uuid,text,boolean),public.admin_verify_email_otp(uuid,text,text,uuid) TO service_role;

-- Replace only the old mobile admission predicate in these existing functions.
-- Preserve the current deployed bodies, role checks, audits and step-up checks.
DO $upgrade$
DECLARE signature text; definition text; replacement text;
BEGIN
 FOREACH signature IN ARRAY ARRAY[
  'public.admin_console_mutate(uuid,text,text,jsonb,text,uuid)',
  'public.admin_block_inventory(uuid,uuid,text,uuid)',
  'public.admin_article_mutate(uuid,text,text,jsonb,text,uuid)',
  'public.admin_request_export(uuid,text,uuid)',
  'public.admin_inventory_preview(uuid,text[],uuid)'
 ] LOOP
  definition:=pg_get_functiondef(signature::regprocedure);
  replacement:=replace(definition,'AND phone_verified_at IS NOT NULL','AND email_verified_at IS NOT NULL');
  IF replacement=definition THEN RAISE EXCEPTION 'Expected Admin admission predicate missing: %',signature; END IF;
  EXECUTE replacement;
 END LOOP;
 definition:=pg_get_functiondef('public.admin_password_session(text,uuid,text,uuid)'::regprocedure);
 replacement:=replace(definition,'''mobileRequired'',true','''emailRequired'',true');
 IF replacement=definition THEN RAISE EXCEPTION 'Expected password audit marker missing'; END IF;
 EXECUTE replacement;
END $upgrade$;
COMMIT;
