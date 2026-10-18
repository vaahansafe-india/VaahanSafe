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
    throw Error(`${b.code}: ${b.message}`);
  return b;
}
const baseline = `SELECT (SELECT count(*) FROM public.replacement_requests) requests,(SELECT count(*) FROM public.qr_stickers) identities,(SELECT count(*) FROM public.service_entitlements) entitlements,(SELECT count(*) FROM public.orders) orders,(SELECT count(*) FROM public.qr_assignments WHERE ended_at IS NULL) current_assignments,(SELECT md5(string_agg(id||':'||status||':'||coalesce(lifecycle_state,''),',' ORDER BY id)) FROM public.qr_stickers) lifecycle_checksum,to_regprocedure('public.admin_replacement_command(uuid,text,text,integer,jsonb,text,uuid)') IS NOT NULL installed`;
const before = await sql(baseline);
const source = (
  await fs.readFile(
    "supabase/migrations/20261013173845_replacement_identity_operations.sql",
    "utf8",
  )
)
  .replace(/^BEGIN;$/m, "")
  .replace(/^COMMIT;$/m, "");
const checks = await fs.readFile(
  "tooling/tests/replacement-workspace.sql",
  "utf8",
);
const privacy = (
  await fs.readFile(
    "supabase/migrations/20261013182159_replacement_review_and_resolver_privacy.sql",
    "utf8",
  )
)
  .replace(/^BEGIN;$/m, "")
  .replace(/^COMMIT;$/m, "");
const privacyInstalled = (
  await sql(
    `SELECT to_regprocedure('public.replacement_retirement_privacy()') IS NOT NULL installed`,
  )
)[0].installed;
const notificationInstalled=(await sql(`SELECT to_regprocedure('public.replacement_request_notification()') IS NOT NULL installed`))[0].installed;
const notification=(await fs.readFile('supabase/migrations/20261013183140_replacement_request_notification.sql','utf8')).replace(/^BEGIN;$/m,'').replace(/^COMMIT;$/m,'');
await sql(
  `DO $preview$ BEGIN BEGIN ${before[0].installed ? "" : source} ${privacyInstalled ? "" : privacy} ${notificationInstalled?'':notification} ${checks} RAISE EXCEPTION 'REPLACEMENT_PREVIEW_PASSED';EXCEPTION WHEN SQLSTATE 'P0001' THEN IF SQLERRM<>'REPLACEMENT_PREVIEW_PASSED' THEN RAISE;END IF;END;END;$preview$;`,
);
if (JSON.stringify(await sql(baseline)) !== JSON.stringify(before))
  throw Error("Preview changed existing records");
console.log(
  "Replacement schema, private RPCs, ownership, paid-order gate, IST boundaries, immutable lineage, delivery and activation guards passed. All preview changes rolled back.",
);
const coverage = await sql(
  `SELECT EXISTS(SELECT 1 FROM public.admin_sessions s JOIN public.admin_users a ON a.id=s.admin_id WHERE s.revoked_at IS NULL AND s.expires_at>now() AND s.created_at>now()-interval '4 hours' AND s.email_verified_at IS NOT NULL AND s.step_up_at>now()-interval '10 minutes' AND a.status='ACTIVE' AND a.role IN ('SUPER_ADMIN','OPS_ADMIN')) AS fresh_admin_commands_tested`,
);
console.log(JSON.stringify(coverage[0]));
