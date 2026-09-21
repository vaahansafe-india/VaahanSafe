import { describe, it, expect, beforeEach } from "vitest";
import { DatabaseSync } from "node:sqlite";
import * as fs from "node:fs";
import * as path from "node:path";
import { D1UserRepository, D1AuthIdentityRepository, type DatabaseClient } from "@vaahansafe/database";
import {
  handleMobileEntry,
  handleGoogleEntry,
  verifyMobileForGoogleUser,
  completeUserProfile,
} from "@vaahansafe/auth";

describe("Section 7.1 & 7.2: First-Login Rules & Unified Identity", () => {
  let db: DatabaseSync;
  let client: DatabaseClient;
  let userRepo: D1UserRepository;
  let identityRepo: D1AuthIdentityRepository;

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

    userRepo = new D1UserRepository(client);
    identityRepo = new D1AuthIdentityRepository(client);
  });

  it("7.1 Mobile-First Flow: Creates account directly in PROFILE_REQUIRED, never asks to verify mobile again", async () => {
    const rawMobile = "9876543210";

    // 1. User enters mobile -> MSG91 OTP verified
    const loginResult = await handleMobileEntry(rawMobile, userRepo, identityRepo);

    expect(loginResult.isNewUser).toBe(true);
    expect(loginResult.user.id).toMatch(/^usr_/);
    expect(loginResult.user.phone).toBe("+919876543210");
    // INVARIANT: Starts directly in PROFILE_REQUIRED, NOT PHONE_REQUIRED
    expect(loginResult.user.onboardingState).toBe("PROFILE_REQUIRED");
    expect(loginResult.nextStep).toBe("COMPLETE_PROFILE");

    // Check DB record for auth_identity
    const identities = await identityRepo.findByUserId(loginResult.user.id);
    expect(identities.length).toBe(1);
    expect(identities[0]?.provider).toBe("PHONE");
    expect(identities[0]?.providerSubject).toBe("+919876543210");
    expect(identities[0]?.verifiedAt).toBeDefined();

    // 2. Subsequent mobile login by the same user returns existing user and never asks to verify mobile again
    const subsequentLogin = await handleMobileEntry(rawMobile, userRepo, identityRepo);
    expect(subsequentLogin.isNewUser).toBe(false);
    expect(subsequentLogin.user.id).toBe(loginResult.user.id);
    expect(subsequentLogin.nextStep).toBe("COMPLETE_PROFILE");

    // 3. User completes profile -> APP_READY
    const profileResult = await completeUserProfile(
      loginResult.user.id,
      {
        name: "Rahul Sharma",
        termsAccepted: true,
        privacyAccepted: true,
      },
      userRepo
    );

    expect(profileResult.nextStep).toBe("APP_READY");
    expect(profileResult.user.onboardingState).toBe("COMPLETED");
    expect(profileResult.user.name).toBe("Rahul Sharma");
    expect(profileResult.user.termsAcceptedAt).toBeDefined();

    // 4. Now on any re-login with mobile, state is APP_READY
    const readyLogin = await handleMobileEntry(rawMobile, userRepo, identityRepo);
    expect(readyLogin.nextStep).toBe("APP_READY");
    expect(readyLogin.user.onboardingState).toBe("COMPLETED");
  });

  it("7.1 Google-First Flow: Requires mobile verification before profile completion and app access", async () => {
    const googleId = {
      sub: "google-sub-998877",
      email: "priya.verma@example.com",
      name: "Priya Verma",
    };

    // 1. Continue with Google -> Google identity verified
    const googleResult = await handleGoogleEntry(googleId, userRepo, identityRepo);
    expect(googleResult.isNewUser).toBe(true);
    expect(googleResult.user.id).toMatch(/^usr_/);
    expect(googleResult.user.email).toBe("priya.verma@example.com");
    // INVARIANT: Google-authenticated account starts in PHONE_REQUIRED
    expect(googleResult.user.onboardingState).toBe("PHONE_REQUIRED");
    expect(googleResult.nextStep).toBe("VERIFY_MOBILE");

    const identities = await identityRepo.findByUserId(googleResult.user.id);
    expect(identities.length).toBe(1);
    expect(identities[0]?.provider).toBe("GOOGLE");
    expect(identities[0]?.providerSubject).toBe("google-sub-998877");

    // 2. Mobile required -> MSG91 OTP verified
    const mobileVerifyResult = await verifyMobileForGoogleUser(
      googleResult.user.id,
      "+919811122233",
      userRepo,
      identityRepo
    );

    expect(mobileVerifyResult.success).toBe(true);
    expect(mobileVerifyResult.nextStep).toBe("COMPLETE_PROFILE");
    expect(mobileVerifyResult.user?.onboardingState).toBe("PROFILE_REQUIRED");
    expect(mobileVerifyResult.user?.phone).toBe("+919811122233");

    // Identity now contains both GOOGLE and PHONE
    const updatedIdentities = await identityRepo.findByUserId(googleResult.user.id);
    expect(updatedIdentities.length).toBe(2);
    expect(updatedIdentities.some((i) => i.provider === "PHONE")).toBe(true);
    expect(updatedIdentities.some((i) => i.provider === "GOOGLE")).toBe(true);

    // 3. Complete profile -> APP READY
    const finalResult = await completeUserProfile(
      googleResult.user.id,
      {
        name: "Priya Verma",
        termsAccepted: true,
        privacyAccepted: true,
      },
      userRepo
    );

    expect(finalResult.nextStep).toBe("APP_READY");
    expect(finalResult.user.onboardingState).toBe("COMPLETED");
  });

  it("7.2 Unified Identity: user_id is the authoritative foreign key across vehicles and sessions", async () => {
    // Create user
    const mobileResult = await handleMobileEntry("9988776655", userRepo, identityRepo);
    const userId = mobileResult.user.id;

    // Attach vehicle with foreign key referencing user_id
    const vehicleId = "veh_test_01";
    db.prepare(
      `INSERT INTO vehicles (id, user_id, registration_number, registration_number_normalized, make, model, vehicle_type, created_at, updated_at)
       VALUES (?, ?, 'DL 01 AB 1234', 'DL01AB1234', 'Hyundai', 'Creta', 'CAR', datetime('now'), datetime('now'))`
    ).run(vehicleId, userId);

    // Attach session referencing user_id
    const sessionId = "ses_test_01";
    db.prepare(
      `INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at, last_seen_at)
       VALUES (?, ?, 'dummy_hash_123', datetime('now', '+30 days'), datetime('now'), datetime('now'))`
    ).run(sessionId, userId);

    // Query vehicle using unified user_id
    const vehicleRow = db.prepare("SELECT user_id FROM vehicles WHERE id = ?").get(vehicleId) as { user_id: string };
    expect(vehicleRow.user_id).toBe(userId);

    // Query session using unified user_id
    const sessionRow = db.prepare("SELECT user_id FROM sessions WHERE id = ?").get(sessionId) as { user_id: string };
    expect(sessionRow.user_id).toBe(userId);
  });
});
