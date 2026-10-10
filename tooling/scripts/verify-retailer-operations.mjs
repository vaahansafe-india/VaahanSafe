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
  const b = await r.json();
  if (!r.ok)
    throw new Error(`Retailer validation failed (${b.code}): ${b.message}`);
  return b;
}
const source = await fs.readFile(
  "supabase/migrations/20261010074500_retailer_operations.sql",
  "utf8",
);
const baseline = (
  await sql(
    `SELECT (SELECT count(*) FROM public.admin_partners) AS partners,(SELECT count(*) FROM public.admin_audit_logs) AS audits,to_regprocedure('public.admin_retailer_list(uuid,jsonb,jsonb)') IS NOT NULL AS installed`,
  )
)[0];
const checks = `DO $checks$
DECLARE sid uuid;actor text;district text;other_district text;d text;r text;r2 text;v jsonb;stamp timestamptz;denied boolean;data jsonb;batch text;t text;rec text;begin_stock integer;after_stock integer;qr_count integer;
BEGIN
 IF EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND (proname LIKE 'admin_retailer_%' OR proname IN ('admin_request_retailer_export','retailer_filter_clause')) AND (prosecdef OR has_function_privilege('anon',p.oid,'EXECUTE') OR has_function_privilege('authenticated',p.oid,'EXECUTE'))) THEN RAISE EXCEPTION 'PUBLIC_RPC_ACCESS';END IF;
 IF has_table_privilege('anon','public.admin_retailer_projection','SELECT') OR has_table_privilege('authenticated','public.admin_retailer_projection','SELECT') THEN RAISE EXCEPTION 'PUBLIC_PROJECTION_ACCESS';END IF;
 denied:=false;BEGIN PERFORM public.admin_retailer_summary(NULL);EXCEPTION WHEN OTHERS THEN denied:=SQLERRM='ADMIN_REQUIRED';END;IF NOT denied THEN RAISE EXCEPTION 'SESSION_BYPASS';END IF;
 SELECT s.id,a.id INTO sid,actor FROM public.admin_sessions s JOIN public.admin_users a ON a.id=s.admin_id WHERE s.revoked_at IS NULL AND s.expires_at>now() AND s.created_at>now()-interval '4 hours' AND s.email_verified_at IS NOT NULL AND a.status='ACTIVE' AND a.role IN ('SUPER_ADMIN','OPS_ADMIN') ORDER BY s.created_at DESC LIMIT 1;
 IF sid IS NULL THEN RAISE EXCEPTION 'AUTHENTICATED_SESSION_REQUIRED';END IF;
 SELECT code INTO district FROM public.admin_geo_districts WHERE state_code='AP' AND name='Kakinada';SELECT code INTO other_district FROM public.admin_geo_districts WHERE state_code='KA' LIMIT 1;
 d:=public.admin_distributor_save(sid,NULL,NULL,jsonb_build_object('name','Transactional network validation','state_code','AP','district_code',district,'city','Kakinada','postal_code','533001','address_line_1','Rollback validation only','contact_name','Validation contact','contact_phone','+919876543210','territories',jsonb_build_array(jsonb_build_object('state_code','AP','district_code',district))),'Rollback validation only',gen_random_uuid());
 v:=jsonb_build_object('name','Transactional retailer validation','parent_distributor_id',d,'state_code','AP','district_code',district,'city','Kakinada','address_line_1','Rollback validation only','contact_name','Validation contact','contact_phone','+919876543210','stock_threshold',20,'territory_override',false);
 r:=public.admin_retailer_save(sid,NULL,NULL,v,'Rollback validation only',gen_random_uuid());SELECT updated_at INTO stamp FROM public.admin_partners WHERE id=r;
 data:=public.admin_retailer_detail(sid,r);IF data->'retailer'->>'available'<>'0' OR data->>'territory_match'<>'true' OR data->'parent'->>'id'<>d THEN RAISE EXCEPTION 'PROJECTION_WRONG';END IF;
 IF public.admin_retailer_list(sid,jsonb_build_object('distributor',d),NULL)->0->>'id'<>r THEN RAISE EXCEPTION 'PARENT_FILTER_WRONG';END IF;
 IF jsonb_array_length(public.admin_retailer_list(sid,jsonb_build_object('inventory','low','distributor',d),NULL))<>0 THEN RAISE EXCEPTION 'EMPTY_STOCK_CLASSIFIED_LOW';END IF;
 denied:=false;BEGIN PERFORM public.admin_retailer_save(sid,r,stamp-interval '1 second',v,'Stale validation only',gen_random_uuid());EXCEPTION WHEN OTHERS THEN denied:=SQLERRM='RETAILER_CHANGED';END;IF NOT denied THEN RAISE EXCEPTION 'STALE_SAVE_ACCEPTED';END IF;
 denied:=false;BEGIN PERFORM public.admin_retailer_save(sid,r,stamp,jsonb_set(v,'{district_code}',to_jsonb(other_district)),'Geography validation only',gen_random_uuid());EXCEPTION WHEN OTHERS THEN denied:=SQLERRM='INVALID_RETAILER';END;IF NOT denied THEN RAISE EXCEPTION 'INVALID_GEOGRAPHY_ACCEPTED';END IF;
 v:=jsonb_set(jsonb_set(v,'{state_code}','"KA"'),'{district_code}',to_jsonb(other_district));
 denied:=false;BEGIN PERFORM public.admin_retailer_save(sid,r,stamp,v,'Coverage validation only',gen_random_uuid());EXCEPTION WHEN OTHERS THEN denied:=SQLERRM='TERRITORY_REVIEW_REQUIRED';END;IF NOT denied THEN RAISE EXCEPTION 'TERRITORY_BYPASS';END IF;
 v:=jsonb_set(v,'{territory_override}','true');PERFORM public.admin_retailer_save(sid,r,stamp,v,'Reasoned territory override validation',gen_random_uuid());SELECT updated_at INTO stamp FROM public.admin_partners WHERE id=r;
 denied:=false;BEGIN PERFORM public.admin_retailer_request_transfer(sid,r,d,'not-a-batch',1,'Verification validation only',gen_random_uuid());EXCEPTION WHEN OTHERS THEN denied:=SQLERRM='VERIFICATION_REQUIRED';END;IF NOT denied THEN RAISE EXCEPTION 'UNVERIFIED_TRANSFER_ACCEPTED';END IF;
 PERFORM public.admin_retailer_status(sid,r,stamp,NULL,'VERIFIED','Verification validation only',gen_random_uuid());SELECT updated_at INTO stamp FROM public.admin_partners WHERE id=r;
 PERFORM public.admin_retailer_status(sid,r,stamp,'SUSPENDED',NULL,'Suspension validation only',gen_random_uuid());
 denied:=false;BEGIN PERFORM public.admin_retailer_request_transfer(sid,r,d,'not-a-batch',1,'Suspension validation only',gen_random_uuid());EXCEPTION WHEN OTHERS THEN denied:=SQLERRM='SUSPENDED_PARTNER';END;IF NOT denied THEN RAISE EXCEPTION 'SUSPENDED_TRANSFER_ACCEPTED';END IF;
 SELECT updated_at INTO stamp FROM public.admin_partners WHERE id=r;PERFORM public.admin_retailer_status(sid,r,stamp,'ACTIVE',NULL,'Reactivation validation only',gen_random_uuid());
 denied:=false;BEGIN PERFORM public.admin_retailer_request_transfer(sid,r,d,'not-a-batch',1,'Stock validation only',gen_random_uuid());EXCEPTION WHEN OTHERS THEN denied:=SQLERRM='INSUFFICIENT_STOCK';END;IF NOT denied THEN RAISE EXCEPTION 'NONEXISTENT_STOCK_ACCEPTED';END IF;
 rec:=public.admin_retailer_reconcile(sid,r,0,2,'Physical count validation only',gen_random_uuid());data:=public.admin_retailer_detail(sid,r);IF data->'retailer'->>'unresolved_variance'<>'2' OR data->'retailer'->>'on_hand'<>'0' THEN RAISE EXCEPTION 'RECONCILIATION_CHANGED_STOCK';END IF;
 SELECT updated_at INTO stamp FROM public.admin_stock_reconciliations WHERE id=rec;denied:=false;BEGIN PERFORM public.admin_retailer_review_reconciliation(sid,r,rec,stamp,'CLOSED','Review validation only',gen_random_uuid());EXCEPTION WHEN OTHERS THEN denied:=SQLERRM='STOCK_CHANGED';END;IF NOT denied THEN RAISE EXCEPTION 'CLOSE_WITHOUT_REVIEW';END IF;
 PERFORM public.admin_retailer_review_reconciliation(sid,r,rec,stamp,'REVIEWED','Review validation only',gen_random_uuid());SELECT updated_at INTO stamp FROM public.admin_stock_reconciliations WHERE id=rec;PERFORM public.admin_retailer_review_reconciliation(sid,r,rec,stamp,'CLOSED','Close validation only',gen_random_uuid());
 data:=public.admin_retailer_history(sid,r,'activity',NULL);IF jsonb_array_length(data)=0 OR jsonb_array_length(public.admin_retailer_history(sid,r,'activity',jsonb_build_object('id',data->-1->>'id','created_at',data->-1->>'created_at')))<>0 THEN RAISE EXCEPTION 'HISTORY_CURSOR_WRONG';END IF;
 -- Exercise physical transfer only against already printed, eligible real stock.
 SELECT o->>'id' INTO batch FROM jsonb_array_elements(public.admin_distributor_transfer_options(sid))o LIMIT 1;
 IF batch IS NOT NULL THEN
  t:=public.admin_distributor_request_transfer(sid,d,batch,1,'Custody validation only',gen_random_uuid());PERFORM public.admin_distributor_transfer_transition(sid,d,t,'REQUESTED','IN_TRANSIT','Custody validation only',gen_random_uuid());PERFORM public.admin_distributor_transfer_transition(sid,d,t,'IN_TRANSIT','RECEIVED','Custody validation only',gen_random_uuid());
  t:=public.admin_retailer_request_transfer(sid,r,d,batch,1,'Retail custody validation only',gen_random_uuid());PERFORM public.admin_retailer_transfer_transition(sid,r,t,'REQUESTED','IN_TRANSIT','Retail dispatch validation only',gen_random_uuid());
  IF (SELECT on_hand FROM public.admin_distributor_projection WHERE id=d)<>0 OR (SELECT in_transit FROM public.admin_retailer_projection WHERE id=r)<>1 THEN RAISE EXCEPTION 'TRANSIT_PROJECTION_WRONG';END IF;
  PERFORM public.admin_retailer_transfer_transition(sid,r,t,'IN_TRANSIT','RECEIVED','Retail receipt validation only',gen_random_uuid());
  IF (SELECT available FROM public.admin_retailer_projection WHERE id=r)<>1 THEN RAISE EXCEPTION 'RETAIL_CUSTODY_WRONG';END IF;
  denied:=false;BEGIN PERFORM public.admin_retailer_transfer_transition(sid,r,t,'IN_TRANSIT','RECEIVED','Repeat receipt validation only',gen_random_uuid());EXCEPTION WHEN OTHERS THEN denied:=SQLERRM='TRANSFER_CHANGED';END;IF NOT denied THEN RAISE EXCEPTION 'DUPLICATE_RECEIPT';END IF;
 END IF;
END;$checks$;`;
await sql(
  `DO $preview$ BEGIN BEGIN ${baseline.installed ? "" : source.replace(/^([\s\S]*?)BEGIN;/, "$1").replace(/COMMIT;\s*$/, "")} ${checks} RAISE EXCEPTION 'RETAILER_PREVIEW_PASSED';EXCEPTION WHEN SQLSTATE 'P0001' THEN IF SQLERRM<>'RETAILER_PREVIEW_PASSED' THEN RAISE;END IF;END;END;$preview$;`,
);
const after = (
  await sql(
    `SELECT (SELECT count(*) FROM public.admin_partners) AS partners,(SELECT count(*) FROM public.admin_audit_logs) AS audits,to_regprocedure('public.admin_retailer_list(uuid,jsonb,jsonb)') IS NOT NULL AS installed`,
  )
)[0];
if (JSON.stringify(after) !== JSON.stringify(baseline))
  throw new Error("Rollback verification failed");
console.log(
  "Private RPCs, session denial, creation, parent/territory checks, invalid geography, stale updates, verification, suspension, insufficient stock, reconciliation and history cursors passed. Eligible printed transfer checks are conditional on real stock. All probe changes rolled back.",
);
