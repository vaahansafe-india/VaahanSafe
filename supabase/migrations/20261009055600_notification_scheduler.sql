BEGIN;
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- pg_net request headers are readable by database roles on hosted Supabase.
-- Send a short-lived HMAC proof instead of a reusable bearer key. The key stays in Vault.
CREATE OR REPLACE FUNCTION public.request_notification_drain() RETURNS bigint
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $fn$
DECLARE v_secret text; v_timestamp text; v_signature text;
BEGIN
  SELECT decrypted_secret INTO v_secret FROM vault.decrypted_secrets WHERE name='vaahansafe_notification_dispatch_secret' LIMIT 1;
  IF v_secret IS NULL OR length(v_secret)<32 THEN RETURN NULL; END IF;
  v_timestamp:=floor(extract(epoch FROM clock_timestamp()))::bigint::text;
  v_signature:=encode(extensions.hmac('notification-drain:'||v_timestamp,v_secret,'sha256'),'hex');
  RETURN net.http_post(url:='https://app.vaahansafe.com/api/internal/notifications/drain',
    headers:=jsonb_build_object('Content-Type','application/json','x-vaahansafe-timestamp',v_timestamp,'x-vaahansafe-signature',v_signature),
    body:='{}'::jsonb,timeout_milliseconds:=60000);
END; $fn$;
REVOKE ALL ON FUNCTION public.request_notification_drain() FROM PUBLIC,anon,authenticated,service_role;
-- Activation is a release step after the endpoint is deployed and its empty-queue check passes.
-- No historical notifications are backfilled, and no secret appears in migration text.
COMMIT;
