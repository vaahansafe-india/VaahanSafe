import fs from "node:fs/promises";
import { riskSql } from "./inspect-risk-schema.mjs";
const path =
  "supabase/migrations/20261013195009_risk_intelligence_operations.sql";
const migration = (await fs.readFile(path, "utf8"))
  .replace(/^BEGIN;$/m, "")
  .replace(/^COMMIT;$/m, "");
const checks = await fs.readFile("tooling/tests/risk-workspace.sql", "utf8");
const baseline = `SELECT (SELECT count(*) FROM public.qr_activation_attempts) activations,(SELECT count(*) FROM public.qr_scan_events) scans,(SELECT count(*) FROM public.orders) orders,(SELECT count(*) FROM public.service_entitlements) entitlements,(SELECT count(*) FROM public.admin_audit_logs) audits,to_regclass('public.risk_signals')::text installed`;
const before = await riskSql(baseline);
if (before[0].installed)
  throw Error(
    "Risk migration is already installed; this preview expects an unapplied migration.",
  );
await riskSql(
  `DO $preview$ BEGIN BEGIN ${migration} ${checks} RAISE EXCEPTION 'RISK_PREVIEW_PASSED'; EXCEPTION WHEN SQLSTATE 'P0001' THEN IF SQLERRM<>'RISK_PREVIEW_PASSED' THEN RAISE; END IF; END; END; $preview$;`,
);
const after = await riskSql(baseline);
if (JSON.stringify(after) !== JSON.stringify(before))
  throw Error("Production baseline changed during preview.");
console.log(
  "Risk migration and functional checks passed. All schema, event, investigation, and audit changes rolled back; production baseline unchanged.",
);
