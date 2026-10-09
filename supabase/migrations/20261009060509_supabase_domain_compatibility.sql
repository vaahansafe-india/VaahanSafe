BEGIN;
-- Existing shared repositories use these SQLite-compatible date expressions.
-- PostgreSQL does not implicitly cast timestamptz arguments to text.
CREATE OR REPLACE FUNCTION public.datetime(val text) RETURNS timestamptz LANGUAGE sql VOLATILE SET search_path='' AS $fn$
  SELECT CASE WHEN val='now' THEN clock_timestamp() ELSE val::timestamptz END;
$fn$;
CREATE OR REPLACE FUNCTION public.datetime(val timestamptz) RETURNS timestamptz LANGUAGE sql IMMUTABLE SET search_path='' AS $fn$
  SELECT val;
$fn$;
-- Remove the overlapping default argument; the explicit one-argument overload
-- already handles it. No CASCADE: any unexpected dependency blocks this migration.
DROP FUNCTION public.datetime(text,text);
CREATE FUNCTION public.datetime(val text,modifier text) RETURNS timestamptz LANGUAGE plpgsql VOLATILE SET search_path='' AS $fn$
BEGIN
  IF modifier IS NULL THEN RETURN public.datetime(val); END IF;
  IF lower(trim(modifier)) IN ('start of day','start of month','start of year') THEN
    RETURN date_trunc(substring(lower(trim(modifier)) FROM 10),public.datetime(val));
  END IF;
  IF modifier !~ '^[+-]?[0-9]+ (seconds?|minutes?|hours?|days?)$' THEN RAISE EXCEPTION 'Unsupported time modifier'; END IF;
  RETURN public.datetime(val)+modifier::interval;
END; $fn$;
ALTER FUNCTION public.datetime(text,text,text) VOLATILE;
ALTER FUNCTION public.date(text) STABLE;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'INTERNAL';
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS provider_subscription_id text;
CREATE UNIQUE INDEX IF NOT EXISTS subscription_provider_reference ON public.subscriptions(provider,provider_subscription_id)
  WHERE provider_subscription_id IS NOT NULL;
CREATE TABLE IF NOT EXISTS public.subscription_events (
  id text PRIMARY KEY,
  -- RESTRICT preserves billing/preference audit history when a subscription is archived.
  subscription_id text NOT NULL REFERENCES public.subscriptions(id) ON DELETE RESTRICT,
  event_type text NOT NULL CHECK(event_type IN ('CREATED','PAYMENT_CONFIRMED','ACTIVATED','RENEWAL_SUCCEEDED','RENEWAL_FAILED','PAST_DUE','RECOVERED','CANCELLATION_REQUESTED','CANCELLED','EXPIRED','AUTO_RENEWAL_CHANGED')),
  payload_json text,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX IF NOT EXISTS subscription_events_timeline ON public.subscription_events(subscription_id,created_at,id);
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.subscription_events FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT ON public.subscription_events TO service_role;

-- Own-account renewal preferences and audit are committed together. They never create a payment or entitlement.
CREATE OR REPLACE FUNCTION public.set_subscription_auto_renew(p_user text,p_subscription text,p_cancel boolean) RETURNS boolean
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $fn$
DECLARE s public.subscriptions;
BEGIN
  SELECT * INTO s FROM public.subscriptions WHERE id=p_subscription AND user_id=p_user AND status IN ('ACTIVE','CANCEL_AT_PERIOD_END')
    AND current_period_end>clock_timestamp() FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  IF NOT p_cancel AND (s.provider NOT IN ('RAZORPAY','CASHFREE') OR s.provider_subscription_id IS NULL) THEN RETURN false; END IF;
  IF s.cancel_at_period_end=p_cancel THEN RETURN true; END IF;
  UPDATE public.subscriptions SET cancel_at_period_end=p_cancel,status='ACTIVE',updated_at=clock_timestamp() WHERE id=s.id;
  INSERT INTO public.subscription_events(id,subscription_id,event_type,payload_json)
    VALUES('sev_'||gen_random_uuid()::text,s.id,CASE WHEN p_cancel THEN 'CANCELLATION_REQUESTED' ELSE 'AUTO_RENEWAL_CHANGED' END,
      jsonb_build_object('updatedBy',p_user,'cancelAtPeriodEnd',p_cancel)::text);
  RETURN true;
END; $fn$;
REVOKE ALL ON FUNCTION public.set_subscription_auto_renew(text,text,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.set_subscription_auto_renew(text,text,boolean) TO service_role;
COMMIT;
