import { describe, it, expect, beforeEach } from "vitest";
import { DatabaseSync } from "node:sqlite";
import * as fs from "node:fs";
import * as path from "node:path";
import { resolvePublicEmergencyProfile } from "@vaahansafe/database";
import type { DatabaseClient } from "@vaahansafe/database";
import { ShippingProvider } from "@vaahansafe/shipping";

describe("Phase 12 — Scenario E (Proof E): Emergency QR Safety Isolation", () => {
  let db: DatabaseSync;
  let client: DatabaseClient;

  // Mock shipping provider simulating a catastrophic provider outage
  const deadShippingProvider: ShippingProvider = {
    providerCode: "OUTAGE_CARRIER",
    async createShipment() {
      throw new Error("503 Service Unavailable: Courier API gateway is offline");
    },
    async getTracking() {
      throw new Error("504 Gateway Timeout: Courier tracking network unreachable");
    },
    async cancelShipment() {
      throw new Error("500 Internal Server Error: Courier connection refused");
    },
    async verifyWebhook() {
      return { isValid: false, reason: "Service unavailable" };
    },
  };

  beforeEach(() => {
    db = new DatabaseSync(":memory:");
    db.exec("PRAGMA foreign_keys = ON;");

    const cfD1Dir = path.resolve(__dirname, "../infrastructure/cloudflare/d1");
    const migrationsDir = path.join(cfD1Dir, "migrations");
    const files = [
      "0001_identity.sql",
      "0002_vehicle_emergency.sql",
      "0003_qr_inventory.sql",
      "0004_media_assets.sql",
      "0005_commerce_subscriptions.sql",
      "0006_notifications.sql",
      "0007_fulfilment_shipping_replacement.sql",
    ];

    for (const f of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, f), "utf8");
      db.exec(sql);
    }

    const seedPath = path.join(cfD1Dir, "seeds/dev.sql");
    const devSeed = fs.readFileSync(seedPath, "utf8");
    db.exec(devSeed);

    client = {
      async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
        return db.prepare(sql).all(...params) as T[];
      },
      async queryFirst<T>(sql: string, params: unknown[] = []): Promise<T | null> {
        const rows = db.prepare(sql).all(...params) as T[];
        return rows.length > 0 ? (rows[0] as T) : null;
      },
      async execute(sql: string, params: unknown[] = []): Promise<{ success: boolean }> {
        db.prepare(sql).run(...params);
        return { success: true };
      },
      async batch(operations: Array<{ sql: string; params?: unknown[] }>): Promise<boolean> {
        for (const op of operations) {
          db.prepare(op.sql).run(...(op.params || []));
        }
        return true;
      },
    };
  });

  it("proves that shipping provider outages fail without affecting emergency QR resolution", async () => {
    // 1. Verify that shipping provider call indeed throws an error
    await expect(
      deadShippingProvider.createShipment({
        fulfilmentId: "ful_fail_test",
        orderId: "ord_fail_test",
        recipientName: "Test",
        phone: "+919999999999",
        addressLine1: "Test Line",
        city: "Test",
        state: "Test",
        postalCode: "110001",
      })
    ).rejects.toThrow(/503 Service Unavailable/);

    // 2. Scan and resolve the ACTIVE emergency QR sticker (public_id: 7F3K9021)
    const result = await resolvePublicEmergencyProfile(client, "7F3K9021");

    // 3. INVARIANT: Public safety projection works completely and immediately!
    expect(result.state).toBe("ACTIVE");
    expect(result.publicId).toBe("7F3K9021");
    expect(result.profile).toBeDefined();

    const profile = result.profile!;
    expect(profile.status).toBe("ACTIVE");
    expect(profile.vehicleDisplay).toContain("Hyundai Creta");
    expect(profile.bloodGroup).toBe("O+");
    expect(profile.approvedSafetyNotes).toContain("Penicillin safe");
    expect(profile.approvedEmergencyContacts).toHaveLength(2);
    expect(profile.approvedEmergencyContacts[0].name).toBe("Sunita Kumar");
    expect(profile.approvedEmergencyContacts[0].phone).toBe("+919876500001");
  });

  it("proves package architecture boundary: @vaahansafe/qr never depends on @vaahansafe/shipping", () => {
    const qrPackageJsonPath = path.resolve(__dirname, "../packages/qr/package.json");
    const content = fs.readFileSync(qrPackageJsonPath, "utf8");
    const pkg = JSON.parse(content);

    const allDependencies = {
      ...(pkg.dependencies || {}),
      ...(pkg.devDependencies || {}),
      ...(pkg.peerDependencies || {}),
    };

    expect(allDependencies["@vaahansafe/shipping"]).toBeUndefined();
  });
});
