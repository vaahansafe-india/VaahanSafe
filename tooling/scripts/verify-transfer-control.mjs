import fs from "node:fs/promises";
import nextEnv from "@next/env";
nextEnv.loadEnvConfig("apps/admin", true);
const base = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  key = process.env.SUPABASE_SERVICE_ROLE_KEY;
export async function transferSql(query) {
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
  if (!r.ok) throw Error(`Transfer verification: ${b.code}: ${b.message}`);
  return b;
}
const path = "supabase/migrations/20261011172757_transfer_control_center.sql";
const source = (await fs.readFile(path, "utf8"))
  .replace(/^BEGIN;$/m, "")
  .replace(/^COMMIT;$/m, "");
const baselineQuery=`SELECT (SELECT count(*) FROM public.admin_stock_transfers) transfers,(SELECT count(*) FROM public.admin_stock_transfer_items) items,(SELECT count(*) FROM public.admin_audit_logs) audits,(SELECT count(*) FROM public.admin_partners) partners,(SELECT count(*) FROM public.qr_stickers) identities,to_regprocedure('public.admin_transfer_command(uuid,text,integer,text,jsonb,text,uuid)') IS NOT NULL installed`;
const baseline=await transferSql(baselineQuery);
const checks = await fs.readFile("tooling/tests/transfer-control.sql", "utf8");
await transferSql(
  `DO $preview$ BEGIN BEGIN ${baseline[0].installed?'':source} ${checks} RAISE EXCEPTION 'TRANSFER_PREVIEW_PASSED';EXCEPTION WHEN SQLSTATE 'P0001' THEN IF SQLERRM<>'TRANSFER_PREVIEW_PASSED' THEN RAISE;END IF;END;END;$preview$;`,
);
const after = await transferSql(baselineQuery);
if (JSON.stringify(after) !== JSON.stringify(baseline))
  throw Error("Rollback did not preserve existing transfer counts");
console.log(
  "Transfer migration and transactional security/custody checks passed; all probe changes rolled back.",
);
