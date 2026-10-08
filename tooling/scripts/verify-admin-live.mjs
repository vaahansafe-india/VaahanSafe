import { executeAdminSql, adminService } from "./admin-service.mjs";
import { ADMIN_MODULES } from "../../apps/admin/lib/modules.ts";
const columns = await executeAdminSql(
  "SELECT table_name,column_name,data_type FROM information_schema.columns WHERE table_schema='public'",
);
const missing = [];
const identifierSearch = [];
for (const module of ADMIN_MODULES.filter((m) => m.table)) {
  for (const field of module.fields)
    if (
      !columns.some(
        (c) => c.table_name === module.table && c.column_name === field,
      )
    )
      missing.push(`${module.key}.${field}`);
  for (const field of module.search || []) {
    const column = columns.find(
      (c) => c.table_name === module.table && c.column_name === field,
    );
    if (
      column?.data_type !== "text" &&
      column?.data_type !== "character varying"
    )
      identifierSearch.push({
        module: module.key,
        field,
        type: column?.data_type || "missing",
      });
  }
}
if (missing.length)
  throw new Error(`Missing console columns: ${missing.join(", ")}`);
const security = await executeAdminSql(
  "SELECT c.relname AS table_name,c.relrowsecurity AS rls,has_table_privilege('anon',c.oid,'SELECT') AS anon_select,has_table_privilege('authenticated',c.oid,'SELECT') AS authenticated_select FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname IN ('admin_users','admin_sessions','admin_audit_logs','admin_partners','admin_stock_transfers','admin_stock_reconciliations','admin_support_tickets','admin_documents','admin_incidents','admin_feature_flags','admin_action_previews','admin_export_jobs','admin_auth_limits') ORDER BY c.relname",
);
if (
  security.length !== 13 ||
  security.some((t) => !t.rls || t.anon_select || t.authenticated_select)
)
  throw new Error("Admin table isolation verification failed.");
const functions = await executeAdminSql(
  "SELECT p.proname AS function_name,p.prosecdef AS security_definer,has_function_privilege('anon',p.oid,'EXECUTE') AS anon_execute,has_function_privilege('authenticated',p.oid,'EXECUTE') AS authenticated_execute FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname LIKE 'admin_%' ORDER BY p.proname",
);
if (
  functions.some(
    (f) => f.security_definer || f.anon_execute || f.authenticated_execute,
  )
)
  throw new Error("Admin RPC isolation verification failed.");
const approvedEmail = process.argv[2]?.trim().toLowerCase();
if (!approvedEmail)
  throw new Error(
    "Usage: node tooling/scripts/verify-admin-live.mjs approved-email",
  );
const { data: accounts, error } = await adminService()
  .from("admin_users")
  .select("email,role,status")
  .eq("email", approvedEmail);
if (
  error ||
  accounts.length !== 1 ||
  accounts[0].role !== "SUPER_ADMIN" ||
  accounts[0].status !== "ACTIVE"
)
  throw new Error("Approved administrator verification failed.");
console.log(
  JSON.stringify({
    modulesChecked: ADMIN_MODULES.length,
    privateTablesVerified: security.length,
    privateFunctionsVerified: functions.length,
    approvedAdminVerified: true,
    identifierSearch,
  }),
);
