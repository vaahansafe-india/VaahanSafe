-- ============================================================================
-- VAAHANSAFE QUERY ENGINE UPGRADE: Robust Whitespace & Trailing Semicolon Support
-- Ensures multi-line template queries and queries with trailing semicolons
-- reliably execute as SELECT and return jsonb row arrays.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.exec_sql(p_sql text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_result jsonb;
  v_clean text;
  v_subquery text;
BEGIN
  -- Strip leading whitespace, newlines, tabs, and comments
  v_clean := regexp_replace(p_sql, '^[ \t\r\n]+', '');

  IF v_clean ~* '^(select|with|values)\s' THEN
    -- Strip trailing semicolons and whitespace so subquery packaging is always valid SQL
    v_subquery := regexp_replace(p_sql, '[;\s]+$', '');
    EXECUTE 'SELECT COALESCE(jsonb_agg(t), ''[]''::jsonb) FROM (' || v_subquery || ') t'
    INTO v_result;
    RETURN COALESCE(v_result, '[]'::jsonb);
  ELSE
    EXECUTE p_sql;
    RETURN jsonb_build_object('success', true);
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'SUPABASE_SQL_ERROR: % (STATE: %)', SQLERRM, SQLSTATE;
END;
$func$;

REVOKE ALL ON FUNCTION public.exec_sql(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;
