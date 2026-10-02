-- Add session revocation and activity tracking without replacing existing records.
BEGIN;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS last_seen_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS revoked_at timestamptz;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS revocation_reason text;
CREATE INDEX IF NOT EXISTS sessions_active_token_hash ON public.sessions (token_hash) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS sessions_user_created ON public.sessions (user_id, created_at DESC);
-- Session access is exclusively through authenticated server domain operations.
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.sessions FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sessions TO service_role;
-- Verification, roles and identity links are only writable by server services.
REVOKE INSERT, UPDATE, DELETE ON public.auth_identities FROM anon, authenticated;
REVOKE UPDATE ON public.users FROM authenticated;
GRANT UPDATE (full_name) ON public.users TO authenticated;
-- Google profiles/links are provisioned by the verified customer callback.
-- This prevents an automatically created second profile during explicit linking.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $function$
BEGIN
  IF NEW.raw_app_meta_data->>'provider' = 'google' THEN RETURN NEW; END IF;
  INSERT INTO public.users (id, phone, primary_phone, phone_verified_at, email, primary_email, email_verified_at, full_name, role, status)
  VALUES (NEW.id, NULLIF(NEW.phone, ''), NULLIF(NEW.phone, ''), NEW.phone_confirmed_at,
    NULLIF(NEW.email, ''), NULLIF(NEW.email, ''), NEW.email_confirmed_at,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 'CUSTOMER', 'ACTIVE')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;
COMMIT;
