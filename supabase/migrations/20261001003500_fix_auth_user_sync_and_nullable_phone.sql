-- ============================================================================
-- VAAHANSAFE MIGRATION: FIX AUTH USER SYNC & NULLABLE PHONE FOR GOOGLE OAUTH
-- Description:
-- 1. Makes public.users.phone nullable so Google OAuth users can establish identity
--    before completing mandatory mobile verification.
-- 2. Ensures unique phone index ignores NULL / empty strings.
-- 3. Hardens handle_new_auth_user() trigger with exception resilience, email matching,
--    and automatic sync between auth.users and public.users.
-- ============================================================================

-- 1. Make phone nullable in public.users
ALTER TABLE public.users ALTER COLUMN phone DROP NOT NULL;

-- 2. Re-create unique index on phone so multiple null/empty values don't collide
DROP INDEX IF EXISTS idx_users_phone;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone ON public.users (phone) WHERE phone IS NOT NULL AND phone <> '';

-- 3. Hardened, exception-safe auth trigger
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_provider TEXT;
  v_phone TEXT;
  v_email TEXT;
  v_full_name TEXT;
  v_existing_id UUID;
BEGIN
  v_provider := COALESCE(NEW.raw_app_meta_data->>'provider', 'PHONE');
  
  -- Normalize phone: NULL if empty or whitespace
  v_phone := NULLIF(TRIM(COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', '')), '');
  
  -- Normalize email
  v_email := NULLIF(TRIM(NEW.email), '');

  -- Derive full name
  v_full_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
    CASE WHEN v_email IS NOT NULL THEN split_part(v_email, '@', 1) ELSE NULL END,
    'VaahanSafe Member'
  );

  -- Check if a public.users row with this email already exists
  IF v_email IS NOT NULL THEN
    SELECT id INTO v_existing_id FROM public.users WHERE email = v_email LIMIT 1;
  END IF;

  IF v_existing_id IS NOT NULL AND v_existing_id <> NEW.id THEN
    -- User already exists with this email, update their auth identity link
    UPDATE public.users
    SET 
      email_verified_at = COALESCE(public.users.email_verified_at, NEW.email_confirmed_at),
      full_name = CASE WHEN public.users.full_name = 'VaahanSafe Member' THEN v_full_name ELSE public.users.full_name END,
      updated_at = NOW()
    WHERE id = v_existing_id;

    -- Record identity under the existing user
    INSERT INTO public.auth_identities (
      user_id,
      provider,
      provider_user_id,
      verified_at
    )
    VALUES (
      v_existing_id,
      UPPER(v_provider),
      COALESCE(NEW.raw_user_meta_data->>'sub', NEW.id::text),
      NOW()
    )
    ON CONFLICT (provider, provider_user_id) DO UPDATE
    SET verified_at = NOW();

    RETURN NEW;
  END IF;

  -- Upsert public.users with NEW.id
  INSERT INTO public.users (
    id,
    email,
    email_verified_at,
    phone,
    phone_verified_at,
    full_name,
    role,
    status
  )
  VALUES (
    NEW.id,
    v_email,
    NEW.email_confirmed_at,
    v_phone,
    NEW.phone_confirmed_at,
    v_full_name,
    'CUSTOMER',
    'ACTIVE'
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = COALESCE(EXCLUDED.email, public.users.email),
    email_verified_at = COALESCE(EXCLUDED.email_verified_at, public.users.email_verified_at),
    phone = COALESCE(EXCLUDED.phone, public.users.phone),
    phone_verified_at = COALESCE(EXCLUDED.phone_verified_at, public.users.phone_verified_at),
    full_name = CASE 
      WHEN public.users.full_name = 'VaahanSafe Member' OR public.users.full_name = 'VaahanSafe User' THEN EXCLUDED.full_name 
      ELSE public.users.full_name 
    END,
    updated_at = NOW();

  -- Record auth identity
  INSERT INTO public.auth_identities (
    user_id,
    provider,
    provider_user_id,
    verified_at
  )
  VALUES (
    NEW.id,
    UPPER(v_provider),
    COALESCE(NEW.raw_user_meta_data->>'sub', NEW.id::text),
    NOW()
  )
  ON CONFLICT (provider, provider_user_id) DO UPDATE
  SET verified_at = NOW();

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log warning to PostgreSQL log but DO NOT abort the transaction,
  -- ensuring auth.users creation always succeeds
  RAISE WARNING 'handle_new_auth_user error: %, SQLSTATE: %', SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$;

-- 4. Rebind trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- 5. Add RLS policy allowing authenticated users to read and update their own public.users record
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY users_select_own ON public.users
    FOR SELECT TO authenticated
    USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY users_update_own ON public.users
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;
