import { readFileSync } from "node:fs";
import { adminService } from "./admin-service.mjs";
async function executeAdminSql(query) {
  const { data, error } = await adminService().rpc("exec_sql", {
    p_sql: query,
  });
  if (error || data?.error) {
    console.error("Schema diagnostic", {
      code: error?.code,
      message: error?.message || data?.error,
    });
    throw new Error("Scan-report schema operation failed");
  }
  return data;
}
const migrationFile =
  process.argv.find((arg) => arg.startsWith("--file="))?.slice(7) ||
  "20261010080149_qr_scan_reports.sql";
const match = /^(\d{14})_(qr_scan_report[s_a-z]*)\.sql$/.exec(migrationFile);
if (!match) throw new Error("Use a scan-report migration filename only.");
const [, version, name] = match;
const source = readFileSync(
  `supabase/migrations/${version}_${name}.sql`,
  "utf8",
);
const body = source.replace(/\bBEGIN;\s*\n/, "").replace(/COMMIT;\s*$/, "");
if (process.argv.includes("--compile")) {
  const result = await executeAdminSql(
    `DO $verify$ BEGIN BEGIN\n${body}\nRAISE EXCEPTION 'VS_SCAN_REPORT_COMPILED';\nEXCEPTION WHEN raise_exception THEN IF SQLERRM<>'VS_SCAN_REPORT_COMPILED' THEN RAISE; END IF; END; END; $verify$;`,
  );
  console.log(
    "Compiled on real PostgreSQL in a rollback-only transaction. No business records inserted.",
    JSON.stringify(result),
  );
} else if (process.argv.includes("--apply")) {
  const previous = await executeAdminSql(
    `SELECT version FROM supabase_migrations.schema_migrations WHERE version='${version}'`,
  );
  if (previous.length)
    throw new Error("Scan report migration is already recorded.");
  const literal = source.replaceAll("'", "''");
  await executeAdminSql(
    `${body}\nINSERT INTO supabase_migrations.schema_migrations(version,name,statements) VALUES('${version}','${name}',ARRAY['${literal}']);\nNOTIFY pgrst,'reload schema';`,
  );
  console.log(
    "Applied and recorded the versioned scan report migration. Existing customer records retained.",
  );
} else if (!process.argv.includes("--verify"))
  throw new Error("Use --compile, --apply or --verify.");
if (process.argv.includes("--verify") || process.argv.includes("--apply")) {
  console.log(
    "security",
    JSON.stringify(
      await executeAdminSql(
        "SELECT c.relname,c.relrowsecurity,has_table_privilege('anon',c.oid,'SELECT') AS anon_read,has_table_privilege('authenticated',c.oid,'SELECT') AS browser_read FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname IN ('qr_scan_reports','scan_report_template_approvals')",
      ),
    ),
  );
  console.log(
    "rpc access",
    JSON.stringify(
      await executeAdminSql(
        "SELECT proname,has_function_privilege('anon',oid,'EXECUTE') AS anon_execute,has_function_privilege('authenticated',oid,'EXECUTE') AS browser_execute FROM pg_proc WHERE proname IN ('begin_qr_scan_report','complete_qr_scan_report')",
      ),
    ),
  );
  console.log(
    "unknown QR gate",
    JSON.stringify(
      await executeAdminSql(
        "SELECT public.begin_qr_scan_report('unrecognized-check-only',gen_random_uuid(),repeat('0',64)) AS gate",
      ),
    ),
  );
  console.log(
    "approval",
    JSON.stringify(
      await executeAdminSql(
        "SELECT template_name,status FROM public.scan_report_template_approvals ORDER BY template_name",
      ),
    ),
  );
}
