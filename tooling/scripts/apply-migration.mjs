import fs from "node:fs";
import nextEnv from "@next/env";
nextEnv.loadEnvConfig("apps/customer", true);
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const base = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const file = process.argv[2];
if (!file || !serviceKey || !base) throw new Error("Migration path and Supabase server environment are required");
// RPC statements execute atomically inside the function's existing transaction.
const sql = fs.readFileSync(file, "utf8").replace(/^BEGIN;\s*$/gm, "").replace(/^COMMIT;\s*$/gm, "");
const response = await fetch(`${base}/rest/v1/rpc/exec_sql`, {
  method: "POST", headers: { "Content-Type": "application/json", apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
  body: JSON.stringify({ p_sql: sql }),
});
if (!response.ok) { const result = await response.json(); throw new Error(`Migration failed: ${result.code}: ${result.message}`); }
console.log(`Applied ${file}`);
