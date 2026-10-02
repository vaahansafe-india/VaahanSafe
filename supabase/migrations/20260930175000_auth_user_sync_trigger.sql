-- ============================================================================
-- VAAHANSAFE SUPABASE AUTH & GOOGLE OAUTH AUTOMATIC USER SYNCHRONIZATION
-- Automatically syncs auth.users (Google OAuth & Phone) into public.users & public.auth_identities
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_provider TEXT;
  v_phone TEXT;
BEGIN
  v_provider := COALESCE(NEW.raw_app_meta_data->>'provider', 'PHONE');
  v_phone := COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', '');

  -- Insert or update public.users
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
    NEW.email,
    CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN NEW.email_confirmed_at ELSE NULL END,
    v_phone,
    CASE WHEN NEW.phone_confirmed_at IS NOT NULL THEN NEW.phone_confirmed_at ELSE NULL END,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1),
      'VaahanSafe User'
    ),
    'CUSTOMER',
    'ACTIVE'
  )
  ON CONFLICT (id) DO UPDATE
  SET email = COALESCE(EXCLUDED.email, public.users.email),
      email_verified_at = COALESCE(EXCLUDED.email_verified_at, public.users.email_verified_at),
      full_name = CASE 
        WHEN public.users.full_name = 'VaahanSafe User' THEN EXCLUDED.full_name 
        ELSE public.users.full_name 
      END,
      updated_at = NOW();

  -- Record auth identity
  IF NEW.raw_app_meta_data->>'provider' IS NOT NULL THEN
    INSERT INTO public.auth_identities (
      user_id,
      provider,
      provider_user_id,
      verified_at
    )
    VALUES (
      NEW.id,
      UPPER(NEW.raw_app_meta_data->>'provider'),
      NEW.id::text,
      NOW()
    )
    ON CONFLICT (provider, provider_user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();
