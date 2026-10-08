// Real operator-managed password provisioning. No default/password argument,
// printed credential, mock identity, or self-service role elevation.
import { randomUUID } from "node:crypto";
import { adminService, executeAdminSql } from "./admin-service.mjs";

const email = process.argv[2]?.trim().toLowerCase();
const prepareOnly = process.argv[3] === "--prepare";
if (
  !email ||
  !/^[^\s@]+@vaahansafe\.com$/.test(email) ||
  process.argv.length > (prepareOnly ? 4 : 3)
)
  throw new Error(
    "Usage: node tooling/scripts/set-admin-password.mjs approved-email [--prepare]",
  );

function hiddenInput(prompt) {
  if (!process.stdin.isTTY || !process.stdout.isTTY)
    throw new Error(
      "Run this command in your own interactive terminal. Passwords cannot be passed as arguments.",
    );
  return new Promise((resolve, reject) => {
    let value = "";
    const finish = (error) => {
      process.stdin.removeListener("data", onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write("\n");
      if (error) reject(error);
      else resolve(value);
      value = "";
    };
    const onData = (chunk) => {
      for (const ch of chunk.toString("utf8")) {
        if (ch === "\u0003") {
          finish(new Error("Cancelled; no password was changed."));
          return;
        }
        if (ch === "\r" || ch === "\n") {
          finish();
          return;
        }
        if (ch === "\b" || ch === "\u007f")
          value = [...value].slice(0, -1).join("");
        else if (ch >= " " && ch !== "\u007f") value += ch;
      }
    };
    process.stdout.write(prompt);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on("data", onData);
  });
}

const db = adminService();
const { data: actor, error: actorError } = await db
  .from("admin_users")
  .select("id,email,status,auth_user_id")
  .eq("email", email)
  .eq("status", "ACTIVE")
  .maybeSingle();
if (actorError || !actor)
  throw new Error("An active, explicitly approved admin account is required.");

let password;
if (!prepareOnly) {
  password = await hiddenInput("New admin password (input hidden): ");
  if (password.length < 12 || password.length > 128)
    throw new Error("Use a password between 12 and 128 characters.");
  const confirm = await hiddenInput("Confirm password (input hidden): ");
  if (password !== confirm)
    throw new Error("Passwords did not match; no password was changed.");
}

let user;
if (actor.auth_user_id) {
  const { data, error } = await db.auth.admin.getUserById(actor.auth_user_id);
  if (error || data.user?.email?.toLowerCase() !== email)
    throw new Error("The pinned Auth identity requires an operator review.");
  user = data.user;
} else {
  // Existing Auth identities are reused only by this explicit operator command,
  // never claimed automatically by a browser attempting to sign in.
  for (let page = 1; ; page++) {
    const { data, error } = await db.auth.admin.listUsers({
      page,
      perPage: 100,
    });
    if (error) throw new Error("Unable to inspect Supabase Auth identities.");
    user = data.users.find((entry) => entry.email?.toLowerCase() === email);
    if (user || data.users.length < 100) break;
  }
  if (!user) {
    const { data, error } = await db.auth.admin.createUser({
      email,
      email_confirm: true,
    });
    if (error || !data.user)
      throw new Error(
        "Unable to provision the approved Supabase Auth identity.",
      );
    user = data.user;
  }
}

const literal = (value) => `'${value.replaceAll("'", "''")}'`;
await executeAdminSql(`DO $pin$
DECLARE account public.admin_users;
BEGIN
 SELECT * INTO account FROM public.admin_users WHERE id=${literal(actor.id)} AND status='ACTIVE' FOR UPDATE;
 IF account.id IS NULL OR lower(account.email)<>${literal(email)} OR
    (account.auth_user_id IS NOT NULL AND account.auth_user_id<>${literal(user.id)}::uuid)
 THEN RAISE EXCEPTION 'Identity binding rejected'; END IF;
 IF account.auth_user_id IS NULL THEN
   UPDATE public.admin_users SET auth_user_id=${literal(user.id)}::uuid,updated_at=now() WHERE id=account.id;
   INSERT INTO public.admin_audit_logs(actor_id,action,resource_type,resource_id,reason,request_id,before_summary,after_summary)
   VALUES(account.id,'PASSWORD_IDENTITY_BOUND','admin_user',account.id,'Explicit operator provisioning of approved email identity',${literal(randomUUID())}::uuid,'{}','{"provider":"supabase_password"}');
 END IF;
END $pin$;`);

if (password) {
  const request = randomUUID();
  await executeAdminSql(`DO $intent$
  BEGIN
    PERFORM 1 FROM public.admin_users WHERE id=${literal(actor.id)} FOR UPDATE;
    UPDATE public.admin_sessions SET revoked_at=now() WHERE admin_id=${literal(actor.id)} AND revoked_at IS NULL;
    INSERT INTO public.admin_audit_logs(actor_id,action,resource_type,resource_id,reason,request_id,before_summary,after_summary)
    VALUES(${literal(actor.id)},'PASSWORD_RESET_INTENT','admin_user',${literal(actor.id)},'Explicit operator password setup or reset; existing sessions revoked',${literal(request)}::uuid,'{}','{}');
  END $intent$;`);
  const { error } = await db.auth.admin.updateUserById(user.id, {
    password,
    email_confirm: true,
  });
  password = undefined;
  if (error)
    throw new Error(
      "Supabase Auth rejected the new password. The identity remains pinned.",
    );
  // Reset revokes the application's opaque sessions as well as provider sessions.
  await executeAdminSql(`DO $revoke$
  DECLARE account public.admin_users;
  BEGIN
    SELECT * INTO account FROM public.admin_users WHERE id=${literal(actor.id)} FOR UPDATE;
    UPDATE public.admin_sessions SET revoked_at=now() WHERE admin_id=account.id AND revoked_at IS NULL;
    INSERT INTO public.admin_audit_logs(actor_id,action,resource_type,resource_id,reason,request_id,before_summary,after_summary)
    VALUES(account.id,'PASSWORD_RESET_COMPLETE','admin_user',account.id,'Operator password reset completed; existing admin sessions revoked',${literal(request)}::uuid,'{}','{"sessionsRevoked":true}');
  END $revoke$;`);
  console.log(
    "Password saved in Supabase Auth. Sign in with your work email, then verify your mobile.",
  );
} else
  console.log(
    "Approved email identity pinned. Run this command without --prepare to choose a password securely.",
  );
