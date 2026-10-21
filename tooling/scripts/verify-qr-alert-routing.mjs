import { readFileSync } from "node:fs";
import { adminService } from "./admin-service.mjs";

// Exercise real PostgreSQL and existing records inside a rollback-only block.
// No network delivery is invoked and concurrent dispatchers cannot see changes.
const file = process.argv.find((a) => a.startsWith("--file="))?.slice(7);
const migration = file
  ? readFileSync(`supabase/migrations/${file}`, "utf8")
      .replace(/\bBEGIN;\s*\n/, "")
      .replace(/COMMIT;\s*$/, "")
  : "";
const assertions = readFileSync(
  process.argv.includes("--viewer")
    ? "tests/sql/qr-report-view-links.sql"
    : "tests/sql/qr-alert-routing.sql",
  "utf8",
);
const { data, error } = await adminService().rpc("exec_sql", {
  p_sql: `DO $verify$ BEGIN BEGIN
${migration}
${assertions}
RAISE EXCEPTION 'VS_QR_ALERTS_VERIFIED';
EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'VS_QR_ALERTS_VERIFIED' THEN RAISE; END IF; END; END; $verify$;`,
});
if (error || data?.error) {
  console.error("QR alert verification failed", {
    code: error?.code,
    message: error?.message || data?.error,
  });
  process.exitCode = 1;
} else
  console.log(
    "PASS: PostgreSQL routing/access checks. All changes rolled back; no messages sent.",
  );
