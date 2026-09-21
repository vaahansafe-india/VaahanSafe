import { describe, it, expect, beforeEach } from "vitest";
import { DatabaseSync } from "node:sqlite";
import * as fs from "node:fs";
import * as path from "node:path";
import { D1UserRepository, D1AuthIdentityRepository, type DatabaseClient } from "@vaahansafe/database";
import type { AuditRepository, AuditRecord } from "@vaahansafe/types";
import {
  handleMobileEntry,
  handleGoogleEntry,
  verifyMobileForGoogleUser,
  attachGoogleToExistingUser,
  initiateDuplicatePhoneResolution,
  AccountLinkingConflictError,
} from "@vaahansafe/auth";

describe("Section 7.5: Account Linking & Duplicate Conflict Resolution", () => {
  let db: DatabaseSync;
  let client: DatabaseClient;
  let userRepo: D1UserRepository;
  let identityRepo: D1AuthIdentityRepository;
  let auditLogs: AuditRecord[];
  let auditRepo: AuditRepository;

  beforeEach(() => {
    db = new DatabaseSync(":memory:");
    db.exec("PRAGMA foreign_keys = ON;");

    const cfD1Dir = path.resolve(__dirname, "../infrastructure/cloudflare/d1");
    const migrationsDir = fs.existsSync(path.join(cfD1Dir, "migrations"))
      ? path.join(cfD1Dir, "migrations")
      : path.resolve(__dirname, "../database/migrations");

    const sql = fs.readFileSync(path.join(migrationsDir, "0001_identity.sql"), "utf8");
    db.exec(sql);

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

    auditLogs = [];
    auditRepo = {
      async record(audit: AuditRecord): Promise<void> {
        auditLogs.push(audit);
      },
    };
  });

  it("attaches Google identity to an existing phone-first account without modifying user_id", async () => {
    // 1. User starts with Mobile
    const phoneUserResult = await handleMobileEntry("+919876543210", userRepo, identityRepo);
    const userId = phoneUserResult.user.id;

    // 2. Later, user connects Google in account settings
    const googleIdentity = {
      sub: "google-sub-user1",
      email: "user1@example.com",
    };

    const linkResult = await attachGoogleToExistingUser(
      userId,
      googleIdentity,
      identityRepo,
      userRepo,
      auditRepo
    );

    expect(linkResult.success).toBe(true);
    expect(linkResult.user.id).toBe(userId);
    expect(linkResult.user.email).toBe("user1@example.com");

    // Identities in DB should now have both PHONE and GOOGLE for the same user_id
    const identities = await identityRepo.findByUserId(userId);
    expect(identities.length).toBe(2);
    expect(identities.some((i) => i.provider === "PHONE" && i.providerSubject === "+919876543210")).toBe(true);
    expect(identities.some((i) => i.provider === "GOOGLE" && i.providerSubject === "google-sub-user1")).toBe(true);

    // Audit log should capture identity attachment
    expect(auditLogs.length).toBe(1);
    expect(auditLogs[0]?.action).toBe("AUTH_IDENTITY_LINKED");
    expect(auditLogs[0]?.actorId).toBe(userId);
  });

  it("rejects attaching Google identity if it is already bound to a different user account", async () => {
    // User A creates account via Google
    const userA = await handleGoogleEntry(
      { sub: "google-sub-unique", email: "usera@example.com", name: "User A" },
      userRepo,
      identityRepo
    );

    // User B creates account via Phone
    const userB = await handleMobileEntry("+919123456789", userRepo, identityRepo);

    // User B attempts to attach User A's Google identity
    await expect(
      attachGoogleToExistingUser(
        userB.user.id,
        { sub: "google-sub-unique", email: "usera@example.com" },
        identityRepo,
        userRepo,
        auditRepo
      )
    ).rejects.toThrow(AccountLinkingConflictError);
  });

  it("ANTI-AUTO-MERGE: When Google-first user verifies a phone already linked to another account, do NOT auto-merge", async () => {
    // 1. User A already exists with phone +919876500000
    const userA = await handleMobileEntry("+919876500000", userRepo, identityRepo);
    const userAId = userA.user.id;

    // 2. User B signs in with Google (google-sub-userb)
    const userB = await handleGoogleEntry(
      { sub: "google-sub-userb", email: "userb@example.com", name: "User B" },
      userRepo,
      identityRepo
    );
    const userBId = userB.user.id;
    expect(userBId).not.toBe(userAId);
    expect(userB.user.onboardingState).toBe("PHONE_REQUIRED");

    // 3. User B attempts to verify the phone number already owned by User A (+919876500000)
    const verifyResult = await verifyMobileForGoogleUser(
      userBId,
      "+919876500000",
      userRepo,
      identityRepo
    );

    // CRITICAL INVARIANT: DO NOT AUTO-MERGE!
    expect(verifyResult.success).toBe(false);
    expect(verifyResult.conflict).toBe(true);
    expect(verifyResult.error).toBe("DUPLICATE_PHONE_CONFLICT");
    expect(verifyResult.existingUserId).toBe(userAId);

    // Verify User A still owns their phone identity and was not overwritten or hijacked
    const userAIdentities = await identityRepo.findByUserId(userAId);
    expect(userAIdentities.some((i) => i.provider === "PHONE" && i.providerSubject === "+919876500000")).toBe(true);

    // Verify User B still has only GOOGLE identity, not merged
    const userBIdentities = await identityRepo.findByUserId(userBId);
    expect(userBIdentities.length).toBe(1);
    expect(userBIdentities[0]?.provider).toBe("GOOGLE");

    // 4. Initiates controlled duplicate-resolution flow with audit logging
    const resolutionTicket = await initiateDuplicatePhoneResolution(
      userBId,
      "+919876500000",
      identityRepo,
      userRepo,
      auditRepo
    );

    expect(resolutionTicket.ticketId).toMatch(/^dup_/);
    expect(resolutionTicket.currentUserId).toBe(userBId);
    expect(resolutionTicket.conflictingUserId).toBe(userAId);
    expect(resolutionTicket.status).toBe("REQUIRES_PRIMARY_STEPUP_VERIFICATION");

    // Verify security audit record
    const auditRecord = auditLogs.find((l) => l.action === "DUPLICATE_PHONE_CONFLICT_DETECTED");
    expect(auditRecord).toBeDefined();
    expect(auditRecord?.actorId).toBe(userBId);
    expect(auditRecord?.resourceId).toBe(userAId);
  });
});
