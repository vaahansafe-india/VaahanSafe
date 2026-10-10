import { readFileSync } from "node:fs";
import { adminService, executeAdminSql } from "./admin-service.mjs";
import { buildAnalyticsSql } from "../../apps/customer/features/analytics/sql.ts";
const version = "20261010125629";
const migration = readFileSync(`supabase/migrations/${version}_customer_storage_analytics_snapshots.sql`, "utf8");
const body = migration.replace(/^BEGIN;\s*/, "").replace(/COMMIT;\s*$/, "");
const end = new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);
const f = { from: new Date(Date.parse(end) - 29 * 86400000).toISOString().slice(0, 10), to: end, vehicle: "", qr: "", outcome: "", category: "", event: "", device: "", region: "", file: "", validity: "", protection: "", documentActivity: "", compare: false, grouping: "day" };
const literal = value => typeof value === "boolean" ? String(value) : `'${String(value).replaceAll("'", "''")}'`;
function format(query) { let index = 0; return query.sql.replace(/'(?:''|[^'])*'|\?/g, token => token === "?" ? literal(query.params[index++]) : token); }
const client = adminService();
const [auth] = await executeAdminSql("SELECT s.id,s.user_id FROM sessions s WHERE public.vault_session_owner(s.id) IS NOT NULL ORDER BY EXISTS(SELECT 1 FROM customer_documents d WHERE d.owner_user_id=s.user_id AND d.status='READY' AND d.deleted_at IS NULL) DESC LIMIT 1");
if (!auth) throw Error("A verified real customer session is needed");
const mode = process.argv.includes("--apply") ? "apply" : process.argv.includes("--existing") ? "existing" : "schema";
const checks = ["documents", "storage-history", "storage-details", "storage-access"].map(section => {
  const query = buildAnalyticsSql(section, auth.user_id, auth.id, f, "day");
  return `SELECT data INTO result FROM (${format(query)}) q;
    IF result IS NULL OR result::text ~ '"(storage_key|thumbnail_key|password_verifier|pin_verifier|token_hash|share_token)"' THEN RAISE EXCEPTION 'Unsafe storage projection'; END IF;
    ${section === "documents" ? `summary:=result;
      IF (SELECT sum((r->>'count')::integer) FROM jsonb_array_elements(result->'statuses') r) IS DISTINCT FROM (result->>'total')::integer AND (result->>'total')::integer>0 THEN RAISE EXCEPTION 'Document statuses do not reconcile'; END IF;
      IF coalesce((SELECT sum((r->>'bytes')::bigint) FROM jsonb_array_elements(result->'allocation') r),0)<>(result->>'bytes')::bigint THEN RAISE EXCEPTION 'Constellation totals do not reconcile'; END IF;
      IF (result->'versions'->>'currentBytes')::bigint+(result->'versions'->>'previousBytes')::bigint<>(result->>'bytes')::bigint THEN RAISE EXCEPTION 'Version bytes do not reconcile'; END IF;` : ""}
    ${section === "storage-details" ? `IF coalesce((SELECT sum((r->>'bytes')::bigint) FROM jsonb_array_elements(result->'atlas') r),0)<>(summary->>'bytes')::bigint OR coalesce((SELECT sum((r->>'bytes')::bigint) FROM jsonb_array_elements(result->'distribution') r),0)<>(summary->>'bytes')::bigint THEN RAISE EXCEPTION 'Atlas or histogram totals do not reconcile'; END IF;` : ""}
    ${section === "storage-history" ? `IF result->>'startedAt' IS NULL THEN RAISE EXCEPTION 'Storage tracking baseline missing'; END IF;
      IF coalesce((SELECT sum(value::bigint) FROM jsonb_each_text(result->'growth'->-1->'values')),0)<>(summary->>'bytes')::bigint THEN RAISE EXCEPTION 'Measured storage differs from current originals'; END IF;
      IF EXISTS(SELECT 1 FROM jsonb_array_elements(result->'growth') r WHERE (r->>'timestamp')::timestamptz+interval '1 day'<(result->>'startedAt')::timestamptz AND r->'values'<>'null'::jsonb) THEN RAISE EXCEPTION 'Invented pre-tracking history'; END IF;` : ""}
    SELECT data INTO result FROM (${format(buildAnalyticsSql(section, "00000000-0000-4000-8000-000000000000", auth.id, f, "day"))}) q;
    IF result IS NOT NULL THEN RAISE EXCEPTION 'Cross-account storage leak'; END IF;`;
}).join("\n");
const assertions = `
 IF EXISTS(SELECT 1 FROM (VALUES('customer_storage_snapshots'),('customer_storage_snapshot_items'),('customer_storage_originals')) t(name) WHERE has_table_privilege('anon','public.'||name,'SELECT') OR has_table_privilege('authenticated','public.'||name,'SELECT')) THEN RAISE EXCEPTION 'Browser storage grants'; END IF;
 IF has_function_privilege('anon','public.record_customer_storage_snapshot(uuid)','EXECUTE') OR has_function_privilege('authenticated','public.record_customer_storage_snapshot(uuid)','EXECUTE') THEN RAISE EXCEPTION 'Browser snapshot function grant'; END IF;
 ${checks}`;
if (mode === "apply") {
  if ((await executeAdminSql(`SELECT version FROM supabase_migrations.schema_migrations WHERE version='${version}'`)).length) throw Error("Storage migration already recorded");
  await executeAdminSql(`${body} INSERT INTO supabase_migrations.schema_migrations(version,name,statements) VALUES('${version}','customer_storage_analytics_snapshots',ARRAY[${literal(migration)}]); NOTIFY pgrst,'reload schema';`);
  console.log("Applied versioned storage snapshots with real current baselines and server-only permissions.");
} else {
  const { error, data } = await client.rpc("exec_sql", { p_sql: `DO $storage_verification$ DECLARE result jsonb; summary jsonb; BEGIN ${mode === "schema" ? body : ""} ${assertions} RAISE EXCEPTION 'STORAGE_VERIFIED_ROLLBACK'; END $storage_verification$;` });
  const message = error?.message || data?.error?.message || data?.error || "";
  if (message !== "STORAGE_VERIFIED_ROLLBACK") throw Error(message || "Storage verification did not finish");
  console.log(`${mode}: storage accounting, bounded atlas/histogram, measured history, account isolation and browser permissions verified; verification rolled back.`);
}
