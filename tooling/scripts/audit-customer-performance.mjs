import fs from "node:fs";
import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";

nextEnv.loadEnvConfig("apps/customer", true);
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
async function read(sql) {
  const { data, error } = await client.rpc("exec_sql", { p_sql: sql });
  if (error) throw new Error(`Read-only query failed (${error.code}): ${error.message.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, "[identifier]")}`);
  return data;
}
const registrySource = fs.readFileSync("apps/customer/lib/vehicle-service.ts", "utf8");
const registrySql = registrySource.match(/VEHICLE_REGISTRY_QUERY = `([\s\S]+?)`;/)?.[1];
if (!registrySql) throw new Error("Registry SQL unavailable");
const users = await read("SELECT u.id FROM users u LEFT JOIN vehicles v ON v.user_id = u.id::text AND v.status != 'DELETED' WHERE u.status = 'ACTIVE' GROUP BY u.id ORDER BY count(v.id) DESC, u.created_at DESC LIMIT 1");
if (!users.length) throw new Error("No existing active account to check");
const accountLiteral = `'${users[0].id.replace(/'/g, "''")}'`;
const sql = registrySql.replace("?", accountLiteral);
const start = performance.now();
const registry = await read(sql);
console.log("Registry live read", { milliseconds: Math.round(performance.now() - start), vehicleCount: registry.length,
  nestedProfilesValid: registry.every(row => row.profile === null || typeof row.profile === "object"),
  contactArraysValid: registry.every(row => Array.isArray(row.contacts)), databaseRoundTrips: 1 });
const plan = await read(`EXPLAIN (ANALYZE, FORMAT JSON) ${sql}`);
const report = (plan[0]?.["QUERY PLAN"] || plan[0]?.query_plan || plan[0]?.["query plan"])?.[0];
if (report) console.log("Registry query plan", { planningMs: report["Planning Time"], executionMs: report["Execution Time"] });
const indexes = await read("SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public' AND tablename IN ('sessions', 'auth_identities', 'vehicles', 'qr_assignments', 'emergency_profiles', 'emergency_contacts', 'orders', 'notifications') ORDER BY tablename, indexname");
console.log("Existing indexes", indexes);
const sessionStart = performance.now();
const sessionProbe = await client.from("sessions").select("id").is("revoked_at", null).gt("expires_at", new Date().toISOString()).limit(1);
if (sessionProbe.error) throw new Error(`Session read failed (${sessionProbe.error.code})`);
console.log("Session live read", { milliseconds: Math.round(performance.now() - sessionStart), activeSessionAvailable: Boolean(sessionProbe.data.length) });
