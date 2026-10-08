BEGIN;

-- Anonymous pre-auth audit records have no account FK: preserve them through account changes.
-- Only hashes of phone, client IP, and cookie token are persisted; codes remain at MSG91.
CREATE TABLE public.auth_otp_requests (
  id text PRIMARY KEY,
  token_hash text NOT NULL UNIQUE CHECK (token_hash ~ '^[a-f0-9]{64}$'),
  phone_hash text NOT NULL CHECK (phone_hash ~ '^[a-f0-9]{64}$'),
  ip_hash text NOT NULL CHECK (ip_hash ~ '^[a-f0-9]{64}$'),
  surface text NOT NULL CHECK (surface IN ('CUSTOMER','ACTIVATE','API','ADMIN')),
  channel text NOT NULL CHECK (channel IN ('SMS','WHATSAPP')),
  status text NOT NULL CHECK (status IN ('RESERVED','SENT','VERIFYING','VERIFIED','FAILED')),
  provider_request_id text CHECK (provider_request_id IS NULL OR length(provider_request_id) BETWEEN 8 AND 256),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count BETWEEN 0 AND 5),
  created_at bigint NOT NULL,
  expires_at bigint NOT NULL CHECK (expires_at = created_at + 300000),
  verified_at bigint
);
CREATE INDEX auth_otp_phone_time ON public.auth_otp_requests (phone_hash, created_at DESC);
CREATE INDEX auth_otp_ip_time ON public.auth_otp_requests (ip_hash, created_at DESC);
CREATE INDEX auth_otp_expiry ON public.auth_otp_requests (expires_at);
ALTER TABLE public.auth_otp_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.auth_otp_requests FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.auth_otp_requests TO service_role;

CREATE FUNCTION public.auth_otp_reserve(p_id text, p_token_hash text, p_phone_hash text, p_ip_hash text, p_surface text, p_channel text)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE now_ms bigint;
BEGIN
  -- Always acquire IP then phone locks. This serializes all surfaces, including different IPs.
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('otp-ip:' || p_ip_hash, 0));
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('otp-phone:' || p_phone_hash, 0));
  now_ms := floor(extract(epoch FROM clock_timestamp()) * 1000)::bigint;
  IF EXISTS (SELECT 1 FROM public.auth_otp_requests WHERE phone_hash = p_phone_hash AND created_at > now_ms - 60000)
    OR (SELECT count(*) FROM public.auth_otp_requests WHERE phone_hash = p_phone_hash AND created_at > now_ms - 900000) >= 5
    OR (SELECT count(*) FROM public.auth_otp_requests WHERE ip_hash = p_ip_hash AND created_at > now_ms - 900000) >= 20
  THEN RETURN false; END IF;
  INSERT INTO public.auth_otp_requests (id, token_hash, phone_hash, ip_hash, surface, channel, status, created_at, expires_at)
  VALUES (p_id, p_token_hash, p_phone_hash, p_ip_hash, p_surface, p_channel, 'RESERVED', now_ms, now_ms + 300000);
  RETURN true;
END; $$;

CREATE FUNCTION public.auth_otp_finish_dispatch(p_id text, p_success boolean, p_request_id text)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE changed integer;
BEGIN
  UPDATE public.auth_otp_requests SET status = CASE WHEN p_success THEN 'SENT' ELSE 'FAILED' END,
    provider_request_id = CASE WHEN p_success THEN p_request_id ELSE NULL END
  WHERE id = p_id AND status = 'RESERVED'
    AND (NOT p_success OR channel = 'SMS' OR p_request_id IS NOT NULL);
  GET DIAGNOSTICS changed = ROW_COUNT;
  RETURN changed = 1;
END; $$;

CREATE FUNCTION public.auth_otp_claim_verification(p_token_hash text, p_phone_hash text, p_surface text)
RETURNS TABLE (id text, channel text, provider_request_id text)
LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$
  UPDATE public.auth_otp_requests AS challenge SET status = 'VERIFYING', attempt_count = attempt_count + 1
  WHERE challenge.token_hash = p_token_hash AND challenge.phone_hash = p_phone_hash
    AND challenge.surface = p_surface AND challenge.status = 'SENT'
    AND challenge.expires_at > floor(extract(epoch FROM clock_timestamp()) * 1000)::bigint
    AND challenge.attempt_count < 5
  RETURNING challenge.id, challenge.channel, challenge.provider_request_id;
$$;

CREATE FUNCTION public.auth_otp_finish_verification(p_id text, p_success boolean)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE changed integer;
BEGIN
  UPDATE public.auth_otp_requests SET status = CASE WHEN p_success THEN 'VERIFIED' ELSE 'SENT' END,
    verified_at = CASE WHEN p_success THEN floor(extract(epoch FROM clock_timestamp()) * 1000)::bigint ELSE NULL END
  WHERE id = p_id AND status = 'VERIFYING';
  GET DIAGNOSTICS changed = ROW_COUNT;
  RETURN changed = 1;
END; $$;

REVOKE ALL ON FUNCTION public.auth_otp_reserve(text,text,text,text,text,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.auth_otp_finish_dispatch(text,boolean,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.auth_otp_claim_verification(text,text,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.auth_otp_finish_verification(text,boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auth_otp_reserve(text,text,text,text,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.auth_otp_finish_dispatch(text,boolean,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.auth_otp_claim_verification(text,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.auth_otp_finish_verification(text,boolean) TO service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
