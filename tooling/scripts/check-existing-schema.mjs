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
  const tables = await querySql("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
  const tableNames = new Set(tables.map(t => t.table_name));
  console.log("Existing tables in public:", Array.from(tableNames).sort());

  const columns = await querySql("SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public'");
  const colSet = new Set(columns.map(c => `${c.table_name}.${c.column_name}`));
  
  console.log("Has qr_batches.inventory_channel:", colSet.has("qr_batches.inventory_channel"));
  console.log("Has qr_batch_activation_exports table:", tableNames.has("qr_batch_activation_exports"));
  console.log("Has qr_print_jobs table:", tableNames.has("qr_print_jobs"));
  console.log("Has qr_print_templates table:", tableNames.has("qr_print_templates"));
  console.log("Has qr_print_items table:", tableNames.has("qr_print_items"));
  console.log("Has journal_articles table:", tableNames.has("journal_articles"));
}

main().catch(console.error);
