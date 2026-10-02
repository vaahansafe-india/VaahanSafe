// Build a private Supabase archive import from a Wrangler D1 SQL export.
// This parses SQL literals; it never starts SQLite or creates a local database.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, statSync } from "node:fs";

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) {
  throw new Error("Usage: node build-d1-archive-import.mjs <d1-export.sql> <private-import.sql>");
}

const source = readFileSync(inputPath, "utf8");
const snapshotSha = createHash("sha256").update(readFileSync(inputPath)).digest("hex");
const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;

function statements(sql) {
  const result = [];
  let start = 0;
  let single = false;
  let double = false;
  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    if (single) {
      if (char === "'" && sql[i + 1] === "'") { i++; continue; }
      if (char === "'") single = false;
    } else if (double) {
      if (char === '"' && sql[i + 1] === '"') { i++; continue; }
      if (char === '"') double = false;
    } else if (char === "'") single = true;
    else if (char === '"') double = true;
    else if (char === ";") {
      result.push(sql.slice(start, i).trim());
      start = i + 1;
    }
  }
  if (single || double) throw new Error("Unterminated quoted SQL literal in D1 export");
  if (sql.slice(start).trim()) throw new Error("D1 export has an unterminated SQL statement");
  return result;
}

function splitValues(input) {
  const values = [];
  let start = 0;
  let quoted = false;
  for (let i = 0; i < input.length; i++) {
    if (input[i] === "'") {
      if (quoted && input[i + 1] === "'") { i++; continue; }
      quoted = !quoted;
    } else if (input[i] === "," && !quoted) {
      values.push(input.slice(start, i).trim());
      start = i + 1;
    }
  }
  if (quoted) throw new Error("Unterminated INSERT value");
  values.push(input.slice(start).trim());
  return values;
}

function parseLiteral(raw) {
  if (/^NULL$/i.test(raw)) return null;
  if (/^X'[0-9a-f]*'$/i.test(raw)) {
    return { __sqlite_blob_base64: Buffer.from(raw.slice(2, -1), "hex").toString("base64") };
  }
  if (raw.startsWith("'") && raw.endsWith("'")) return raw.slice(1, -1).replaceAll("''", "'");
  if (/^-?\d+$/.test(raw)) {
    const number = Number(raw);
    return Number.isSafeInteger(number) ? number : raw;
  }
  if (/^-?\d+\.\d+(?:e[+-]?\d+)?$/i.test(raw)) return Number(raw);
  throw new Error(`Unsupported D1 SQL value form: ${raw.slice(0, 20)}`);
}

const records = [];
const counts = new Map();
for (const statement of statements(source)) {
  if (!/^INSERT INTO\s/i.test(statement)) continue;
  const match = statement.match(/^INSERT INTO\s+"([^"]+)"\s*\((.*?)\)\s*VALUES\s*\((.*)\)$/is);
  if (!match) throw new Error("Unsupported D1 INSERT statement shape");
  const [, table, columnList, valueList] = match;
  const columns = [...columnList.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  const values = splitValues(valueList).map(parseLiteral);
  if (columns.length !== values.length || columns.length === 0) {
    throw new Error(`D1 column/value count mismatch in ${table}`);
  }
  const record = Object.fromEntries(columns.map((column, index) => [column, values[index]]));
  const ordinal = (counts.get(table) ?? 0) + 1;
  counts.set(table, ordinal);
  const json = JSON.stringify(record);
  records.push({
    table,
    ordinal,
    sourceKey: record.id ?? record.name ?? record.code ?? null,
    json,
    hash: createHash("sha256").update(json).digest("hex"),
  });
}

const exportedAt = statSync(inputPath).mtime.toISOString();
const lines = [
  "BEGIN;",
  `INSERT INTO migration_archive.snapshots (sha256, source_database, exported_at, expected_rows, expected_tables) VALUES (${quote(snapshotSha)}, 'vaahansafe-prod-db', ${quote(exportedAt)}::timestamptz, ${records.length}, ${counts.size});`,
];
for (const row of records) {
  lines.push(`INSERT INTO migration_archive.d1_rows (snapshot_sha256, source_table, source_ordinal, source_key, record, record_sha256) VALUES (${quote(snapshotSha)}, ${quote(row.table)}, ${row.ordinal}, ${row.sourceKey === null ? "NULL" : quote(row.sourceKey)}, ${quote(row.json)}::jsonb, ${quote(row.hash)});`);
}
lines.push(`DO $$ BEGIN IF (SELECT count(*) FROM migration_archive.d1_rows WHERE snapshot_sha256 = ${quote(snapshotSha)}) <> ${records.length} THEN RAISE EXCEPTION 'D1 archive row count mismatch'; END IF; END $$;`);
lines.push("COMMIT;");
writeFileSync(outputPath, `${lines.join("\n")}\n`, { mode: 0o600 });
console.log(JSON.stringify({ snapshotSha256: snapshotSha, tables: counts.size, rows: records.length, outputPath }));
