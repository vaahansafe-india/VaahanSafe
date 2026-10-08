// Explicit operator provisioning. No default identity or seeded account.
import { randomUUID } from "node:crypto";
import { executeAdminSql, adminService } from "./admin-service.mjs";

const email = process.argv[2]?.trim().toLowerCase();
if (
  !email ||
  !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@vaahansafe\.com$/.test(email)
) {
  throw new Error(
    "Usage: node tooling/scripts/provision-admin.mjs approved-email",
  );
}
const literal = (value) => `'${value.replaceAll("'", "''")}'`;
const requestId = randomUUID();
await executeAdminSql(`DO $provision$
DECLARE actor public.admin_users;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('admin-provision:' || ${literal(email)}, 0));
  SELECT * INTO actor FROM public.admin_users WHERE lower(email)=${literal(email)} FOR UPDATE;
  IF actor.id IS NOT NULL AND (actor.role<>'SUPER_ADMIN' OR actor.status<>'ACTIVE') THEN
    RAISE EXCEPTION 'Existing account requires an explicit access review';
  END IF;
  IF actor.id IS NULL THEN
    INSERT INTO public.admin_users(id,email,name,role,status,created_at,updated_at)
    VALUES('adm_'||gen_random_uuid()::text,${literal(email)},'Platform administrator','SUPER_ADMIN','ACTIVE',now(),now())
    RETURNING * INTO actor;
    INSERT INTO public.audit_logs(id,user_id,action,resource_type,resource_id,details,created_at)
    VALUES(gen_random_uuid(),NULL,'ADMIN_PROVISIONED','admin_user',actor.id,
      jsonb_build_object('role','SUPER_ADMIN','authorization','Explicit account provisioning request','request_id',${literal(requestId)}),now());
  END IF;
END $provision$;`);
const { data, error } = await adminService()
  .from("admin_users")
  .select("email,role,status")
  .eq("email", email)
  .single();
if (error || !data || data.role !== "SUPER_ADMIN" || data.status !== "ACTIVE")
  throw new Error("Provisioning verification failed.");
console.log(
  JSON.stringify({
    email: data.email,
    role: data.role,
    status: data.status,
    passwordSetupRequired: true,
    verifiedMobileRequired: true,
  }),
);
