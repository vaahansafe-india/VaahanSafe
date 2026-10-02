-- ============================================================================
-- VAAHANSAFE SUPABASE QUERY ENGINE - ENHANCED SQLITE COMPATIBILITY LAYER
-- Overloads datetime() and related functions to support all SQLite modifier syntax
-- ============================================================================

-- Drop 1-argument datetime if needed or replace
CREATE OR REPLACE FUNCTION public.datetime(val text, modifier text DEFAULT NULL)
RETURNS timestamptz
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  base_time timestamptz;
  clean_mod text;
BEGIN
  IF val = 'now' THEN
    base_time := clock_timestamp();
  ELSE
    base_time := val::timestamptz;
  END IF;

  IF modifier IS NOT NULL THEN
    clean_mod := trim(modifier);
    IF clean_mod ILIKE 'start of day' THEN
      base_time := date_trunc('day', base_time);
    ELSIF clean_mod ILIKE 'start of month' THEN
      base_time := date_trunc('month', base_time);
    ELSIF clean_mod ILIKE 'start of year' THEN
      base_time := date_trunc('year', base_time);
    ELSE
      IF left(clean_mod, 1) = '+' THEN
        clean_mod := trim(substring(clean_mod from 2));
      END IF;
      BEGIN
        base_time := base_time + clean_mod::interval;
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END;
    END IF;
  END IF;

  RETURN base_time;
END;
$$;

-- 3-parameter overload: datetime('now', '+1 day', 'start of day')
CREATE OR REPLACE FUNCTION public.datetime(val text, mod1 text, mod2 text)
RETURNS timestamptz
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  res timestamptz;
BEGIN
  res := public.datetime(val, mod1);
  res := public.datetime(res::text, mod2);
  RETURN res;
END;
$$;

-- date() compatibility
CREATE OR REPLACE FUNCTION public.date(val text DEFAULT 'now')
RETURNS date
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE 
    WHEN val = 'now' THEN CURRENT_DATE 
    ELSE val::date 
  END;
$$;

-- time() compatibility
CREATE OR REPLACE FUNCTION public.time(val text DEFAULT 'now')
RETURNS time
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE 
    WHEN val = 'now' THEN CURRENT_TIME 
    ELSE val::time 
  END;
$$;
