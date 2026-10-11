import fs from "node:fs/promises";
import nextEnv from "@next/env";
nextEnv.loadEnvConfig("apps/admin", true);
const base = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  key = process.env.SUPABASE_SERVICE_ROLE_KEY;
async function sql(p_sql) {
  const response = await fetch(`${base}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_sql }),
    signal: AbortSignal.timeout(60000),
  });
  const result = await response.json();
  if (!response.ok)
    throw Error(
      `Stock release verification: ${result.code}: ${result.message}`,
    );
  return result;
}
const migration = (
  await fs.readFile(
    "supabase/migrations/20261011185525_verified_print_stock_release.sql",
    "utf8",
  )
)
  .replace(/^BEGIN;$/m, "")
  .replace(/^COMMIT;$/m, "");
const baseline = `SELECT (SELECT count(*) FROM public.qr_stickers) identities,(SELECT count(*) FROM public.admin_partners) partners,(SELECT count(*) FROM public.admin_audit_logs) audits,(SELECT count(*) FROM public.qr_status_history) history,(SELECT count(*) FROM public.qr_assignments) assignments,(SELECT count(*) FROM public.service_entitlements) entitlements,(SELECT count(*) FROM public.qr_print_jobs) print_jobs,(SELECT count(*) FROM public.admin_stock_transfers) transfers,to_regprocedure('public.admin_release_verified_print_stock(uuid,uuid,text,uuid)') IS NOT NULL installed`;
const before = await sql(baseline);
const checks = await fs.readFile(
  "tooling/tests/print-stock-release.sql",
  "utf8",
);
await sql(
  `DO $preview$ BEGIN BEGIN ${before[0].installed ? "" : migration} ${checks} RAISE EXCEPTION 'PRINT_RELEASE_PREVIEW_PASSED'; EXCEPTION WHEN SQLSTATE 'P0001' THEN IF SQLERRM<>'PRINT_RELEASE_PREVIEW_PASSED' THEN RAISE; END IF; END; END; $preview$;`,
);
if (JSON.stringify(await sql(baseline)) !== JSON.stringify(before))
  throw Error("Rollback did not preserve production records");
console.log(
  "Verified stock release: eligibility, custody, authorization, idempotency and service gates passed; all fixtures rolled back.",
);
