import fs from "node:fs/promises";
import nextEnv from "@next/env";
nextEnv.loadEnvConfig("apps/admin", true);
const base = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  key = process.env.SUPABASE_SERVICE_ROLE_KEY;
async function sql(query) {
  const r = await fetch(`${base}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_sql: query }),
    signal: AbortSignal.timeout(60000),
  });
  const body = await r.json();
  if (!r.ok)
    throw new Error(`Verification failed (${body.code}): ${body.message}`);
  return body;
}
const migration = await fs.readFile(
  "supabase/migrations/20261010062510_distributor_operations.sql",
  "utf8",
);
const installed = await sql(
  "SELECT to_regprocedure('public.admin_distributor_list(uuid,jsonb,jsonb)') IS NOT NULL AS installed",
);
const baseline = await sql(
  "SELECT (SELECT count(*) FROM public.admin_partners)::integer AS partners,(SELECT count(*) FROM public.admin_audit_logs)::integer AS audits,EXISTS(SELECT 1 FROM public.admin_sessions s JOIN public.admin_users a ON a.id=s.admin_id WHERE s.revoked_at IS NULL AND s.expires_at>now() AND s.created_at>now()-interval '4 hours' AND s.email_verified_at IS NOT NULL AND a.status='ACTIVE' AND a.role IN ('SUPER_ADMIN','OPS_ADMIN')) AS authenticated_checks_available",
);
if (!baseline[0].authenticated_checks_available)
  throw new Error(
    "Sign in to admin before running authenticated distributor validation.",
  );
const checks = `
DO $verify$
DECLARE denied boolean:=false;sid uuid;actor text;record_id text;created_stamp timestamptz;values_json jsonb;result jsonb;district text;bad_district text;batch text;transfer text;available integer;before_count integer;
BEGIN
 IF (SELECT count(*) FROM public.admin_geo_states)<>36 OR (SELECT count(*) FROM public.admin_geo_districts)<750 THEN RAISE EXCEPTION 'INCOMPLETE_GEOGRAPHY';END IF;
 IF EXISTS(SELECT 1 FROM pg_class WHERE relname IN ('admin_geo_states','admin_geo_districts','admin_partner_territories','admin_stock_transfer_items') AND (NOT relrowsecurity OR has_table_privilege('anon',oid,'SELECT') OR has_table_privilege('authenticated',oid,'SELECT'))) THEN RAISE EXCEPTION 'PUBLIC_TABLE_ACCESS';END IF;
 IF EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND proname LIKE 'admin_distributor_%' AND (prosecdef OR has_function_privilege('anon',p.oid,'EXECUTE') OR has_function_privilege('authenticated',p.oid,'EXECUTE'))) THEN RAISE EXCEPTION 'PUBLIC_FUNCTION_ACCESS';END IF;
 BEGIN PERFORM public.admin_distributor_summary(NULL);EXCEPTION WHEN OTHERS THEN denied:=SQLERRM='ADMIN_REQUIRED';END;
 IF NOT denied THEN RAISE EXCEPTION 'MISSING_SESSION_ACCEPTED';END IF;
 SELECT s.id,a.id INTO sid,actor FROM public.admin_sessions s JOIN public.admin_users a ON a.id=s.admin_id WHERE s.revoked_at IS NULL AND s.expires_at>now() AND s.created_at>now()-interval '4 hours' AND s.email_verified_at IS NOT NULL AND a.status='ACTIVE' AND a.role IN ('SUPER_ADMIN','OPS_ADMIN') ORDER BY s.created_at DESC LIMIT 1;
 IF sid IS NOT NULL THEN
  SELECT code INTO district FROM public.admin_geo_districts WHERE state_code='AP' AND name='Kakinada';
  SELECT code INTO bad_district FROM public.admin_geo_districts WHERE state_code='KA' LIMIT 1;
  values_json:=jsonb_build_object('name','Distributor validation probe','state_code','AP','district_code',district,'city','Kakinada','postal_code','533001','address_line_1','Transactional validation only','contact_name','Validation contact','contact_phone','+919876543210','territories',jsonb_build_array(jsonb_build_object('state_code','AP','district_code',district)));
  record_id:=public.admin_distributor_save(sid,NULL,NULL,values_json,'Transactional validation only',gen_random_uuid());
  SELECT updated_at INTO created_stamp FROM public.admin_partners WHERE id=record_id;
  result:=public.admin_distributor_detail(sid,record_id);
  IF result->'distributor'->>'on_hand'<>'0' OR jsonb_array_length(result->'territories')<>1 THEN RAISE EXCEPTION 'PROJECTION_MISMATCH';END IF;
  IF NOT EXISTS(SELECT 1 FROM public.admin_audit_logs WHERE resource_id=record_id AND action='distributor.created') THEN RAISE EXCEPTION 'AUDIT_MISSING';END IF;
  denied:=false;BEGIN PERFORM public.admin_distributor_save(sid,record_id,created_stamp-interval '1 second',values_json,'Stale edit validation only',gen_random_uuid());EXCEPTION WHEN OTHERS THEN denied:=SQLERRM='DISTRIBUTOR_CHANGED';END;IF NOT denied THEN RAISE EXCEPTION 'STALE_EDIT_ACCEPTED';END IF;
  denied:=false;BEGIN PERFORM public.admin_distributor_save(sid,record_id,created_stamp,jsonb_set(values_json,'{district_code}',to_jsonb(bad_district)),'Geography validation only',gen_random_uuid());EXCEPTION WHEN OTHERS THEN denied:=SQLERRM='INVALID_DISTRIBUTOR';END;IF NOT denied THEN RAISE EXCEPTION 'INVALID_GEOGRAPHY_ACCEPTED';END IF;
  denied:=false;BEGIN PERFORM public.admin_distributor_save(sid,record_id,created_stamp,jsonb_set(values_json,'{territories}',(values_json->'territories')||(values_json->'territories')),'Territory validation only',gen_random_uuid());EXCEPTION WHEN OTHERS THEN denied:=SQLERRM='DUPLICATE_TERRITORY';END;IF NOT denied THEN RAISE EXCEPTION 'DUPLICATE_TERRITORY_ACCEPTED';END IF;
  PERFORM public.admin_distributor_status(sid,record_id,created_stamp,'SUSPENDED',NULL,'Suspension validation only',gen_random_uuid());
  denied:=false;BEGIN PERFORM public.admin_distributor_request_transfer(sid,record_id,'not-an-inventory-batch',1,'Suspension validation only',gen_random_uuid());EXCEPTION WHEN OTHERS THEN denied:=SQLERRM='SUSPENDED_PARTNER';END;IF NOT denied THEN RAISE EXCEPTION 'SUSPENDED_TRANSFER_ACCEPTED';END IF;
  SELECT updated_at INTO created_stamp FROM public.admin_partners WHERE id=record_id;
  PERFORM public.admin_distributor_status(sid,record_id,created_stamp,'ACTIVE',NULL,'Reactivation validation only',gen_random_uuid());
  SELECT o->>'id',(o->>'available')::integer INTO batch,available FROM jsonb_array_elements(public.admin_distributor_transfer_options(sid)) o LIMIT 1;
  IF batch IS NOT NULL THEN
    transfer:=public.admin_distributor_request_transfer(sid,record_id,batch,1,'Transfer reservation validation only',gen_random_uuid());
    IF (SELECT count(*) FROM public.admin_stock_transfer_items WHERE transfer_id=transfer AND released_at IS NULL)<>1 THEN RAISE EXCEPTION 'RESERVATION_MISSING';END IF;
    PERFORM public.admin_distributor_transfer_transition(sid,record_id,transfer,'REQUESTED','IN_TRANSIT','Dispatch validation only',gen_random_uuid());
    result:=public.admin_distributor_detail(sid,record_id);IF result->'distributor'->>'in_transit'<>'1' OR result->'distributor'->>'on_hand'<>'0' THEN RAISE EXCEPTION 'IN_TRANSIT_SUMMARY_WRONG';END IF;
    PERFORM public.admin_distributor_transfer_transition(sid,record_id,transfer,'IN_TRANSIT','RECEIVED','Receipt validation only',gen_random_uuid());
    result:=public.admin_distributor_detail(sid,record_id);IF result->'distributor'->>'on_hand'<>'1' OR result->'distributor'->>'in_transit'<>'0' THEN RAISE EXCEPTION 'CUSTODY_SUMMARY_WRONG';END IF;
    denied:=false;BEGIN PERFORM public.admin_distributor_transfer_transition(sid,record_id,transfer,'IN_TRANSIT','RECEIVED','Duplicate receipt validation only',gen_random_uuid());EXCEPTION WHEN OTHERS THEN denied:=SQLERRM='TRANSFER_CHANGED';END;IF NOT denied THEN RAISE EXCEPTION 'DUPLICATE_RECEIPT_ACCEPTED';END IF;
    PERFORM public.admin_distributor_reconcile(sid,record_id,1,0,'Variance validation only',gen_random_uuid());
    result:=public.admin_distributor_detail(sid,record_id);IF result->'distributor'->>'unresolved_variance'<>'1' THEN RAISE EXCEPTION 'VARIANCE_SUMMARY_WRONG';END IF;
  END IF;
  result:=public.admin_distributor_history(sid,record_id,'activity',NULL);
  IF jsonb_array_length(result)=0 THEN RAISE EXCEPTION 'HISTORY_MISSING';END IF;
  IF jsonb_array_length(public.admin_distributor_history(sid,record_id,'activity',jsonb_build_object('id',result->-1->>'id','created_at',result->-1->>'created_at')))<>0 THEN RAISE EXCEPTION 'CURSOR_DUPLICATED_HISTORY';END IF;
 END IF;
END;$verify$;`;
// exec_sql runs inside a database function. A caught exception rolls back the entire
// inner PL/pgSQL subtransaction without issuing unsupported BEGIN/ROLLBACK commands.
await sql(`DO $preview$ BEGIN BEGIN ${installed[0].installed ? "" : migration.replace(/^([\s\S]*?)BEGIN;/, "$1").replace(/COMMIT;\s*$/, "")} ${checks}
 RAISE EXCEPTION 'DISTRIBUTOR_PREVIEW_PASSED';
 EXCEPTION WHEN SQLSTATE 'P0001' THEN IF SQLERRM<>'DISTRIBUTOR_PREVIEW_PASSED' THEN RAISE;END IF;
 END;END;$preview$;`);
const after = await sql(
  "SELECT (SELECT count(*) FROM public.admin_partners)::integer AS partners,(SELECT count(*) FROM public.admin_audit_logs)::integer AS audits,to_regprocedure('public.admin_distributor_list(uuid,jsonb,jsonb)') IS NOT NULL AS installed",
);
if (
  after[0].partners !== baseline[0].partners ||
  after[0].audits !== baseline[0].audits ||
  after[0].installed !== installed[0].installed
)
  throw new Error("Rollback verification failed");
console.log(
  "Geography, private grants, session denial, authenticated creation, stale edits, territory validation, suspension and history cursors passed. Available printed custody flows also validated. All probe changes rolled back.",
);
