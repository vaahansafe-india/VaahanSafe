import { readFileSync } from "node:fs";
import { adminService, executeAdminSql } from "./admin-service.mjs";
import { buildAnalyticsSql } from "../../apps/customer/features/analytics/sql.ts";
const f = {
  from: "2026-09-11",
  to: "2026-10-10",
  vehicle: "",
  qr: "",
  outcome: "",
  category: "",
  device: "",
  region: "",
  event: "",
  grouping: "day",
  compare: true,
};
const migration = readFileSync(
  "supabase/migrations/20261010104423_customer_usage_analytics.sql",
  "utf8",
);
const body = migration.replace(/^BEGIN;\s*/, "").replace(/COMMIT;\s*$/, "");
const mode = process.argv.includes("--apply")
  ? "apply"
  : process.argv.includes("--existing")
    ? "existing"
    : "verify";
const client = adminService();
async function run(sql) {
  const { data, error } = await client.rpc("exec_sql", { p_sql: sql });
  if (error || data?.error) {
    const err = error || data.error;
    throw Error(typeof err === "string" ? err : err.message);
  }
  return data;
}
function sqlLiteral(value) {
  return typeof value === "boolean"
    ? String(value)
    : typeof value === "number"
      ? String(value)
      : `'${String(value).replaceAll("'", "''")}'`;
}
function format(q) {
  let i = 0;
  return q.sql.replace(/'(?:''|[^'])*'|\?/g, (t) =>
    t === "?" ? sqlLiteral(q.params[i++]) : t,
  );
}
if (mode === "apply") {
  const version = "20261010104423";
  if (
    (
      await executeAdminSql(
        `SELECT version FROM supabase_migrations.schema_migrations WHERE version='${version}'`,
      )
    ).length
  )
    throw Error("Analytics migration already recorded");
  await executeAdminSql(
    `${body} INSERT INTO supabase_migrations.schema_migrations(version,name,statements) VALUES('${version}','customer_usage_analytics',ARRAY['${migration.replaceAll("'", "''")}']); NOTIFY pgrst,'reload schema';`,
  );
  console.log("Applied the versioned server-only analytics limiter.");
} else {
  const [auth] = await executeAdminSql(
    "SELECT s.id,s.user_id FROM sessions s WHERE public.vault_session_owner(s.id) IS NOT NULL ORDER BY EXISTS(SELECT 1 FROM customer_documents d WHERE d.owner_user_id=s.user_id AND d.status='READY' AND d.deleted_at IS NULL) DESC,EXISTS(SELECT 1 FROM qr_assignments a WHERE a.user_id=s.user_id::text AND a.ended_at IS NULL) DESC LIMIT 1",
  );
  if (!auth) throw Error("A verified real customer session is needed");
  for (const section of [
    "context",
    "vehicles",
    "scans",
    "documents",
    "security",
    "network",
    "activity",
  ]) {
    const q = buildAnalyticsSql(section, auth.user_id, auth.id, f, "day");
    const rows = await run(format(q));
    if (!rows?.[0]?.data) throw Error(`${section}: missing result`);
    const projected = JSON.stringify(rows[0].data);
    if (
      /"(?:ip_address|ip_hash|token_hash|user_agent|storage_key|thumbnail_key|secret_hash)"/.test(
        projected,
      )
    )
      throw Error("Unsafe projection");
    const foreign = await run(
      format(
        buildAnalyticsSql(
          section,
          "00000000-0000-4000-8000-000000000000",
          auth.id,
          f,
          "day",
        ),
      ),
    );
    if (foreign.length) throw Error("Foreign account analytics bypass");
    if (section === "scans") {
      const d = rows[0].data;
      if (d.series.reduce((a, b) => a + b.value, 0) !== d.total)
        throw Error("Scan totals differ from buckets");
      if (d.rhythm.reduce((a, b) => a + b.count, 0) !== d.total)
        throw Error("Timezone rhythm total differs");
      if (
        d.series.reduce((a, b) => a + (b.previous || 0), 0) !== d.previousTotal
      )
        throw Error("Previous-period buckets differ from previous total");
    }
    if (section === "documents") {
      const d = rows[0].data;
      const composition = d.composition.filter((r) =>
        ["PDF", "Images"].includes(r.label),
      );
      if (
        composition.reduce((s, r) => s + Number(r.bytes), 0) !==
          Number(d.bytes) ||
        d.byVehicle.reduce((s, r) => s + Number(r.bytes), 0) !== Number(d.bytes)
      )
        throw Error("Storage composition differs from finalized originals");
    }
    if (section === "activity" && rows[0].data.events.length) {
      const first = rows[0].data.events.slice(0, 25),
        last = first.at(-1);
      const next = await run(
        format(
          buildAnalyticsSql("activity", auth.user_id, auth.id, f, "day", {
            timestamp: last.timestamp,
            id: last.id,
          }),
        ),
      );
      if (next[0].data.events.some((e) => first.some((a) => a.id === e.id)))
        throw Error("Activity cursor repeated events");
    }
    // Return only aggregate timing, never the plan's owner literals or row data.
    const { error: planError } = await client.rpc("exec_sql", {
      p_sql: `DO $plan_verify$ DECLARE plan json; BEGIN EXECUTE 'EXPLAIN (ANALYZE, FORMAT JSON) ${format(q).replaceAll("'", "''")}' INTO plan; IF plan IS NULL THEN RAISE EXCEPTION 'Missing query plan'; END IF; RAISE EXCEPTION 'ANALYTICS_PLAN_MS:%',plan->0->>'Execution Time'; END $plan_verify$;`,
    });
    const timing = /^ANALYTICS_PLAN_MS:([0-9.]+)$/.exec(
      planError?.message || "",
    );
    if (!timing) throw Error("Query execution plan unavailable");
    console.log(
      `${section}: real aggregation, private projection, account isolation and EXPLAIN ANALYZE verified (${timing[1]} ms)`,
    );
  }
  const before = mode === "existing" ? "" : body;
  const scansQuery = format(
    buildAnalyticsSql("scans", auth.user_id, auth.id, f, "day"),
  ).replaceAll("'", "''");
  await run(`DO $scan_verify$ DECLARE initial jsonb; after_event jsonb; qr text; e1 text:='qse_'||replace(gen_random_uuid()::text,'-',''); e2 text:='qse_'||replace(gen_random_uuid()::text,'-',''); query text:='${scansQuery}'; BEGIN BEGIN
    SELECT a.qr_id INTO qr FROM qr_assignments a JOIN vehicles v ON v.id=a.vehicle_id WHERE a.user_id='${auth.user_id}' AND v.user_id='${auth.user_id}' AND a.ended_at IS NULL AND v.deleted_at IS NULL AND v.status<>'DELETED' LIMIT 1;
    IF qr IS NOT NULL THEN
      EXECUTE query INTO initial;
      -- Same event replay cannot produce a second scan. Created-at controls
      -- late-event bucketing, even when the record is inserted much later.
      INSERT INTO qr_scan_events(id,qr_id,scan_type,result,created_at) VALUES(e1,qr,'PUBLIC_RESOLVE','RESOLVED_ACTIVE','2026-09-10T18:30:00Z');
      INSERT INTO qr_scan_events(id,qr_id,scan_type,result,created_at) VALUES(e1,qr,'PUBLIC_RESOLVE','RESOLVED_ACTIVE','2026-09-10T18:30:00Z') ON CONFLICT(id) DO NOTHING;
      INSERT INTO qr_scan_events(id,qr_id,scan_type,result,created_at) VALUES(e2,qr,'PUBLIC_RESOLVE','RESOLVED_ACTIVE','2026-09-10T18:29:59Z');
      EXECUTE query INTO after_event;
      IF (after_event->>'total')::integer<>(initial->>'total')::integer+1 OR (after_event->>'previousTotal')::integer<>(initial->>'previousTotal')::integer+1 THEN RAISE EXCEPTION 'Replay or India midnight scan boundary failed'; END IF;
      IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(after_event->'rhythm') r WHERE (r->>'day')::integer=4 AND (r->>'hour')::integer=0) THEN RAISE EXCEPTION 'India midnight heatmap bucket missing'; END IF;
    END IF;
    RAISE EXCEPTION 'SCANS_VERIFIED_ROLLBACK'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'SCANS_VERIFIED_ROLLBACK' THEN RAISE; END IF; END;
  END $scan_verify$;`);
  console.log(
    "Persisted scan ID replay, late events and India midnight boundaries checked in rollback.",
  );
  const documentQuery = format(
    buildAnalyticsSql("documents", auth.user_id, auth.id, f, "day"),
  ).replaceAll("'", "''");
  // Metadata state mutations below never commit. Original objects are not read,
  // modified or uploaded by verification.
  await run(`DO $storage_verify$ DECLARE initial jsonb; after_state jsonb; pending jsonb; query text:='${documentQuery}'; doc uuid; original_count bigint; BEGIN BEGIN
    EXECUTE query INTO initial;
    SELECT count(*) INTO original_count FROM customer_documents WHERE owner_user_id='${auth.user_id}' AND deleted_at IS NULL;
    UPDATE customer_vault_settings SET pin_verifier=NULL WHERE owner_user_id='${auth.user_id}';
    pending:=public.vault_command('${auth.id}','upload',jsonb_build_object('category','OTHER','title','Rollback-only analytics check','mode','ACCOUNT','size',20,'mime','image/png','filename','verification.png','tokenHash',encode(sha256(gen_random_uuid()::text::bytea),'hex')));
    IF pending->>'error' IS NULL THEN
      doc:=(pending->>'id')::uuid;
      EXECUTE query INTO after_state;
      IF after_state->>'bytes' IS DISTINCT FROM initial->>'bytes' OR after_state->>'total' IS DISTINCT FROM initial->>'total' THEN RAISE EXCEPTION 'Pending upload counted as finalized'; END IF;
      UPDATE customer_document_versions SET status='FAILED' WHERE document_id=doc;
      EXECUTE query INTO after_state;
      IF after_state->>'bytes' IS DISTINCT FROM initial->>'bytes' THEN RAISE EXCEPTION 'Failed upload counted as finalized'; END IF;
    ELSIF pending->>'error'<>'QUOTA' THEN RAISE EXCEPTION 'Unable to check upload-state exclusion'; END IF;
    UPDATE customer_documents SET deleted_at=now() WHERE owner_user_id='${auth.user_id}' AND deleted_at IS NULL;
    EXECUTE query INTO after_state;
    IF (after_state->>'total')::integer<>0 OR (after_state->>'bytes')::bigint<>0 THEN RAISE EXCEPTION 'Deleted documents counted'; END IF;
    RAISE EXCEPTION 'STORAGE_VERIFIED_ROLLBACK'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'STORAGE_VERIFIED_ROLLBACK' THEN RAISE; END IF; END;
  END $storage_verify$;`);
  console.log(
    "Pending/failed/deleted storage exclusion and activity cursors verified; state changes rolled back.",
  );
  await run(`DO $analytics_verify$ BEGIN BEGIN ${before}
  IF public.customer_analytics_limit(gen_random_uuid()) THEN RAISE EXCEPTION 'Invalid limiter session accepted'; END IF;
  DELETE FROM public.customer_analytics_limits WHERE session_id='${auth.id}';
  FOR i IN 1..90 LOOP IF NOT public.customer_analytics_limit('${auth.id}') THEN RAISE EXCEPTION 'Premature rate limit'; END IF; END LOOP;
  IF public.customer_analytics_limit('${auth.id}') THEN RAISE EXCEPTION 'Rate limit bypass'; END IF;
  IF has_table_privilege('anon','public.customer_analytics_limits','SELECT') OR has_function_privilege('authenticated','public.customer_analytics_limit(uuid)','EXECUTE') THEN RAISE EXCEPTION 'Client limiter grants'; END IF;
  RAISE EXCEPTION 'ANALYTICS_VERIFIED_ROLLBACK';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'ANALYTICS_VERIFIED_ROLLBACK' THEN RAISE; END IF; END;
 END $analytics_verify$;`);
  console.log(
    "Rate limit and server-only permissions verified with changes rolled back.",
  );
}
