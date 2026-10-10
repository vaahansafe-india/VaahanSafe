import fs from "node:fs/promises";
import nextEnv from "@next/env";
nextEnv.loadEnvConfig("apps/admin", true);
const version = "20261010074500";
const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  key = process.env.SUPABASE_SERVICE_ROLE_KEY;
async function sql(query) {
  const response = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_sql: query }),
    signal: AbortSignal.timeout(60000),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(`Migration failed (${data.code}): ${data.message}`);
  return data;
}
const columns = await sql(
  "SELECT column_name FROM information_schema.columns WHERE table_schema='supabase_migrations' AND table_name='schema_migrations'",
);
console.log(
  "Migration history columns:",
  columns.map((c) => c.column_name).join(","),
);
if (!process.argv.includes("--inspect")) {
  if (!process.argv.includes("--apply"))
    throw new Error("Pass --apply only after user authorization.");
  const previous = await sql(
    `SELECT version FROM supabase_migrations.schema_migrations WHERE version='${version}'`,
  );
  if (previous.length)
    throw new Error("Retailer migration already recorded.");
  const source = await fs.readFile(
    `supabase/migrations/${version}_retailer_operations.sql`,
    "utf8",
  );
  const body = source
    .replace(/^([\s\S]*?)BEGIN;/, "$1")
    .replace(/COMMIT;\s*$/, "");
  const literal = (value) => `'${value.replaceAll("'", "''")}'`;
  await sql(
    body +
      `\nINSERT INTO supabase_migrations.schema_migrations(version,name,statements) VALUES('${version}','retailer_operations',ARRAY[${literal(source)}]);\nNOTIFY pgrst,'reload schema';`,
  );
  console.log(
    "Applied and recorded retailer migration. Existing business records retained; no validation records inserted.",
  );
}
