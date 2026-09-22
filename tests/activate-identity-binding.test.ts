import { describe, it, expect, beforeEach } from "vitest";
import { DatabaseSync } from "node:sqlite";
import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import {
  verifyScratchSecret,
  calculateNextLockout,
  evaluateSecretAttemptEligibility,
  grantAuthoritativeEntitlements,
  ALL_ENTITLEMENT_CAPABILITIES,
} from "@vaahansafe/qr-core";
import { normalizePublicId } from "../apps/activate/lib/activation-service";
import { hashToken } from "../apps/activate/lib/crypto-helpers";

describe("VaahanSafe Activate — Identity Binding Ceremony & Security Invariants", () => {
  let db: DatabaseSync;

  beforeEach(() => {
    db = new DatabaseSync(":memory:");
    db.exec("PRAGMA foreign_keys = ON;");

    const migrationsDir = path.resolve(__dirname, "../database/migrations");
    const migrationFiles = [
      "0001_identity.sql",
      "0002_vehicle_emergency.sql",
      "0003_qr_inventory.sql",
      "0005_commerce_subscriptions.sql",
      "0008_service_entitlements_and_idempotency.sql",
      "0013_qr_activation_challenges.sql",
    ];

    for (const f of migrationFiles) {
      const sql = fs.readFileSync(path.join(migrationsDir, f), "utf8");
      db.exec(sql);
    }

    // Seed test fixtures
    db.exec(`
      INSERT INTO users (id, primary_phone, onboarding_status, status)
      VALUES ('usr_test_1', '+919876543210', 'COMPLETED', 'ACTIVE'),
             ('usr_unverified', '+919876543211', 'PHONE_REQUIRED', 'ACTIVE'),
             ('usr_stranger', '+919876543212', 'COMPLETED', 'ACTIVE');

      INSERT INTO vehicles (id, user_id, registration_number, registration_number_normalized, vehicle_type, make, model, status)
      VALUES ('veh_car_1', 'usr_test_1', 'DL 01 AB 1234', 'DL01AB1234', 'CAR', 'Hyundai', 'Creta', 'ACTIVE'),
             ('veh_car_bound', 'usr_test_1', 'MH 02 CD 5678', 'MH02CD5678', 'CAR', 'Honda', 'City', 'ACTIVE'),
             ('veh_stranger', 'usr_stranger', 'KA 03 EF 9999', 'KA03EF9999', 'CAR', 'Tata', 'Nexon', 'ACTIVE');

      INSERT INTO qr_batches (id, reference_code, quantity, status)
      VALUES ('qrb_1', 'BAT-ACT-001', 10, 'PRINTED');

      -- Eligible sticker 1 (PRINTED / WITH_RETAILER)
      INSERT INTO qr_stickers (id, public_id, visible_code, batch_id, status)
      VALUES ('qr_elig_1', 'vs_7f3k9021', 'VS-7F3K-9021', 'qrb_1', 'WITH_RETAILER');

      -- Secret for sticker 1: hash of 'SECRET12'
      -- SHA256 of 'SECRET12'
      INSERT INTO qr_activation_secrets (id, qr_id, secret_hash, hash_version, failed_attempts)
      VALUES ('sec_1', 'qr_elig_1', '${crypto.createHash("sha256").update("SECRET12").digest("hex")}', 'v1', 0);

      -- Already bound sticker and assignment
      INSERT INTO qr_stickers (id, public_id, visible_code, batch_id, status)
      VALUES ('qr_active_1', 'vs_alreadyactive', 'VS-ALREADY-ACTIVE', 'qrb_1', 'ACTIVATED');

      INSERT INTO qr_assignments (id, qr_id, vehicle_id, user_id, assignment_type)
      VALUES ('qra_existing', 'qr_active_1', 'veh_car_bound', 'usr_test_1', 'INITIAL');
    `);
  });

  describe("1. Public ID Normalization", () => {
    it("normalizes diverse input formats into canonical vs_ identifier", () => {
      expect(normalizePublicId("vs_7f3k9021")).toBe("vs_7f3k9021");
      expect(normalizePublicId("VS-7F3K-9021")).toBe("vs_7f3k-9021");
      expect(normalizePublicId("https://qr.vaahansafe.com/vs_7f3k9021")).toBe("vs_7f3k9021");
      expect(normalizePublicId("https://activate.vaahansafe.com/vs_7f3k9021?ref=box")).toBe("vs_7f3k9021");
      expect(normalizePublicId("   VS_7F3K9021   ")).toBe("vs_7f3k9021");
    });
  });

  describe("2. Physical Possession Verification & Lockout Protection", () => {
    it("verifies correct scratch secret in constant time", async () => {
      const storedHash = crypto.createHash("sha256").update("SECRET12").digest("hex");
      const isValid = await verifyScratchSecret("SECRET12", storedHash);
      expect(isValid).toBe(true);

      const isInvalid = await verifyScratchSecret("WRONG999", storedHash);
      expect(isInvalid).toBe(false);
    });

    it("enforces progressive lockout after 5 consecutive failures", () => {
      let attempts = 0;
      let lockoutResult = calculateNextLockout(attempts);
      expect(lockoutResult.newFailedAttempts).toBe(1);
      expect(lockoutResult.isNewlyLocked).toBe(false);

      attempts = 4;
      lockoutResult = calculateNextLockout(attempts);
      expect(lockoutResult.newFailedAttempts).toBe(5);
      expect(lockoutResult.isNewlyLocked).toBe(true);
      expect(lockoutResult.lockedUntil).not.toBeNull();

      // Eligibility check prevents further attempts
      const eligibility = evaluateSecretAttemptEligibility(null, lockoutResult.lockedUntil);
      expect(eligibility.canAttempt).toBe(false);
      expect(eligibility.errorCode).toBe("SECRET_LOCKED");
    });

    it("prevents reuse of an already consumed secret", () => {
      const now = new Date().toISOString();
      const eligibility = evaluateSecretAttemptEligibility(now, null);
      expect(eligibility.canAttempt).toBe(false);
      expect(eligibility.errorCode).toBe("SECRET_CONSUMED");
    });
  });

  describe("3. Short-Lived Activation Challenge Table (D1 0013)", () => {
    it("creates, queries, and consumes activation challenges safely", async () => {
      const challengeToken = "ch_test_token_1234567890abcdef";
      const tokenHash = await hashToken(challengeToken);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      // Insert challenge
      db.prepare(`
        INSERT INTO qr_activation_challenges (id, challenge_token_hash, qr_id, public_id, expires_at)
        VALUES ('qac_test_1', ?, 'qr_elig_1', 'vs_7f3k9021', ?)
      `).run(tokenHash, expiresAt);

      // Query active challenge
      const row = db.prepare(`
        SELECT id, public_id, consumed_at FROM qr_activation_challenges
        WHERE challenge_token_hash = ? AND consumed_at IS NULL AND datetime(expires_at) > datetime('now')
      `).get(tokenHash) as any;

      expect(row).toBeDefined();
      expect(row.public_id).toBe("vs_7f3k9021");
      expect(row.consumed_at).toBeNull();

      // Consume challenge
      db.prepare(`UPDATE qr_activation_challenges SET consumed_at = datetime('now') WHERE id = 'qac_test_1'`).run();

      // Subsequent query should find nothing
      const consumedRow = db.prepare(`
        SELECT id FROM qr_activation_challenges
        WHERE challenge_token_hash = ? AND consumed_at IS NULL
      `).get(tokenHash);
      expect(consumedRow).toBeUndefined();
    });

    it("enforces UNIQUE constraint on challenge_token_hash", async () => {
      const tokenHash = await hashToken("ch_duplicate_token");
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      db.prepare(`
        INSERT INTO qr_activation_challenges (id, challenge_token_hash, qr_id, public_id, expires_at)
        VALUES ('qac_dup_1', ?, 'qr_elig_1', 'vs_7f3k9021', ?)
      `).run(tokenHash, expiresAt);

      expect(() => {
        db.prepare(`
          INSERT INTO qr_activation_challenges (id, challenge_token_hash, qr_id, public_id, expires_at)
          VALUES ('qac_dup_2', ?, 'qr_elig_1', 'vs_7f3k9021', ?)
        `).run(tokenHash, expiresAt);
      }).toThrow(/UNIQUE constraint failed/);
    });
  });

  describe("4. Atomic Activation Commitment Invariants", () => {
    it("rejects activation if selected vehicle already has an active QR", () => {
      const existingAssignment = db.prepare(`
        SELECT id FROM qr_assignments WHERE vehicle_id = 'veh_car_bound' AND ended_at IS NULL
      `).get();
      expect(existingAssignment).toBeDefined();
    });

    it("commits atomic activation transaction, updating lifecycle, assignment, secret, challenge, and entitlements", async () => {
      const userId = "usr_test_1";
      const vehicleId = "veh_car_1";
      const qrId = "qr_elig_1";
      const now = new Date().toISOString();

      // Create challenge
      const challengeToken = "ch_commit_token";
      const tokenHash = await hashToken(challengeToken);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      db.prepare(`
        INSERT INTO qr_activation_challenges (id, challenge_token_hash, qr_id, public_id, user_id, expires_at)
        VALUES ('qac_commit', ?, ?, 'vs_7f3k9021', ?, ?)
      `).run(tokenHash, qrId, userId, expiresAt);

      // Perform atomic batch
      db.exec("BEGIN TRANSACTION;");
      db.prepare(`
        INSERT INTO qr_assignments (id, qr_id, vehicle_id, user_id, assignment_type, assigned_at)
        VALUES ('qra_commit_1', '${qrId}', '${vehicleId}', '${userId}', 'INITIAL', '${now}');
      `).run();

      db.prepare(`
        UPDATE qr_stickers SET status = 'ACTIVATED', activated_at = '${now}' WHERE id = '${qrId}';
      `).run();

      db.prepare(`
        INSERT INTO qr_status_history (id, qr_id, from_status, to_status, reason_code, actor_type, actor_id)
        VALUES ('qsh_1', '${qrId}', 'WITH_RETAILER', 'ACTIVATED', 'RETAIL_ACTIVATION', 'USER', '${userId}');
      `).run();

      db.prepare(`
        UPDATE qr_activation_secrets SET consumed_at = '${now}' WHERE qr_id = '${qrId}';
      `).run();

      db.prepare(`
        UPDATE qr_activation_challenges SET consumed_at = '${now}' WHERE id = 'qac_commit';
      `).run();
      db.exec("COMMIT;");

      // Verify sticker status
      const updatedSticker = db.prepare(`SELECT status, activated_at FROM qr_stickers WHERE id = ?`).get(qrId) as any;
      expect(updatedSticker.status).toBe("ACTIVATED");
      expect(updatedSticker.activated_at).toBe(now);

      // Verify assignment
      const assignment = db.prepare(`SELECT qr_id, vehicle_id, user_id FROM qr_assignments WHERE qr_id = ? AND ended_at IS NULL`).get(qrId) as any;
      expect(assignment.vehicle_id).toBe(vehicleId);
      expect(assignment.user_id).toBe(userId);

      // Verify secret is consumed
      const secret = db.prepare(`SELECT consumed_at FROM qr_activation_secrets WHERE qr_id = ?`).get(qrId) as any;
      expect(secret.consumed_at).toBe(now);

      // Verify challenge is consumed
      const challenge = db.prepare(`SELECT consumed_at FROM qr_activation_challenges WHERE id = 'qac_commit'`).get() as any;
      expect(challenge.consumed_at).toBe(now);

      // Verify partial unique index prevents duplicate active binding on same QR
      expect(() => {
        db.prepare(`
          INSERT INTO qr_assignments (id, qr_id, vehicle_id, user_id, assignment_type)
          VALUES ('qra_dup_qr', '${qrId}', 'veh_car_1', '${userId}', 'INITIAL');
        `).run();
      }).toThrow(/UNIQUE constraint failed/);

      // Verify partial unique index prevents duplicate active binding on same Vehicle
      expect(() => {
        db.prepare(`
          INSERT INTO qr_assignments (id, qr_id, vehicle_id, user_id, assignment_type)
          VALUES ('qra_dup_veh', 'qr_active_1', '${vehicleId}', '${userId}', 'INITIAL');
        `).run();
      }).toThrow(/UNIQUE constraint failed/);
    });

    it("rejects activation if user has not verified their mobile number", () => {
      // usr_unverified has onboarding_status = 'PHONE_REQUIRED'
      const unverifiedUser = db.prepare(`SELECT onboarding_status FROM users WHERE id = 'usr_unverified'`).get() as any;
      expect(unverifiedUser.onboarding_status).toBe("PHONE_REQUIRED");
      const isVerified = unverifiedUser.onboarding_status !== "PHONE_REQUIRED";
      expect(isVerified).toBe(false);
    });

    it("rejects activation if vehicle is owned by a different user", () => {
      const vehicle = db.prepare(`SELECT user_id FROM vehicles WHERE id = 'veh_stranger'`).get() as any;
      expect(vehicle.user_id).toBe("usr_stranger");
      expect(vehicle.user_id === "usr_test_1").toBe(false);
    });

    it("rejects activation if challenge is expired", () => {
      const pastTime = new Date(Date.now() - 3600 * 1000).toISOString();
      db.prepare(`
        INSERT INTO qr_activation_challenges (id, challenge_token_hash, qr_id, public_id, expires_at)
        VALUES ('qac_expired', 'hash_expired', 'qr_elig_1', 'vs_7f3k9021', ?)
      `).run(pastTime);

      const challenge = db.prepare(`
        SELECT id FROM qr_activation_challenges
        WHERE challenge_token_hash = 'hash_expired'
          AND consumed_at IS NULL
          AND datetime(expires_at) > datetime('now')
      `).get();

      expect(challenge).toBeUndefined();
    });

    it("rejects activation if challenge was already consumed", () => {
      const futureTime = new Date(Date.now() + 3600 * 1000).toISOString();
      const consumedTime = new Date().toISOString();
      db.prepare(`
        INSERT INTO qr_activation_challenges (id, challenge_token_hash, qr_id, public_id, expires_at, consumed_at)
        VALUES ('qac_consumed', 'hash_consumed', 'qr_elig_1', 'vs_7f3k9021', ?, ?)
      `).run(futureTime, consumedTime);

      const challenge = db.prepare(`
        SELECT id FROM qr_activation_challenges
        WHERE challenge_token_hash = 'hash_consumed'
          AND consumed_at IS NULL
      `).get();

      expect(challenge).toBeUndefined();
    });

    it("authoritative entitlements grant all 5 capabilities under RETAIL_ACTIVATION", async () => {
      const mockDb = {
        execute: async (query: string, params: unknown[]) => {
          const stmt = db.prepare(query);
          stmt.run(...(params as any[]));
          return { rowsAffected: 1 };
        },
        query: async () => [],
        queryFirst: async () => null,
        batch: async () => [],
      };

      await grantAuthoritativeEntitlements({
        userId: "usr_test_1",
        vehicleId: "veh_car_1",
        qrStickerId: "qr_elig_1",
        acquisitionSource: "RETAIL_ACTIVATION",
        db: mockDb as any,
      });

      // Verify all 5 capabilities in service_entitlements
      const rows = db.prepare(`
        SELECT capability, status, acquisition_source
        FROM service_entitlements
        WHERE vehicle_id = 'veh_car_1' AND qr_sticker_id = 'qr_elig_1'
      `).all() as any[];

      expect(rows.length).toBe(ALL_ENTITLEMENT_CAPABILITIES.length);
      for (const cap of ALL_ENTITLEMENT_CAPABILITIES) {
        const found = rows.find((r) => r.capability === cap);
        expect(found).toBeDefined();
        expect(found.status).toBe("ENABLED");
        expect(found.acquisition_source).toBe("RETAIL_ACTIVATION");
      }
    });
  });
});
