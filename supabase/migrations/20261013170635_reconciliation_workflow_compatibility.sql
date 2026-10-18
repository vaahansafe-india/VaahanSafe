-- Preserve legacy entry points while requiring the new workflow for snapshot counts.
BEGIN;
DO $$ DECLARE definition text;name text;r record;BEGIN
 FOREACH name IN ARRAY ARRAY['admin_distributor_projection','admin_retailer_projection'] LOOP
  definition:=pg_get_viewdef(('public.'||name)::regclass,true);
  -- Restrict only the reconciliation aggregate; draft physical totals are not shortages.
  IF position('FROM public.admin_stock_reconciliations' IN definition)>0 THEN
   definition:=replace(definition,'FROM public.admin_stock_reconciliations', 'FROM (SELECT * FROM public.admin_stock_reconciliations WHERE phase IS DISTINCT FROM ''COUNTING'' AND phase IS DISTINCT FROM ''CANCELLED'') admin_stock_reconciliations');
  ELSE
   definition:=replace(definition,'FROM admin_stock_reconciliations', 'FROM (SELECT * FROM public.admin_stock_reconciliations WHERE phase IS DISTINCT FROM ''COUNTING'' AND phase IS DISTINCT FROM ''CANCELLED'') admin_stock_reconciliations');
  END IF;
  EXECUTE format('CREATE OR REPLACE VIEW public.%I WITH(security_invoker=true) AS %s',name,definition);
 END LOOP;
 FOR r IN SELECT p.oid FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname IN ('admin_distributor_review_reconciliation','admin_retailer_review_reconciliation') LOOP
  definition:=pg_get_functiondef(r.oid);
  definition:=replace(definition,'actor:=public.inventory_admin_actor(p_session,true);','actor:=public.inventory_admin_actor(p_session,true);IF EXISTS(SELECT 1 FROM public.admin_stock_reconciliations WHERE id=p_record AND phase IS NOT NULL) THEN RAISE EXCEPTION ''RECONCILIATION_CONTROL_REQUIRED'';END IF;');
  EXECUTE definition;
 END LOOP;
END;$$;
NOTIFY pgrst,'reload schema';
COMMIT;
