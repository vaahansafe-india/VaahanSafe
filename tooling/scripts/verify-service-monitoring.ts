import { readFileSync } from "node:fs";
import { recordServiceChecks, type Env } from "../../infrastructure/cloudflare/workers/supabase-keepalive/src/index";
import { PAYMENT_HEALTH_SQL, NOTIFICATION_HEALTH_SQL, ANALYTICS_HEALTH_SQL } from "../../infrastructure/cloudflare/workers/supabase-keepalive/src/service-monitoring";

const parse = (path: string) => Object.fromEntries(readFileSync(path, "utf8").split(/\r?\n/).filter((line) => /^\w+=/.test(line)).map((line) => {
  const index = line.indexOf("=");
  return [line.slice(0, index), line.slice(index + 1).replace(/^["']|["']$/g, "")];
}));
async function main() {
  const root = parse(".env"), customer = { ...root, ...parse("apps/customer/.env.production") }, status = parse("apps/status/.env.local");
  async function d1(sql: string, params: unknown[] = []) {
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${root.CLOUDFLARE_ACCOUNT_ID}/d1/database/${root.CLOUDFLARE_D1_DATABASE_ID}/query`, {
      method: "POST", headers: { Authorization: `Bearer ${root.CLOUDFLARE_API_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ sql, params }), signal: AbortSignal.timeout(20_000),
    });
    const data = await response.json() as { success: boolean; result: Array<{ results: unknown[] }> };
    if (!data.success) throw new Error("D1 monitoring operation failed");
    return data.result[0].results;
  }
  for (const [name, sql] of [["payments", PAYMENT_HEALTH_SQL], ["notifications", NOTIFICATION_HEALTH_SQL], ["customer-analytics", ANALYTICS_HEALTH_SQL]]) {
    const response = await fetch(`${customer.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: "POST", headers: { apikey: customer.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${customer.SUPABASE_SERVICE_ROLE_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_sql: sql }), signal: AbortSignal.timeout(20_000),
    });
    const data = await response.json();
    if (!response.ok || !Array.isArray(data)) throw new Error(`Read-only ${name} monitoring query failed`);
    console.log(`${name} aggregate health`, data);
  }
  if (process.argv.includes("--record")) {
    // Run the exact scheduled implementation once with remote D1. Only monitoring samples are written.
    const database = {
      prepare(sql: string) {
        const statement = (params: unknown[]) => ({ sql, params,
          run: () => d1(sql, params), all: async () => ({ results: await d1(sql, params) }),
          bind: (...values: unknown[]) => statement(values),
        });
        return statement([]);
      },
      batch: (statements: Array<{ sql: string; params: unknown[] }>) => Promise.all(statements.map((statement) => d1(statement.sql, statement.params))),
    } as unknown as D1Database;
    await recordServiceChecks({ ...status, ...customer, SUPABASE_URL: customer.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SECRET_KEY: customer.SUPABASE_SERVICE_ROLE_KEY, STATUS_DB: database } as Env);
    console.log("Completed real provider checks; saved their measured results in production D1.");
  }
  for (const service of ["payments", "notifications", "customer-analytics"]) {
    const url = `https://vaahansafe-supabase-keepalive.vaahansafe.workers.dev/services/${service}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
    console.log("Public capability", { http: response.status, ...await response.json() });
  }
}
main().catch(() => { console.error("Monitoring verification failed; no sensitive response details printed."); process.exitCode = 1; });
