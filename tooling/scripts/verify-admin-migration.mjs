// Validate the versioned migration against the configured real schema and roll it back.
// This does not create accounts, sessions, mock records, or persistent schema changes.
import { readFile } from "node:fs/promises";
import { executeAdminSql } from "./admin-service.mjs";
const source = await readFile(
  "supabase/migrations/20261003175341_admin_operations_console.sql",
  "utf8",
);
const ddl = source.replace(/^BEGIN;\s*$/m, "").replace(/^COMMIT;\s*$/m, "");
if (ddl.includes("$admin_ddl$")) throw new Error("Unexpected SQL delimiter.");
await executeAdminSql(`DO $admin_verify$
BEGIN
  BEGIN
    SET LOCAL lock_timeout='5s';
    SET LOCAL statement_timeout='30s';
    EXECUTE $admin_ddl$${ddl}$admin_ddl$;
    IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND c.relname IN ('admin_users','admin_sessions','admin_audit_logs','admin_partners','admin_stock_transfers','admin_stock_reconciliations','admin_support_tickets','admin_documents','admin_incidents','admin_feature_flags','admin_action_previews','admin_export_jobs') AND NOT c.relrowsecurity)
    THEN RAISE EXCEPTION 'Missing admin row security'; END IF;
    IF has_function_privilege('anon','public.admin_console_mutate(uuid,text,text,jsonb,text,uuid)','EXECUTE')
      OR has_function_privilege('authenticated','public.admin_google_session(text,text,text,uuid)','EXECUTE')
    THEN RAISE EXCEPTION 'Public admin RPC access'; END IF;
    RAISE EXCEPTION USING ERRCODE='ZX001', MESSAGE='Admin migration validation complete';
  EXCEPTION WHEN SQLSTATE 'ZX001' THEN NULL;
  END;
END $admin_verify$;`);
console.log(
  "Admin migration validated against the real schema; every validation change rolled back.",
);
