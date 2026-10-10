import { readFileSync, readdirSync } from "node:fs";
import { executeAdminSql } from "./admin-service.mjs";
const files = readdirSync("supabase/migrations").filter((f) =>
  /^\d{14}_customer_document_vault(?:_[a-z_]+)?\.sql$/.test(f),
);
const filename =
  process.argv.find((a) => a.startsWith("--file="))?.slice(7) || files[0];
if (!files.includes(filename))
  throw new Error("Select a Document Vault migration only.");
const [version, ...parts] = filename.replace(".sql", "").split("_");
const name = parts.join("_");
const source = readFileSync("supabase/migrations/" + filename, "utf8");
const body = source.replace(/^BEGIN;\s*/, "").replace(/COMMIT;\s*$/, "");
if (process.argv.includes("--compile")) {
  await executeAdminSql(
    `DO $verify_vault$ BEGIN BEGIN ${body} RAISE EXCEPTION 'VAULT_COMPILED'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'VAULT_COMPILED' THEN RAISE; END IF; END; END $verify_vault$;`,
  );
  console.log(
    "Vault migration compiled on real PostgreSQL; transaction rolled back.",
  );
} else if (process.argv.includes("--apply")) {
  const prior = await executeAdminSql(
    `SELECT version FROM supabase_migrations.schema_migrations WHERE version='${version}'`,
  );
  if (prior.length) throw new Error("Migration already recorded.");
  await executeAdminSql(
    `${body} INSERT INTO supabase_migrations.schema_migrations(version,name,statements) VALUES('${version}','${name}',ARRAY['${source.replaceAll("'", "''")}']); NOTIFY pgrst,'reload schema';`,
  );
  console.log(
    "Applied and recorded the Document Vault migration. Existing records preserved.",
  );
} else throw new Error("Use --compile or --apply");
