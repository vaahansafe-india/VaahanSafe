import { readFile } from "node:fs/promises";
import { executeAdminSql } from "./admin-service.mjs";
const source = await readFile(
  "supabase/migrations/20261003192653_admin_password_auth.sql",
  "utf8",
);
const ddl = source.replace(/^BEGIN;\s*$/m, "").replace(/^COMMIT;\s*$/m, "");
await executeAdminSql(`DO $verify_password$
BEGIN
 BEGIN
  SET LOCAL lock_timeout='5s';
  SET LOCAL statement_timeout='30s';
  EXECUTE $password_ddl$${ddl}$password_ddl$;
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid='public.admin_auth_limits'::regclass)
     OR has_table_privilege('anon','public.admin_auth_limits','SELECT')
     OR has_table_privilege('authenticated','public.admin_auth_limits','SELECT')
     OR has_function_privilege('anon','public.admin_password_session(text,uuid,text,uuid)','EXECUTE')
     OR has_function_privilege('authenticated','public.admin_reserve_password_attempt(text)','EXECUTE')
     OR to_regprocedure('public.admin_google_session(text,text,text,uuid)') IS NOT NULL
  THEN RAISE EXCEPTION 'Password auth isolation failed'; END IF;
  RAISE EXCEPTION USING ERRCODE='ZX002',MESSAGE='Password migration validation completed';
 EXCEPTION WHEN SQLSTATE 'ZX002' THEN NULL;
 END;
END $verify_password$;`);
console.log(
  "Password migration validated against the real schema; validation changes rolled back.",
);
