-- ============================================================================
-- VAAHANSAFE SUPABASE QUERY ENGINE & SQLITE COMPATIBILITY LAYER
-- Enables authoritative server-side domain services to run directly on Supabase PostgreSQL,
-- completely removing Cloudflare D1 (SQLite) from the application path.
-- ============================================================================

-- 1. SQLite compatibility functions in PostgreSQL
CREATE OR REPLACE FUNCTION public.datetime(val text)
RETURNS timestamptz
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE 
    WHEN val = 'now' THEN clock_timestamp() 
    ELSE val::timestamptz 
  END;
$$;

-- 2. Secure server-side query executor for domain repositories (service_role only)
CREATE OR REPLACE FUNCTION public.exec_sql(p_sql text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_trimmed text;
BEGIN
  v_trimmed := lower(trim(p_sql));

  IF v_trimmed ~ '^(select|with)' THEN
    EXECUTE 'SELECT COALESCE(jsonb_agg(t), ''[]''::jsonb) FROM (' || p_sql || ') t'
    INTO v_result;
    RETURN COALESCE(v_result, '[]'::jsonb);
  ELSE
    EXECUTE p_sql;
    RETURN jsonb_build_object('success', true);
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'SUPABASE_SQL_ERROR: % (STATE: %)', SQLERRM, SQLSTATE;
END;
$$;

-- 3. Strict security: Restrict exec_sql to service_role only
REVOKE ALL ON FUNCTION public.exec_sql(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;
