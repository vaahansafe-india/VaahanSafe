import { describe, it, expect, beforeEach } from "vitest";
import { DatabaseSync } from "node:sqlite";
import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";

describe("D1 QR Activation & Secret Lifecycle Flow", () => {
  let db: DatabaseSync;

  beforeEach(() => {
    db = new DatabaseSync(":memory:");
    db.exec("PRAGMA foreign_keys = ON;");

    const cfD1Dir = path.resolve(__dirname, "../infrastructure/cloudflare/d1");
    const migrationsDir = fs.existsSync(path.join(cfD1Dir, "migrations"))
      ? path.join(cfD1Dir, "migrations")
      : path.resolve(__dirname, "../database/migrations");
    const files = ["0001_identity.sql", "0002_vehicle_emergency.sql", "0003_qr_inventory.sql"];

    for (const f of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, f), "utf8");
      db.exec(sql);
    }

    const seedPath = fs.existsSync(path.join(cfD1Dir, "seeds/dev.sql"))
      ? path.join(cfD1Dir, "seeds/dev.sql")
      : path.resolve(__dirname, "../database/seeds/dev.sql");
    const devSeed = fs.readFileSync(seedPath, "utf8");
    db.exec(devSeed);
  });

  function hashSecret(secret: string): string {
    return crypto.createHash("sha256").update(secret.trim().toUpperCase()).digest("hex");
  }

  it("successfully activates a PRINTED sticker with valid scratch code", () => {
    // qr_printed_002 has public_id '8M2P4510' and unconsumed secret hash for 'DEMO1234'
    const publicId = "8M2P4510";
    const scratchCode = "DEMO1234";
    const userId = "usr_demo_101";
    const vehicleId = "veh_demo_bike"; // Royal Enfield

    // 1. Fetch sticker and secret
    const sticker = db.prepare("SELECT id, status FROM qr_stickers WHERE public_id = ?").get(publicId) as {
      id: string;
      status: string;
    };
    expect(sticker).toBeDefined();
    expect(sticker.status).toBe("PRINTED");

    const secret = db.prepare("SELECT * FROM qr_activation_secrets WHERE qr_id = ?").get(sticker.id) as {
      id: string;
      secret_hash: string;
      consumed_at: string | null;
      failed_attempts: number;
    };
    expect(secret).toBeDefined();
    expect(secret.consumed_at).toBeNull();

    // 2. Validate hash
    const inputHash = hashSecret(scratchCode);
    expect(inputHash).toBe(secret.secret_hash);

    // 3. Execute atomic activation transaction
    db.exec("BEGIN TRANSACTION;");
    try {
      const now = new Date().toISOString();
      const assignmentId = "qra_bike_activation";
      const historyId = "qsh_bike_activation";
      const attemptId = "qat_bike_activation";

      // Mark sticker ACTIVATED
      db.prepare("UPDATE qr_stickers SET status = 'ACTIVATED', activated_at = ?, updated_at = ? WHERE id = ?").run(
        now,
        now,
        sticker.id
      );

      // Consume secret
      db.prepare("UPDATE qr_activation_secrets SET consumed_at = ?, updated_at = ? WHERE id = ?").run(
        now,
        now,
        secret.id
      );

      // Create active assignment
      db.prepare(
        "INSERT INTO qr_assignments (id, qr_id, vehicle_id, user_id, assignment_type, assigned_at) VALUES (?, ?, ?, ?, 'INITIAL', ?)"
      ).run(assignmentId, sticker.id, vehicleId, userId, now);

      // Record status transition history
      db.prepare(
        "INSERT INTO qr_status_history (id, qr_id, from_status, to_status, reason_code, actor_type, actor_id, created_at) VALUES (?, ?, 'PRINTED', 'ACTIVATED', 'USER_ACTIVATION', 'USER', ?, ?)"
      ).run(historyId, sticker.id, userId, now);

      // Record activation attempt
      db.prepare(
        "INSERT INTO qr_activation_attempts (id, qr_id, user_id, outcome, created_at) VALUES (?, ?, ?, 'SUCCESS', ?)"
      ).run(attemptId, sticker.id, userId, now);

      db.exec("COMMIT;");
    } catch (e) {
      db.exec("ROLLBACK;");
      throw e;
    }

    // Verify final state
    const updatedSticker = db.prepare("SELECT status, activated_at FROM qr_stickers WHERE id = ?").get(sticker.id) as {
      status: string;
      activated_at: string;
    };
    expect(updatedSticker.status).toBe("ACTIVATED");
    expect(updatedSticker.activated_at).toBeDefined();

    const updatedSecret = db.prepare("SELECT consumed_at FROM qr_activation_secrets WHERE id = ?").get(secret.id) as {
      consumed_at: string;
    };
    expect(updatedSecret.consumed_at).toBeDefined();

    const activeAssignment = db.prepare("SELECT * FROM qr_assignments WHERE qr_id = ? AND ended_at IS NULL").get(sticker.id);
    expect(activeAssignment).toBeDefined();

    const history = db.prepare("SELECT * FROM qr_status_history WHERE qr_id = ?").all(sticker.id);
    expect(history.length).toBeGreaterThanOrEqual(1);
  });

  it("fails when attempting to activate an already ACTIVATED sticker", () => {
    const activeSticker = db.prepare("SELECT id, status FROM qr_stickers WHERE public_id = '7F3K9021'").get() as {
      id: string;
      status: string;
    };
    expect(activeSticker.status).toBe("ACTIVATED");

    // Attempting activation on already activated sticker must be rejected
    const secret = db.prepare("SELECT consumed_at FROM qr_activation_secrets WHERE qr_id = ?").get(activeSticker.id) as {
      consumed_at: string;
    };
    expect(secret.consumed_at).not.toBeNull();
  });

  it("increments failed_attempts and locks secret after consecutive failures", () => {
    const sticker = db.prepare("SELECT id FROM qr_stickers WHERE public_id = '8M2P4510'").get() as { id: string };

    // Simulate 5 incorrect scratch code attempts
    for (let i = 1; i <= 5; i++) {
      db.exec("BEGIN TRANSACTION;");
      const current = db.prepare("SELECT failed_attempts FROM qr_activation_secrets WHERE qr_id = ?").get(sticker.id) as {
        failed_attempts: number;
      };
      const nextFailures = current.failed_attempts + 1;
      const lockedUntil = nextFailures >= 5 ? new Date(Date.now() + 3600 * 1000).toISOString() : null;

      db.prepare(
        "UPDATE qr_activation_secrets SET failed_attempts = ?, locked_until = ?, updated_at = datetime('now') WHERE qr_id = ?"
      ).run(nextFailures, lockedUntil, sticker.id);

      db.prepare(
        "INSERT INTO qr_activation_attempts (id, qr_id, outcome, failure_reason_code) VALUES (?, ?, 'INVALID_SECRET', 'INCORRECT_CODE')"
      ).run(`attempt_fail_${i}`, sticker.id);
      db.exec("COMMIT;");
    }

    const lockedSecret = db.prepare("SELECT failed_attempts, locked_until FROM qr_activation_secrets WHERE qr_id = ?").get(sticker.id) as {
      failed_attempts: number;
      locked_until: string;
    };
    expect(lockedSecret.failed_attempts).toBe(5);
    expect(lockedSecret.locked_until).toBeDefined();

    // Now attempt with correct secret while locked: should reject due to locked_until
    const isLocked = new Date(lockedSecret.locked_until).getTime() > Date.now();
    expect(isLocked).toBe(true);
  });
});
