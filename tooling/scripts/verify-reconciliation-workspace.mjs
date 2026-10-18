import fs from "node:fs/promises";
import nextEnv from "@next/env";
nextEnv.loadEnvConfig("apps/admin", true);
const base = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  key = process.env.SUPABASE_SERVICE_ROLE_KEY;
async function sql(p_sql) {
  const r = await fetch(`${base}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_sql }),
    signal: AbortSignal.timeout(60000),
  });
  const b = await r.json();
  if (!r.ok || (!Array.isArray(b) && b?.error))
    throw Error(`Reconciliation verification failed: ${b.code}: ${b.message}`);
  return b;
}
const baseline = `SELECT (SELECT count(*) FROM public.admin_stock_reconciliations) reconciliations,(SELECT count(*) FROM public.qr_stickers) identities,(SELECT count(*) FROM public.admin_audit_logs) audits,(SELECT count(*) FROM public.qr_status_history) history,(SELECT count(*) FROM public.service_entitlements) entitlements,to_regprocedure('public.admin_reconciliation_command(uuid,text,text,integer,jsonb,text,uuid)') IS NOT NULL installed,EXISTS(SELECT 1 FROM pg_proc WHERE proname='admin_distributor_review_reconciliation' AND prosrc LIKE '%RECONCILIATION_CONTROL_REQUIRED%') compatibility_installed`;
const before = await sql(baseline),
  source = (
    await fs.readFile(
      "supabase/migrations/20261013164245_stock_reconciliation_workspace.sql",
      "utf8",
    )
  )
    .replace(/^BEGIN;$/m, "")
    .replace(/^COMMIT;$/m, "");
const checks = await fs.readFile(
  "tooling/tests/reconciliation-workspace.sql",
  "utf8",
);
const compatibility = (
  await fs.readFile(
    "supabase/migrations/20261013170635_reconciliation_workflow_compatibility.sql",
    "utf8",
  )
)
  .replace(/^BEGIN;$/m, "")
  .replace(/^COMMIT;$/m, "");
const transit = (await fs.readFile("supabase/migrations/20261013171716_reconciliation_transit_scope.sql", "utf8")).replace(/^BEGIN;$/m, "").replace(/^COMMIT;$/m, "");
await sql(
  `DO $preview$ BEGIN BEGIN ${before[0].installed ? "" : source} ${before[0].compatibility_installed ? "" : compatibility} ${transit} ${checks} RAISE EXCEPTION 'RECONCILIATION_PREVIEW_PASSED';EXCEPTION WHEN SQLSTATE 'P0001' THEN IF SQLERRM<>'RECONCILIATION_PREVIEW_PASSED' THEN RAISE;END IF;END;END;$preview$;`,
);
if (JSON.stringify(await sql(baseline)) !== JSON.stringify(before))
  throw Error("Verification changed existing records");
console.log(
  "Reconciliation migration, identity projection, cursor ordering, temporal boundaries and private RPC checks passed. All preview changes rolled back.",
);
