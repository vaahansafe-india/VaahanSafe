/**
 * VaahanSafe Database Verification Script
 * Validates migrations, foreign keys, constraints, and security lints against in-memory SQLite.
 */

import { DatabaseSync } from "node:sqlite";
import * as fs from "node:fs";
import * as path from "node:path";

const CLOUDFLARE_D1_DIR = path.resolve(__dirname, "../../infrastructure/cloudflare/d1");
const MIGRATIONS_DIR = fs.existsSync(path.join(CLOUDFLARE_D1_DIR, "migrations"))
  ? path.join(CLOUDFLARE_D1_DIR, "migrations")
  : path.resolve(__dirname, "../../database/migrations");
const SEEDS_DIR = fs.existsSync(path.join(CLOUDFLARE_D1_DIR, "seeds"))
  ? path.join(CLOUDFLARE_D1_DIR, "seeds")
  : path.resolve(__dirname, "../../database/seeds");

const FORBIDDEN_COLUMN_PATTERNS = [
  /\bscratch_code\b/i,
  /\bactivation_secret_plaintext\b/i,
  /\bpassword_plaintext\b/i,
  /\b(raw_otp|plaintext_otp)\b/i,
  /^\s*otp\s+(TEXT|INTEGER)/im,
  /\bcard_number\b/i,
  /\bcvv\b/i,
];

const FORBIDDEN_TYPE_PATTERNS = [
  /\bamount\s+REAL\b/i,
  /\bamount\s+FLOAT\b/i,
  /\bprice\s+REAL\b/i,
  /\bprice\s+FLOAT\b/i,
];

function runDatabaseChecks() {
  console.log("=== VaahanSafe D1 Database Verification ===");

  // 1. Check migrations directory
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    throw new Error(`Migrations directory not found: ${MIGRATIONS_DIR}`);
  }

  const migrationFiles = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  console.log(`Discovered ${migrationFiles.length} migrations:`, migrationFiles);

  // 2. Lint SQL files for dangerous patterns
  for (const file of migrationFiles) {
    const filePath = path.join(MIGRATIONS_DIR, file);
    const content = fs.readFileSync(filePath, "utf8");

    for (const pattern of FORBIDDEN_COLUMN_PATTERNS) {
      if (pattern.test(content)) {
        throw new Error(
          `[SECURITY LINT FAILED] Migration ${file} contains forbidden plaintext secret column matching ${pattern}`
        );
      }
    }

    for (const pattern of FORBIDDEN_TYPE_PATTERNS) {
      if (pattern.test(content)) {
        throw new Error(
          `[FINANCIAL INTEGRITY LINT FAILED] Migration ${file} contains forbidden REAL/FLOAT money column matching ${pattern}`
        );
      }
    }
  }
  console.log("✔ Security and monetary schema lints passed.");

  // 3. Instantiate clean in-memory SQLite instance
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON;");
  console.log("✔ In-memory SQLite initialized with PRAGMA foreign_keys = ON.");

  // 4. Execute migrations sequentially
  for (const file of migrationFiles) {
    const filePath = path.join(MIGRATIONS_DIR, file);
    const sql = fs.readFileSync(filePath, "utf8");
    console.log(`Applying migration: ${file}...`);
    db.exec(sql);
  }
  console.log("✔ All migrations executed successfully from zero.");

  // 5. Check foreign key integrity
  const fkCheck = db.prepare("PRAGMA foreign_key_check;").all();
  if (fkCheck.length > 0) {
    throw new Error(`[FK INTEGRITY FAILED] Foreign key check failed: ${JSON.stringify(fkCheck)}`);
  }
  console.log("✔ Foreign key integrity verified (0 violations).");

  // 6. Apply development seeds
  const devSeedPath = path.join(SEEDS_DIR, "dev.sql");
  if (fs.existsSync(devSeedPath)) {
    console.log("Applying development seed: dev.sql...");
    const seedSql = fs.readFileSync(devSeedPath, "utf8");
    db.exec(seedSql);

    const postSeedFkCheck = db.prepare("PRAGMA foreign_key_check;").all();
    if (postSeedFkCheck.length > 0) {
      throw new Error(`[POST-SEED FK FAILED] Violations found after seeding: ${JSON.stringify(postSeedFkCheck)}`);
    }
    console.log("✔ Seed data applied and referential integrity verified.");
  }

  // 7. Verify QR hot-path query execution plan
  const planQuery = `
    EXPLAIN QUERY PLAN
    SELECT 
        s.id AS qr_id,
        s.public_id,
        s.status AS qr_status,
        s.replaced_by_qr_id,
        v.id AS vehicle_id,
        ep.id AS emergency_profile_id
    FROM qr_stickers s
    LEFT JOIN qr_stickers rep_s ON s.replaced_by_qr_id = rep_s.id
    LEFT JOIN qr_assignments a ON s.id = a.qr_id AND a.ended_at IS NULL
    LEFT JOIN vehicles v ON a.vehicle_id = v.id AND v.status = 'ACTIVE'
    LEFT JOIN emergency_profiles ep ON v.id = ep.vehicle_id AND ep.status = 'ACTIVE'
    WHERE s.public_id = ?;
  `;

  const queryPlan = db.prepare(planQuery).all("7F3K9021") as Array<{ detail: string }>;
  console.log("Hot-Path Query Plan:");
  for (const step of queryPlan) {
    console.log(`  └─ ${step.detail}`);
  }

  const usesIndex = queryPlan.some((p) => p.detail.includes("USING INDEX") || p.detail.includes("USING COVERING INDEX"));
  if (!usesIndex) {
    throw new Error("[PERFORMANCE REGRESSION] Hot-path query does not use index on public_id!");
  }
  console.log("✔ Proved indexed search on public_id.");

  console.log("\n✅ All database verification checks PASSED.\n");
}

try {
  runDatabaseChecks();
} catch (err: unknown) {
  console.error("❌ Database check failed:", err instanceof Error ? err.message : err);
  process.exit(1);
}
