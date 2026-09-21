import { describe, it, expect, beforeEach } from "vitest";
import { DatabaseSync } from "node:sqlite";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  generateScratchSecret,
  hashScratchSecret,
  verifyScratchSecret,
  timingSafeEqualHex,
  isSecretConsumed,
  isSecretLocked,
  evaluateSecretAttemptEligibility,
  calculateNextLockout,
  MAX_CONSECUTIVE_FAILED_ATTEMPTS,
  LOCKOUT_DURATION_MINUTES,
  SCRATCH_SECRET_ALPHABET,
  formatVisibleCode,
} from "@vaahansafe/qr-core";
import {
  D1QrActivationSecretRepository,
  D1QrActivationAttemptRepository,
  type DatabaseClient,
} from "@vaahansafe/database";
import { redactSensitiveData, sanitizeString } from "@vaahansafe/observability";

describe("Phase 08 Stage C: QR Secret Security & Threat Mitigation", () => {
  let db: DatabaseSync;
  let client: DatabaseClient;
  let secretRepo: D1QrActivationSecretRepository;
  let attemptRepo: D1QrActivationAttemptRepository;

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

    client = {
      async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
        return db.prepare(sql).all(...params) as T[];
      },
      async queryFirst<T>(sql: string, params: unknown[] = []): Promise<T | null> {
        const rows = db.prepare(sql).all(...params) as T[];
        return rows.length > 0 ? (rows[0] as T) : null;
      },
      async execute(sql: string, params: unknown[] = []): Promise<{ success: boolean; rowsAffected?: number }> {
        const info = db.prepare(sql).run(...params);
        return { success: true, rowsAffected: Number(info.changes) };
      },
      async batch(ops: Array<{ sql: string; params?: unknown[] }>): Promise<boolean> {
        for (const op of ops) {
          db.prepare(op.sql).run(...(op.params || []));
        }
        return true;
      },
    };

    secretRepo = new D1QrActivationSecretRepository(client);
    attemptRepo = new D1QrActivationAttemptRepository(client);
  });

  describe("01. Cryptographic Scratch Secret Generation", () => {
    it("generates high-entropy secrets strictly using unambiguous alphanumeric alphabet", () => {
      const secret = generateScratchSecret(10);
      expect(secret.length).toBe(10);

      // Verify no ambiguous characters (0, O, 1, I)
      for (const char of secret) {
        expect(SCRATCH_SECRET_ALPHABET.includes(char)).toBe(true);
        expect(["0", "O", "1", "I"].includes(char)).toBe(false);
      }
    });

    it("generates unique, unpredictable secrets across a batch sample", () => {
      const secrets = new Set<string>();
      for (let i = 0; i < 100; i++) {
        secrets.add(generateScratchSecret(10));
      }
      expect(secrets.size).toBe(100);
    });

    it("enforces minimum length of 8 characters for cryptographic security", () => {
      expect(() => generateScratchSecret(7)).toThrow(/at least 8 characters/);
    });
  });

  describe("02. Versioned Salted Hashing & Constant-Time Verification", () => {
    it("hashes scratch secret with salt and produces versioned digest", async () => {
      const plaintext = "7K9M2P4X8Q";
      const { secretHash, hashVersion, salt } = await hashScratchSecret(plaintext);

      expect(hashVersion).toBe("v1");
      expect(salt.length).toBe(32); // 16 bytes hex
      expect(secretHash).toContain(":");
      expect(secretHash.startsWith(`${salt}:`)).toBe(true);
      expect(secretHash).not.toContain(plaintext); // Never contains plaintext
    });

    it("verifies correct secret with constant-time comparison and case insensitivity", async () => {
      const plaintext = "7K9M2P4X8Q";
      const { secretHash, hashVersion } = await hashScratchSecret(plaintext);

      // Exact match
      expect(await verifyScratchSecret(plaintext, secretHash, hashVersion)).toBe(true);

      // Lowercase input should match (case-insensitive)
      expect(await verifyScratchSecret(plaintext.toLowerCase(), secretHash, hashVersion)).toBe(true);

      // Incorrect secret fails
      expect(await verifyScratchSecret("WRONGSECRET", secretHash, hashVersion)).toBe(false);

      // Empty secret fails
      expect(await verifyScratchSecret("", secretHash, hashVersion)).toBe(false);
    });

    it("performs constant-time string comparison preventing timing leakage", () => {
      expect(timingSafeEqualHex("abc123", "abc123")).toBe(true);
      expect(timingSafeEqualHex("abc123", "abc124")).toBe(false);
      expect(timingSafeEqualHex("abc123", "abc12")).toBe(false);
    });
  });

  describe("03. Threat Model: Shelf-Photo Attack Resistance", () => {
    it("proves publicId and visibleCode alone CANNOT verify or activate the sticker", async () => {
      const publicId = "7F3K9021";
      const visibleCode = formatVisibleCode(publicId); // "VS-7F3K-9021"
      const realScratchSecret = "9X2M7K4P8Q";

      const { secretHash } = await hashScratchSecret(realScratchSecret);

      // Attacker tries visible code as secret
      const attempt1 = await verifyScratchSecret(visibleCode, secretHash);
      expect(attempt1).toBe(false);

      // Attacker tries publicId as secret
      const attempt2 = await verifyScratchSecret(publicId, secretHash);
      expect(attempt2).toBe(false);

      // Attacker tries common defaults
      const attempt3 = await verifyScratchSecret("123456", secretHash);
      expect(attempt3).toBe(false);

      // Only the real scratch secret succeeds
      const legitimateAttempt = await verifyScratchSecret(realScratchSecret, secretHash);
      expect(legitimateAttempt).toBe(true);
    });
  });

  describe("04. Threat Model: Consumed Secret Reuse Prevention", () => {
    it("strictly rejects verification once a secret has been consumed by an activation transaction", async () => {
      const consumedAt = "2026-09-01T10:00:00Z";
      const eligibility = evaluateSecretAttemptEligibility(consumedAt, null);

      expect(eligibility.canAttempt).toBe(false);
      expect(eligibility.errorCode).toBe("SECRET_CONSUMED");
      expect(isSecretConsumed(consumedAt)).toBe(true);
      expect(isSecretConsumed(null)).toBe(false);
    });
  });

  describe("05. Threat Model: Brute-Force & Temporary Lockout Policy", () => {
    it("increments failure count and triggers 15-minute lock at 5 consecutive failed attempts", () => {
      const now = new Date("2026-09-17T12:00:00Z");

      // Attempts 1 to 4 do not lock
      let state = calculateNextLockout(0, now);
      expect(state.newFailedAttempts).toBe(1);
      expect(state.isNewlyLocked).toBe(false);
      expect(state.lockedUntil).toBeNull();

      state = calculateNextLockout(3, now);
      expect(state.newFailedAttempts).toBe(4);
      expect(state.isNewlyLocked).toBe(false);

      // 5th attempt triggers lockout
      state = calculateNextLockout(4, now);
      expect(state.newFailedAttempts).toBe(MAX_CONSECUTIVE_FAILED_ATTEMPTS);
      expect(state.isNewlyLocked).toBe(true);
      expect(state.lockedUntil).toBeDefined();

      const expectedLockTime = new Date(now.getTime() + LOCKOUT_DURATION_MINUTES * 60 * 1000).toISOString();
      expect(state.lockedUntil).toBe(expectedLockTime);
    });

    it("rejects verification attempts when locked with a generic message without leaking thresholds", () => {
      const now = new Date("2026-09-17T12:00:00Z");
      const lockedUntil = new Date("2026-09-17T12:15:00Z").toISOString();

      expect(isSecretLocked(lockedUntil, now)).toBe(true);

      const eligibility = evaluateSecretAttemptEligibility(null, lockedUntil, now);
      expect(eligibility.canAttempt).toBe(false);
      expect(eligibility.errorCode).toBe("SECRET_LOCKED");
      expect(eligibility.errorMessage).not.toContain("5"); // Never disclose threshold
      expect(eligibility.errorMessage).toContain("temporarily locked");

      // Once lockout duration expires, attempts become eligible again
      const afterExpiry = new Date("2026-09-17T12:16:00Z");
      expect(isSecretLocked(lockedUntil, afterExpiry)).toBe(false);
      expect(evaluateSecretAttemptEligibility(null, lockedUntil, afterExpiry).canAttempt).toBe(true);
    });
  });

  describe("06. D1 Database Storage Invariants: Zero Plaintext in Database", () => {
    it("stores only secret_hash in D1 and records audit attempts without plaintext secrets", async () => {
      // 1. Setup batch and sticker
      const batchId = "batch_sec_001";
      const qrId = "qr_sec_001";
      const publicId = "7F3K9021";
      const plaintextSecret = "9X2M7K4P8Q";

      db.prepare(
        `INSERT INTO qr_batches (id, reference_code, quantity, status)
         VALUES (?, 'LOT-SEC-01', 1, 'GENERATED')`
      ).run(batchId);

      db.prepare(
        `INSERT INTO qr_stickers (id, public_id, visible_code, batch_id, status)
         VALUES (?, ?, 'VS-7F3K-9021', ?, 'PRINTED')`
      ).run(qrId, publicId, batchId);

      // 2. Hash and store secret
      const { secretHash, hashVersion } = await hashScratchSecret(plaintextSecret);
      await secretRepo.saveSecret({
        qrId,
        secretHash,
        hashVersion,
      });

      // 3. Assert D1 table stores ONLY secret_hash
      const row = db.prepare("SELECT * FROM qr_activation_secrets WHERE qr_id = ?").get(qrId) as Record<string, unknown>;
      expect(row.secret_hash).toBe(secretHash);
      expect(row.hash_version).toBe("v1");
      expect(row.consumed_at).toBeNull();
      expect(row.failed_attempts).toBe(0);
      // Plaintext is NEVER present in database columns
      expect(Object.values(row).includes(plaintextSecret)).toBe(false);

      // 4. Record failed attempt
      await attemptRepo.recordAttempt({
        qrId,
        outcome: "INVALID_SECRET",
        failureReasonCode: "SECRET_MISMATCH",
        ipHash: "hash_test_ip",
      });

      const attemptCount = await attemptRepo.countRecentAttempts(qrId, 3600);
      expect(attemptCount).toBe(1);

      // 5. Consume secret and verify DB record
      const consumed = await secretRepo.consumeSecret(qrId);
      expect(consumed.consumedAt).toBeDefined();

      const consumedRow = db.prepare("SELECT consumed_at FROM qr_activation_secrets WHERE qr_id = ?").get(qrId) as { consumed_at: string };
      expect(consumedRow.consumed_at).not.toBeNull();
    });
  });

  describe("07. Observability & Log Redaction Invariant", () => {
    it("ensures scratch secrets and codes are never emitted in logs or error payloads", () => {
      const sensitivePayload = {
        qrId: "qr_123",
        scratchSecret: "9X2M7K4P8Q",
        scratchCode: "9X2M7K4P8Q",
        token: "tok_secret_123",
        publicId: "7F3K9021",
        visibleCode: "VS-7F3K-9021",
      };

      const redacted = redactSensitiveData(sensitivePayload);

      expect(redacted.scratchSecret).toBe("[REDACTED]");
      expect(redacted.scratchCode).toBe("[REDACTED]");
      expect(redacted.token).toBe("[REDACTED]");
      // Public ID and visible code are public references, not secrets
      expect(redacted.publicId).toBe("7F3K9021");
      expect(redacted.visibleCode).toBe("VS-7F3K-9021");

      // URL parameters
      const urlWithSecret = "https://example.com/activate?scratchCode=9X2M7K4P8Q&publicId=7F3K9021";
      expect(sanitizeString(urlWithSecret)).toBe("https://example.com/activate?scratchCode=[REDACTED]&publicId=7F3K9021");
    });
  });
});
