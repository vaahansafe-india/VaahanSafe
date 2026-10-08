-- Migration: 20261006151802_add_whatsapp_otp_and_channel_tracking.sql
-- Description: Adds WhatsApp OTP template channel tracking, admin OTP channel support,
-- and authoritative audit table for customer & admin OTP authentication dispatches.

BEGIN;

-- 1. Extend admin_sessions with delivery channel tracking
ALTER TABLE public.admin_sessions 
ADD COLUMN IF NOT EXISTS otp_channel text DEFAULT 'WHATSAPP' 
CHECK (otp_channel IN ('SMS', 'WHATSAPP'));

-- 2. Update admin_reserve_otp to support selecting delivery channel (WHATSAPP or SMS)
CREATE OR REPLACE FUNCTION public.admin_reserve_otp(
  p_session uuid,
  p_phone text,
  p_request uuid,
  p_channel text DEFAULT 'WHATSAPP'
)
RETURNS timestamptz LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE
  ses public.admin_sessions;
  actor public.admin_users;
  sent timestamptz := now();
  channel_val text;
BEGIN
  channel_val := CASE WHEN upper(COALESCE(p_channel, 'WHATSAPP')) = 'SMS' THEN 'SMS' ELSE 'WHATSAPP' END;

  SELECT * INTO ses FROM public.admin_sessions 
  WHERE id = p_session AND revoked_at IS NULL AND expires_at > now() 
  FOR UPDATE;

  SELECT * INTO actor FROM public.admin_users 
  WHERE id = ses.admin_id AND status = 'ACTIVE' 
  FOR UPDATE;

  IF actor.id IS NULL OR p_phone !~ '^\+91[6-9][0-9]{9}$' OR (actor.verified_mobile IS NOT NULL AND actor.verified_mobile <> p_phone) THEN 
    RAISE EXCEPTION 'Mobile request rejected'; 
  END IF;

  IF ses.otp_sent_at > now() - interval '1 minute' OR (
    SELECT count(*) FROM public.admin_audit_logs 
    WHERE actor_id = actor.id AND action = 'OTP_REQUEST' AND created_at > now() - interval '1 hour'
  ) >= 5 THEN 
    RAISE EXCEPTION 'OTP rate limit'; 
  END IF;

  UPDATE public.admin_sessions 
  SET pending_phone = p_phone, 
      otp_sent_at = sent, 
      otp_attempts = 0, 
      otp_channel = channel_val 
  WHERE id = p_session;

  INSERT INTO public.admin_audit_logs(actor_id, action, resource_type, resource_id, reason, request_id, before_summary, after_summary)
  VALUES(
    actor.id,
    'OTP_REQUEST',
    'admin_session',
    p_session::text,
    'Mobile authentication request via ' || channel_val,
    p_request,
    '{}',
    jsonb_build_object('channel', channel_val, 'phone', p_phone)
  );

  RETURN sent;
END; $$;

REVOKE ALL ON FUNCTION public.admin_reserve_otp(uuid, text, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reserve_otp(uuid, text, uuid, text) TO service_role;

-- Maintain backward compatibility for 3-argument call signature
CREATE OR REPLACE FUNCTION public.admin_reserve_otp(
  p_session uuid,
  p_phone text,
  p_request uuid
)
RETURNS timestamptz LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
  RETURN public.admin_reserve_otp(p_session, p_phone, p_request, 'WHATSAPP');
END; $$;

REVOKE ALL ON FUNCTION public.admin_reserve_otp(uuid, text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reserve_otp(uuid, text, uuid) TO service_role;

-- 3. Dedicated authoritative audit table for OTP authentications
CREATE TABLE IF NOT EXISTS public.auth_otp_dispatches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('SMS', 'WHATSAPP')),
  request_id text,
  provider text NOT NULL DEFAULT 'MSG91',
  template_key text NOT NULL DEFAULT 'vhn_auth_otp_v1',
  ip_hash text,
  status text NOT NULL DEFAULT 'SENT',
  dispatched_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz
);

ALTER TABLE public.auth_otp_dispatches ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.auth_otp_dispatches FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.auth_otp_dispatches TO service_role;

CREATE INDEX IF NOT EXISTS idx_auth_otp_dispatches_phone_time ON public.auth_otp_dispatches (phone, dispatched_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_otp_dispatches_request_id ON public.auth_otp_dispatches (request_id);

COMMIT;
