import { describe, it, expect, beforeEach } from "vitest";
import { DatabaseSync } from "node:sqlite";
import * as fs from "node:fs";
import * as path from "node:path";
import { D1SessionRepository, type DatabaseClient } from "@vaahansafe/database";
import {
  generateRawSessionToken,
  hashSessionToken,
  issueSession,
  rotateSession,
  validateSessionToken,
  serializeSessionCookie,
  serializeAdminSessionCookie,
  serializeClearSessionCookie,
  parseSessionCookie,
  CUSTOMER_SESSION_COOKIE_NAME,
  ADMIN_SESSION_COOKIE_NAME,
  createStepUpChallenge,
  verifyStepUpChallenge,
} from "@vaahansafe/auth";

describe("Section 7.3: Session Design, Lifecycle & Step-Up Security", () => {
  let db: DatabaseSync;
  let client: DatabaseClient;
  let sessionRepo: D1SessionRepository;
  const testUserId = "usr_session_tester";

  beforeEach(() => {
    db = new DatabaseSync(":memory:");
    db.exec("PRAGMA foreign_keys = ON;");

    const cfD1Dir = path.resolve(__dirname, "../infrastructure/cloudflare/d1");
    const migrationsDir = fs.existsSync(path.join(cfD1Dir, "migrations"))
      ? path.join(cfD1Dir, "migrations")
      : path.resolve(__dirname, "../database/migrations");

    const sql = fs.readFileSync(path.join(migrationsDir, "0001_identity.sql"), "utf8");
    db.exec(sql);

    // Insert dummy user for foreign key constraint
    db.prepare(
      `INSERT INTO users (id, primary_phone, onboarding_status, status)
       VALUES (?, '+919999900000', 'COMPLETED', 'ACTIVE')`
    ).run(testUserId);

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

    sessionRepo = new D1SessionRepository(client);
  });

  it("persists hashed session tokens and never stores plaintext bearer tokens in D1", async () => {
    const rawToken = generateRawSessionToken();
    expect(rawToken.length).toBe(64); // 256-bit hex

    const expectedHash = await hashSessionToken(rawToken);
    expect(expectedHash.length).toBe(64);
    expect(expectedHash).not.toBe(rawToken);

    const issueResult = await issueSession(testUserId, sessionRepo, {
      userAgent: "Mozilla/5.0 TestBrowser",
      ipAddress: "203.0.113.195",
    });

    expect(issueResult.rawToken).toBeDefined();
    expect(issueResult.session.tokenHash).toBeDefined();

    // Verify DB stores ONLY token_hash, not the rawToken
    const dbRow = db.prepare("SELECT token_hash FROM sessions WHERE id = ?").get(issueResult.session.id) as {
      token_hash: string;
    };
    expect(dbRow.token_hash).toBe(issueResult.session.tokenHash);
    expect(dbRow.token_hash).not.toBe(issueResult.rawToken);

    // Ensure rawToken hashes to the stored token_hash
    const computed = await hashSessionToken(issueResult.rawToken);
    expect(computed).toBe(dbRow.token_hash);
  });

  it("rotates session after login and privilege changes", async () => {
    // 1. Initial session
    const firstSession = await issueSession(testUserId, sessionRepo, { userAgent: "Browser 1" });
    const firstRawToken = firstSession.rawToken;

    // Validate first session works
    const validated1 = await validateSessionToken(firstRawToken, sessionRepo);
    expect(validated1).not.toBeNull();
    expect(validated1?.id).toBe(firstSession.session.id);

    // 2. Rotate session (privilege escalation / login)
    const rotated = await rotateSession(firstRawToken, testUserId, sessionRepo, { userAgent: "Browser 1" });
    const secondRawToken = rotated.rawToken;

    // Old session should be revoked with reason 'ROTATED'
    const oldSessionInDb = db.prepare("SELECT revoked_at, revocation_reason FROM sessions WHERE id = ?").get(
      firstSession.session.id
    ) as { revoked_at: string | null; revocation_reason: string | null };
    expect(oldSessionInDb.revoked_at).not.toBeNull();
    expect(oldSessionInDb.revocation_reason).toBe("ROTATED");

    // Old raw token no longer authenticates
    const validatedOld = await validateSessionToken(firstRawToken, sessionRepo);
    expect(validatedOld).toBeNull();

    // New raw token authenticates successfully
    const validatedNew = await validateSessionToken(secondRawToken, sessionRepo);
    expect(validatedNew).not.toBeNull();
    expect(validatedNew?.id).toBe(rotated.session.id);
  });

  it("serializes and parses secure HttpOnly, SameSite browser cookies", () => {
    const rawToken = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

    // 1. Customer Cookie
    const customerCookie = serializeSessionCookie(rawToken);
    expect(customerCookie).toContain("vs_session=");
    expect(customerCookie).toContain("HttpOnly");
    expect(customerCookie).toContain("Secure");
    expect(customerCookie).toContain("SameSite=Lax");
    expect(customerCookie).toContain("Max-Age=2592000"); // 30 days
    expect(customerCookie).toContain("Path=/");

    // 2. Admin Cookie (shorter idle timeout: 4 hours, SameSite=Strict)
    const adminCookie = serializeAdminSessionCookie(rawToken);
    expect(adminCookie).toContain("vs_admin_session=");
    expect(adminCookie).toContain("HttpOnly");
    expect(adminCookie).toContain("Secure");
    expect(adminCookie).toContain("SameSite=Strict");
    expect(adminCookie).toContain("Max-Age=14400"); // 4 hours

    // 3. Clear Cookie
    const clearCookie = serializeClearSessionCookie(CUSTOMER_SESSION_COOKIE_NAME);
    expect(clearCookie).toContain("vs_session=");
    expect(clearCookie).toContain("Max-Age=0");
    expect(clearCookie).toContain("Expires=Thu, 01 Jan 1970 00:00:00 GMT");

    // 4. Parse incoming Cookie header
    const cookieHeader = `theme=dark; ${CUSTOMER_SESSION_COOKIE_NAME}=${rawToken}; other=123`;
    const parsed = parseSessionCookie(cookieHeader, CUSTOMER_SESSION_COOKIE_NAME);
    expect(parsed).toBe(rawToken);
  });

  it("supports 'log out this device' and 'log out all devices'", async () => {
    // Issue 3 sessions for same user across different devices
    const device1 = await issueSession(testUserId, sessionRepo, { userAgent: "Mobile Device" });
    const device2 = await issueSession(testUserId, sessionRepo, { userAgent: "Laptop" });
    const device3 = await issueSession(testUserId, sessionRepo, { userAgent: "Tablet" });

    // 1. Log out this device (device 1 only)
    const hash1 = await hashSessionToken(device1.rawToken);
    await sessionRepo.revokeSession(hash1, "USER_LOGOUT");

    expect(await validateSessionToken(device1.rawToken, sessionRepo)).toBeNull();
    expect(await validateSessionToken(device2.rawToken, sessionRepo)).not.toBeNull();
    expect(await validateSessionToken(device3.rawToken, sessionRepo)).not.toBeNull();

    // 2. Log out all devices
    const revokedCount = await sessionRepo.revokeAllUserSessions(testUserId, "LOGOUT_ALL_DEVICES");
    expect(revokedCount).toBe(2); // device2 and device3

    expect(await validateSessionToken(device2.rawToken, sessionRepo)).toBeNull();
    expect(await validateSessionToken(device3.rawToken, sessionRepo)).toBeNull();
  });

  it("enforces step-up OTP challenge for sensitive actions (phone change, QR transfer, account deletion)", async () => {
    const { challenge, plaintextOtp } = await createStepUpChallenge(
      testUserId,
      "PHONE_CHANGE",
      "PHONE",
      "+919999900000"
    );

    expect(plaintextOtp).toMatch(/^\d{6}$/);
    expect(challenge.codeHash).not.toBe(plaintextOtp);
    expect(challenge.purpose).toBe("PHONE_CHANGE");
    expect(challenge.verifiedAt).toBeUndefined();

    // Wrong OTP attempt
    const failedAttempt = await verifyStepUpChallenge(challenge, "000000");
    expect(failedAttempt.success).toBe(false);
    expect(failedAttempt.error).toBe("Invalid verification code");
    expect(failedAttempt.challenge.attempts).toBe(1);

    // Correct OTP verification
    const successResult = await verifyStepUpChallenge(failedAttempt.challenge, plaintextOtp);
    expect(successResult.success).toBe(true);
    expect(successResult.challenge.verifiedAt).toBeDefined();

    // Attempting to reuse consumed challenge
    const reuseAttempt = await verifyStepUpChallenge(successResult.challenge, plaintextOtp);
    expect(reuseAttempt.success).toBe(false);
    expect(reuseAttempt.error).toBe("Step-up challenge has already been consumed");
  });
});
