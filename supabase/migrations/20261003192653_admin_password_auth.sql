-- Passwords are managed by Supabase Auth. The console stores only the pinned
-- provider identity and hashed opaque admin sessions; it never stores passwords.
BEGIN;
ALTER TABLE public.admin_users ADD COLUMN auth_user_id uuid UNIQUE
  -- RESTRICT: deleting an Auth identity must not erase privileged account history.
  REFERENCES auth.users(id) ON DELETE RESTRICT;

CREATE TABLE public.admin_auth_limits (
  bucket text PRIMARY KEY,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  attempts integer NOT NULL DEFAULT 1 CHECK (attempts BETWEEN 1 AND 101)
);
ALTER TABLE public.admin_auth_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_auth_limits FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_auth_limits TO service_role;

-- Atomic reservations run before contacting the password provider, including
-- unknown addresses. Limits persist on unsuccessful sign-in and across servers.
CREATE FUNCTION public.admin_reserve_password_attempt(p_email_hash text)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE total integer; per_email integer;
BEGIN
  IF p_email_hash IS NULL OR p_email_hash !~ '^[a-f0-9]{64}$' THEN
    RAISE EXCEPTION 'Invalid authentication request';
  END IF;
  INSERT INTO public.admin_auth_limits AS limits (bucket) VALUES ('password:global')
  ON CONFLICT (bucket) DO UPDATE SET
    attempts=CASE WHEN limits.window_started_at<=now()-interval '1 minute' THEN 1 ELSE LEAST(limits.attempts+1,101) END,
    window_started_at=CASE WHEN limits.window_started_at<=now()-interval '1 minute' THEN now() ELSE limits.window_started_at END
  RETURNING attempts INTO total;
  IF total>100 THEN RETURN false; END IF;
  INSERT INTO public.admin_auth_limits AS limits (bucket) VALUES ('password:'||p_email_hash)
  ON CONFLICT (bucket) DO UPDATE SET
    attempts=CASE WHEN limits.window_started_at<=now()-interval '15 minutes' THEN 1 ELSE LEAST(limits.attempts+1,101) END,
    window_started_at=CASE WHEN limits.window_started_at<=now()-interval '15 minutes' THEN now() ELSE limits.window_started_at END
  RETURNING attempts INTO per_email;
  -- Cleanup expired counters while holding the global row, which serializes
  -- reservations consistently. No submitted email addresses are stored here.
  DELETE FROM public.admin_auth_limits WHERE window_started_at<now()-interval '1 day';
  RETURN per_email<=5;
END; $$;
REVOKE ALL ON FUNCTION public.admin_reserve_password_attempt(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reserve_password_attempt(text) TO service_role;

CREATE FUNCTION public.admin_password_session(p_email text,p_auth_user uuid,p_hash text,p_request uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE actor public.admin_users; ses uuid;
BEGIN
  SELECT * INTO actor FROM public.admin_users
  WHERE lower(email)=lower(p_email) AND auth_user_id=p_auth_user AND status='ACTIVE'
  FOR UPDATE;
  IF p_email IS NULL OR lower(p_email) !~ '^[^[:space:]@]+@vaahansafe[.]com$'
    OR actor.id IS NULL OR actor.role NOT IN ('SUPER_ADMIN','OPS_ADMIN','SUPPORT_AGENT','FINANCE_ADMIN','CONTENT_EDITOR','STATUS_MANAGER','READ_ONLY_ANALYST')
    OR p_hash IS NULL OR p_hash !~ '^[a-f0-9]{64}$' OR p_request IS NULL
  THEN RAISE EXCEPTION 'Admin sign-in rejected'; END IF;
  INSERT INTO public.admin_sessions(admin_id,token_hash,expires_at)
  VALUES(actor.id,p_hash,now()+interval '4 hours') RETURNING id INTO ses;
  INSERT INTO public.admin_audit_logs(actor_id,action,resource_type,resource_id,reason,request_id,before_summary,after_summary)
  VALUES(actor.id,'PASSWORD_SIGN_IN','admin_session',ses::text,'Supabase Auth verified email and password sign-in',p_request,'{}',jsonb_build_object('mobileRequired',true));
  RETURN ses;
END; $$;
REVOKE ALL ON FUNCTION public.admin_password_session(text,uuid,text,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_password_session(text,uuid,text,uuid) TO service_role;

-- The admin surface no longer accepts Google as an alternative login method.
DROP FUNCTION public.admin_google_session(text,text,text,uuid);
-- Sessions issued by the retired provider must reauthenticate with passwords.
UPDATE public.admin_sessions SET revoked_at=now() WHERE revoked_at IS NULL;
COMMIT;
