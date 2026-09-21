import { describe, it, expect, beforeEach } from "vitest";
import { DatabaseSync } from "node:sqlite";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  resolvePublicQr,
  isValidPublicIdFormat,
  recordPublicScanEventSafely,
  assertSafePublicProjection,
  FORBIDDEN_PUBLIC_FIELDS,
} from "@vaahansafe/qr-core";
import type { DatabaseClient } from "@vaahansafe/database";

describe("Authoritative Public QR Resolver (@vaahansafe/qr-core & apps/qr)", () => {
  let db: DatabaseSync;
  let client: DatabaseClient;

  beforeEach(() => {
    db = new DatabaseSync(":memory:");
    db.exec("PRAGMA foreign_keys = ON;");

    const cfD1Dir = path.resolve(__dirname, "../infrastructure/cloudflare/d1");
    const migrationsDir = fs.existsSync(path.join(cfD1Dir, "migrations"))
      ? path.join(cfD1Dir, "migrations")
      : path.resolve(__dirname, "../database/migrations");

    const files = [
      "0001_identity.sql",
      "0002_vehicle_emergency.sql",
      "0003_qr_inventory.sql",
      "0004_media_assets.sql",
      "0005_commerce_subscriptions.sql",
      "0008_service_entitlements_and_idempotency.sql",
    ];

    for (const f of files) {
      const filePath = path.join(migrationsDir, f);
      if (fs.existsSync(filePath)) {
        const sql = fs.readFileSync(filePath, "utf8");
        db.exec(sql);
      }
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
      async execute(sql: string, params: unknown[] = []): Promise<{ success: boolean; rowsAffected?: number }> {
        const result = db.prepare(sql).run(...params);
        return { success: true, rowsAffected: Number(result.changes) };
      },
      async batch(): Promise<boolean> {
        return true;
      },
    };
  });

  describe("Public ID Format Validation Guard", () => {
    it("accepts valid alphanumeric, hyphenated, and underscore public IDs", () => {
      expect(isValidPublicIdFormat("7F3K9021")).toBe(true);
      expect(isValidPublicIdFormat("VS-7F3K-9021")).toBe(true);
      expect(isValidPublicIdFormat("demo_sticker_001")).toBe(true);
      expect(isValidPublicIdFormat("abc-123_XYZ")).toBe(true);
    });

    it("rejects malicious, empty, or malformed public IDs without DB query", () => {
      expect(isValidPublicIdFormat("")).toBe(false);
      expect(isValidPublicIdFormat("   ")).toBe(false);
      expect(isValidPublicIdFormat("12")).toBe(false); // too short (<3)
      expect(isValidPublicIdFormat("a".repeat(70))).toBe(false); // too long (>64)
      expect(isValidPublicIdFormat("drop table;--")).toBe(false);
      expect(isValidPublicIdFormat("id with spaces")).toBe(false);
      expect(isValidPublicIdFormat("<script>")).toBe(false);
      expect(isValidPublicIdFormat(null)).toBe(false);
      expect(isValidPublicIdFormat(undefined)).toBe(false);
    });

    it("resolves malformed public IDs immediately to UNKNOWN state", async () => {
      const result = await resolvePublicQr("bad/id/injection", { db: client });
      expect(result.state).toBe("UNKNOWN");
      expect(result.profile).toBeUndefined();
    });
  });

  describe("Lifecycle State Resolution", () => {
    it("resolves valid ACTIVATED sticker to ACTIVE with authorized public projection", async () => {
      const result = await resolvePublicQr("7F3K9021", { db: client });

      expect(result.state).toBe("ACTIVE");
      expect(result.publicId).toBe("7F3K9021");
      expect(result.visibleCode).toBe("VS-7F3K-9021");
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

    it("resolves pre-activation PRINTED status to ACTIVATION_AVAILABLE without safety profile", async () => {
      const result = await resolvePublicQr("8M2P4510", { db: client });

      expect(result.state).toBe("ACTIVATION_AVAILABLE");
      expect(result.publicId).toBe("8M2P4510");
      expect(result.visibleCode).toBe("VS-8M2P-4510");
      expect(result.profile).toBeUndefined();
      expect(result.meta.safeNextAction.url).toContain("8M2P4510");
    });

    it("resolves WITH_RETAILER status to ACTIVATION_AVAILABLE", async () => {
      const result = await resolvePublicQr("9Q4R7822", { db: client });

      expect(result.state).toBe("ACTIVATION_AVAILABLE");
      expect(result.profile).toBeUndefined();
    });

    it("resolves REPLACED status with linkage to replacement public ID", async () => {
      const result = await resolvePublicQr("2B9C1100", { db: client });

      expect(result.state).toBe("REPLACED");
      expect(result.publicId).toBe("2B9C1100");
      expect(result.replacedByPublicId).toBe("7F3K9021");
      expect(result.profile).toBeUndefined();
    });

    it("resolves LOST_DAMAGED status to safe unavailable state", async () => {
      const result = await resolvePublicQr("4D8F3344", { db: client });

      expect(result.state).toBe("LOST_DAMAGED");
      expect(result.profile).toBeUndefined();
    });

    it("resolves BLOCKED status without leaking security reasons", async () => {
      const result = await resolvePublicQr("5E9G7788", { db: client });

      expect(result.state).toBe("BLOCKED");
      expect(result.profile).toBeUndefined();
    });

    it("resolves non-existent public ID to UNKNOWN", async () => {
      const result = await resolvePublicQr("NON_EXISTENT_QR_99", { db: client });

      expect(result.state).toBe("UNKNOWN");
      expect(result.profile).toBeUndefined();
    });
  });

  describe("Privacy & Forbidden Field Boundary (Rule 11, 12, 13)", () => {
    it("CRITICAL: asserts zero private account fields are present in the serialized resolution", async () => {
      const result = await resolvePublicQr("7F3K9021", { db: client });
      expect(result.state).toBe("ACTIVE");

      const serialized = JSON.stringify(result);

      // Known sensitive account fields that exist in dev seed for Ramesh Kumar
      const forbiddenValues = [
        "ramesh.kumar@example.synthetic",
        "sha256_mock_session_token_hash_abc123",
        "sha256_mock_hash_for_demo_activated_qr",
        "Flat 402, Safety Residency",
        "Baner Road",
        "411045",
        "google_sub_ramesh_demo_98765",
        "usr_demo_101",
      ];

      for (const val of forbiddenValues) {
        expect(
          serialized.includes(val),
          `[PRIVACY INVARIANT VIOLATION] Private field "${val}" found in resolver output!`
        ).toBe(false);
      }

      // Assert runtime projection checker passes
      expect(() =>
        assertSafePublicProjection(result.profile as unknown as Record<string, unknown>)
      ).not.toThrow();

      // Check forbidden keys directly
      for (const key of FORBIDDEN_PUBLIC_FIELDS) {
        expect(key in result).toBe(false);
        expect(key in result.profile!).toBe(false);
      }
    });

    it("respects privacy toggles when owner opts out of showing name or blood group", async () => {
      // Temporarily toggle privacy flags in DB
      await client.execute(
        `UPDATE emergency_profiles 
         SET show_owner_name = 0, show_blood_group = 0, show_medical_notes = 0
         WHERE id = 'emp_demo_car'`
      );

      const result = await resolvePublicQr("7F3K9021", { db: client });
      expect(result.state).toBe("ACTIVE");
      expect(result.profile?.approvedOwnerDisplayName).toBeUndefined();
      expect(result.profile?.bloodGroup).toBeUndefined();
      expect(result.profile?.approvedSafetyNotes).toBeUndefined();
    });

    it("CRITICAL HARD GATE: blocks active profile if service entitlement is REVOKED or EXPIRED", async () => {
      // Insert a revoked entitlement
      await client.execute(
        `INSERT INTO service_entitlements (
           id, user_id, vehicle_id, qr_sticker_id, capability, status, acquisition_source
         ) VALUES ('ent_revoked_1', 'usr_demo_101', 'veh_demo_car', 'qr_active_001', 'SAFETY_VIEW_ACTIVE', 'REVOKED', 'ONLINE_PURCHASE')`
      );

      const result = await resolvePublicQr("7F3K9021", { db: client });
      expect(result.state).toBe("BLOCKED");
      expect(result.profile).toBeUndefined();
    });
  });

  describe("Telemetry Isolation (Rule 39, 40, 41)", () => {
    it("records public scan events without throwing", async () => {
      await expect(
        recordPublicScanEventSafely({
          db: client,
          qrId: "qr_active_001",
          state: "ACTIVE",
          headers: new Headers({
            "cf-ipcity": "Mumbai",
            "cf-region": "Maharashtra",
            "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
          }),
        })
      ).resolves.not.toThrow();

      const events = await client.query<{ qr_id: string; result: string; city: string }>(
        `SELECT qr_id, result, city FROM qr_scan_events WHERE qr_id = 'qr_active_001' AND city = 'Mumbai'`
      );

      expect(events.length).toBeGreaterThan(0);
      expect(events[0].result).toBe("RESOLVED_ACTIVE");
    });

    it("ignores prefetch requests from search engines and browsers", async () => {
      const before = await client.query<{ id: string }>(
        `SELECT id FROM qr_scan_events WHERE qr_id = 'qr_active_001'`
      );

      await recordPublicScanEventSafely({
        db: client,
        qrId: "qr_active_001",
        state: "ACTIVE",
        headers: new Headers({
          purpose: "prefetch",
          "user-agent": "Mozilla/5.0",
        }),
      });

      const after = await client.query<{ id: string }>(
        `SELECT id FROM qr_scan_events WHERE qr_id = 'qr_active_001'`
      );

      expect(after.length).toBe(before.length);
    });

    it("absorbs telemetry database failures without throwing or blocking", async () => {
      const brokenClient: DatabaseClient = {
        ...client,
        async execute(): Promise<{ success: boolean }> {
          throw new Error("Simulated D1 telemetry write failure");
        },
      };

      await expect(
        recordPublicScanEventSafely({
          db: brokenClient,
          qrId: "qr_active_001",
          state: "ACTIVE",
        })
      ).resolves.not.toThrow();
    });
  });
});
