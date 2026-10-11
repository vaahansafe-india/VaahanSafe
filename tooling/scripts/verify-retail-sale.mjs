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
  const data = await response.json();
  if (!response.ok)
    throw Error(`Retail sale verification: ${data.code}: ${data.message}`);
  return data;
}
const migration = (
  await fs.readFile(
    "supabase/migrations/20261011181950_retail_sale_recording.sql",
    "utf8",
  )
)
  .replace(/^BEGIN;$/m, "")
  .replace(/^COMMIT;$/m, "");
const baselineQuery = `SELECT (SELECT count(*) FROM public.qr_stickers) identities,(SELECT count(*) FROM public.admin_partners) partners,(SELECT count(*) FROM public.admin_audit_logs) audits,(SELECT count(*) FROM public.qr_status_history) history,(SELECT count(*) FROM public.qr_assignments) assignments,(SELECT count(*) FROM public.service_entitlements) entitlements,(SELECT count(*) FROM public.admin_sessions WHERE step_up_at>now()-interval '10 minutes') verified_sessions,to_regprocedure('public.admin_record_retail_sale(uuid,text,text[],text,text,uuid)') IS NOT NULL installed`;
const before = await sql(baselineQuery);
const checks = await fs.readFile("tooling/tests/retail-sale.sql", "utf8");
await sql(
  `DO $preview$ BEGIN BEGIN ${before[0].installed ? "" : migration} ${checks} RAISE EXCEPTION 'RETAIL_SALE_PREVIEW_PASSED'; EXCEPTION WHEN SQLSTATE 'P0001' THEN IF SQLERRM<>'RETAIL_SALE_PREVIEW_PASSED' THEN RAISE; END IF; END; END; $preview$;`,
);
if (JSON.stringify(await sql(baselineQuery)) !== JSON.stringify(before))
  throw Error("Rollback did not preserve existing records");
console.log(
  "Retail sale security, atomicity, eligibility and idempotency checks passed; all test changes rolled back.",
);
