import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";

nextEnv.loadEnvConfig("apps/customer", true);
const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false, autoRefreshToken: false },
  },
);
const { data: session, error } = await client
  .from("sessions")
  .select("token_hash")
  .is("revoked_at", null)
  .gt("expires_at", new Date().toISOString())
  .order("created_at", { ascending: false })
  .limit(1)
  .maybeSingle();
if (error || !session)
  throw new Error(
    "No existing active session available for read-only measurement",
  );
for (let sample = 1; sample <= 3; sample++) {
  let start = performance.now();
  const oldSession = await client
    .from("sessions")
    .select("*")
    .eq("token_hash", session.token_hash)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (oldSession.error || !oldSession.data)
    throw new Error("Session read failed");
  const [user, identities] = await Promise.all([
    client
      .from("users")
      .select("*")
      .eq("id", oldSession.data.user_id)
      .maybeSingle(),
    client
      .from("auth_identities")
      .select("*")
      .eq("user_id", oldSession.data.user_id)
      .order("created_at"),
  ]);
  if (user.error || identities.error || !user.data)
    throw new Error("Account read failed");
  const previousMs = Math.round(performance.now() - start);
  start = performance.now();
  const joined = await client
    .from("sessions")
    .select("*, users!inner(*, auth_identities(*))")
    .eq("token_hash", session.token_hash)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .eq("users.status", "ACTIVE")
    .maybeSingle();
  if (joined.error || !joined.data)
    throw new Error(
      `Combined read failed (${joined.error?.code || "missing"})`,
    );
  if (
    joined.data.users.id !== user.data.id ||
    joined.data.users.auth_identities.length !== identities.data.length
  )
    throw new Error("Combined account differs");
  console.log({
    sample,
    previousMs,
    combinedMs: Math.round(performance.now() - start),
    previousRequests: 3,
    combinedRequests: 1,
    accountAndIdentitiesMatch: true,
  });
}
