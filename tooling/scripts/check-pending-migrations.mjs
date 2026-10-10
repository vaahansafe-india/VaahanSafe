import fs from "node:fs";
import path from "node:path";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig("apps/customer", true);

const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;

async function querySql(sql) {
  const res = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ p_sql: sql }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`${err.code || res.status}: ${err.message || JSON.stringify(err)}`);
  }
  return res.json();
}

async function main() {
  const cols = await querySql("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'supabase_migrations' AND table_name = 'schema_migrations'");
  console.log("schema_migrations columns:", cols);

  const sample = await querySql("SELECT * FROM supabase_migrations.schema_migrations LIMIT 3");
  console.log("schema_migrations sample:", sample);
}

main().catch(console.error);
