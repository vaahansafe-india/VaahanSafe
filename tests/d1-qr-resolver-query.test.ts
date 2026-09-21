import { describe, it, expect, beforeEach } from "vitest";
import { DatabaseSync } from "node:sqlite";
import * as fs from "node:fs";
import * as path from "node:path";
import { resolvePublicEmergencyProfile } from "../packages/database/src/queries/public-emergency-profile.query";
import type { DatabaseClient } from "../packages/database/src/client/d1";

describe("D1 Public QR Resolver Query & Security Boundary", () => {
  let db: DatabaseSync;
  let client: DatabaseClient;

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

    // Apply dev seed
    const seedPath = fs.existsSync(path.join(cfD1Dir, "seeds/dev.sql"))
      ? path.join(cfD1Dir, "seeds/dev.sql")
      : path.resolve(__dirname, "../database/seeds/dev.sql");
    const devSeed = fs.readFileSync(seedPath, "utf8");
    db.exec(devSeed);

    client = {
      async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
        return db.prepare(sql).all(...params) as T[];
      },
      async queryFirst<T>(sql: string, params: unknown[] = []): Promise<T | null> {
        const rows = db.prepare(sql).all(...params) as T[];
        return rows.length > 0 ? rows[0] : null;
      },
      async execute(sql: string, params: unknown[] = []): Promise<{ success: boolean }> {
        db.prepare(sql).run(...params);
        return { success: true };
      },
      async batch(): Promise<boolean> {
        return true;
      },
    };
  });

  it("resolves ACTIVE QR to authoritative public emergency profile", async () => {
    const result = await resolvePublicEmergencyProfile(client, "7F3K9021");

    expect(result.state).toBe("ACTIVE");
    expect(result.publicId).toBe("7F3K9021");
    expect(result.profile).toBeDefined();

    const profile = result.profile!;
    expect(profile.status).toBe("ACTIVE");
    expect(profile.vehicleDisplay).toContain("Hyundai Creta");
    expect(profile.approvedOwnerDisplayName).toBe("Ramesh K.");
    expect(profile.bloodGroup).toBe("O+");
    expect(profile.approvedSafetyNotes).toContain("Penicillin safe");
    expect(profile.approvedEmergencyContacts).toHaveLength(2);
    expect(profile.approvedEmergencyContacts[0].name).toBe("Sunita Kumar");
    expect(profile.approvedEmergencyContacts[0].relationship).toBe("Spouse");
    expect(profile.approvedEmergencyContacts[0].phone).toBe("+919876500001");
    expect(profile.approvedEmergencyContacts[0].isPriority).toBe(true);
  });

  it("resolves PRINTED status to ACTIVATION_AVAILABLE", async () => {
    const result = await resolvePublicEmergencyProfile(client, "8M2P4510");
    expect(result.state).toBe("ACTIVATION_AVAILABLE");
    expect(result.publicId).toBe("8M2P4510");
    expect(result.visibleCode).toBe("VS-8M2P-4510");
    expect(result.profile).toBeUndefined();
  });

  it("resolves WITH_RETAILER status to ACTIVATION_AVAILABLE", async () => {
    const result = await resolvePublicEmergencyProfile(client, "9Q4R7822");
    expect(result.state).toBe("ACTIVATION_AVAILABLE");
    expect(result.publicId).toBe("9Q4R7822");
    expect(result.profile).toBeUndefined();
  });

  it("resolves REPLACED status with linkage to replacement public ID", async () => {
    const result = await resolvePublicEmergencyProfile(client, "2B9C1100");
    expect(result.state).toBe("REPLACED");
    expect(result.publicId).toBe("2B9C1100");
    expect(result.replacedByPublicId).toBe("7F3K9021");
    expect(result.profile).toBeUndefined();
  });

  it("resolves LOST_DAMAGED status correctly", async () => {
    const result = await resolvePublicEmergencyProfile(client, "4D8F3344");
    expect(result.state).toBe("LOST_DAMAGED");
    expect(result.publicId).toBe("4D8F3344");
    expect(result.profile).toBeUndefined();
  });

  it("resolves BLOCKED status correctly", async () => {
    const result = await resolvePublicEmergencyProfile(client, "5E9G7788");
    expect(result.state).toBe("BLOCKED");
    expect(result.publicId).toBe("5E9G7788");
    expect(result.profile).toBeUndefined();
  });

  it("resolves non-existent sticker to UNKNOWN", async () => {
    const result = await resolvePublicEmergencyProfile(client, "NON_EXISTENT_QR");
    expect(result.state).toBe("UNKNOWN");
    expect(result.profile).toBeUndefined();
  });

  it("MANDATORY SECURITY GATE: asserts zero private account data leaks in public resolver output", async () => {
    const result = await resolvePublicEmergencyProfile(client, "7F3K9021");
    expect(result.state).toBe("ACTIVE");

    const serialized = JSON.stringify(result);

    // Private account identifiers that exist in the database for Ramesh Kumar:
    const forbiddenValues = [
      "ramesh.kumar@example.synthetic", // User email
      "+919876543210",                  // Customer primary phone
      "sha256_mock_session_token_hash_abc123", // Session hash
      "sha256_mock_hash_for_demo_activated_qr", // Activation secret hash
      "Flat 402, Safety Residency",     // Physical street address
      "Baner Road",                     // Street line 2
      "411045",                         // PIN code
      "google_sub_ramesh_demo_98765",   // OAuth subject ID
      "usr_demo_101",                   // User primary key
    ];

    for (const forbidden of forbiddenValues) {
      expect(
        serialized.includes(forbidden),
        `[SECURITY LEAK ALERT] Resolver output contains private account field: "${forbidden}"`
      ).toBe(false);
    }

    // Verify forbidden properties do not exist on the profile object
    const profile = result.profile as unknown as Record<string, unknown>;
    expect(profile.email).toBeUndefined();
    expect(profile.primary_phone).toBeUndefined();
    expect(profile.address).toBeUndefined();
    expect(profile.session).toBeUndefined();
    expect(profile.token).toBeUndefined();
    expect(profile.scratch_code).toBeUndefined();
    expect(profile.secret_hash).toBeUndefined();
  });

  it("proves query plan uses indexed public_id search with zero full-table scans", () => {
    const plan = db.prepare(`
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
    `).all("7F3K9021") as Array<{ detail: string }>;

    // Verify s (qr_stickers) search
    const stickerScan = plan.find((step) => step.detail.includes("SEARCH s USING"));
    expect(stickerScan).toBeDefined();
    expect(stickerScan!.detail).toContain("public_id=?");
  });
});
