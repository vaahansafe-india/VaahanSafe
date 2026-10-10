BEGIN;
-- Short-lived usage counter, not analytics history. Session deletion may safely
-- remove this ephemeral limiter; domain/audit records are never cascaded.
CREATE TABLE public.customer_analytics_limits (
 session_id uuid PRIMARY KEY REFERENCES public.sessions(id) ON DELETE CASCADE,
 window_start timestamptz NOT NULL,
 requests integer NOT NULL CHECK(requests>0)
);
ALTER TABLE public.customer_analytics_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.customer_analytics_limits FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.customer_analytics_limits TO service_role;
CREATE FUNCTION public.customer_analytics_limit(p_session uuid) RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE allowed boolean;
BEGIN
 IF public.vault_session_owner(p_session) IS NULL THEN RETURN false; END IF;
 INSERT INTO public.customer_analytics_limits(session_id,window_start,requests)
 VALUES(p_session,date_trunc('minute',now()),1)
 ON CONFLICT(session_id) DO UPDATE SET
  requests=CASE WHEN customer_analytics_limits.window_start=excluded.window_start THEN customer_analytics_limits.requests+1 ELSE 1 END,
  window_start=excluded.window_start
 WHERE customer_analytics_limits.window_start<>excluded.window_start OR customer_analytics_limits.requests<90
 RETURNING true INTO allowed;
 RETURN coalesce(allowed,false);
END $$;
REVOKE ALL ON FUNCTION public.customer_analytics_limit(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.customer_analytics_limit(uuid) TO service_role;
COMMIT;
