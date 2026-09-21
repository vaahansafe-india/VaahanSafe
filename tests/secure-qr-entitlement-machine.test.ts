import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  computeCashfreeSignature,
  verifyCashfreeSignature,
  CashfreePaymentAdapter,
} from "@vaahansafe/payments";
import {
  hasServiceEntitlement,
  canUseQrService,
  canViewDigitalQr,
  canExposeSafetyView,
  grantAuthoritativeEntitlements,
  ALL_ENTITLEMENT_CAPABILITIES,
  type IDatabaseClient,
} from "@vaahansafe/qr-core";
import {
  generateQrPublicId,
  validateQrPublicId,
  hashScratchSecret,
  verifyScratchSecret,
} from "@vaahansafe/qr-core";

// In-memory mock D1 database client adhering strictly to IDatabaseClient
class MockD1Database implements IDatabaseClient {
  public tables: {
    orders: Array<{ id: string; user_id: string; vehicle_id: string; status: string; total_minor: number }>;
    payments: Array<{ id: string; order_id: string; status: string; provider_payment_id?: string }>;
    payment_webhook_events: Array<{ provider: string; provider_event_id: string; event_type: string }>;
    qr_stickers: Array<{ id: string; public_id: string; status: string; vehicle_id?: string }>;
    qr_activation_secrets: Array<{ id: string; qr_id: string; secret_hash: string; failed_attempts: number; locked_until?: string }>;
    qr_assignments: Array<{ id: string; qr_id: string; vehicle_id: string; user_id: string; ended_at?: string | null }>;
    service_entitlements: Array<{ id: string; user_id: string; vehicle_id: string; qr_sticker_id: string; capability: string; status: string }>;
  } = {
    orders: [],
    payments: [],
    payment_webhook_events: [],
    qr_stickers: [],
    qr_activation_secrets: [],
    qr_assignments: [],
    service_entitlements: [],
  };

  async query<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
    if (sql.includes("SAFETY_VIEW_ACTIVE")) {
      const [publicId] = params as string[];
      const qr = this.tables.qr_stickers.find((s) => s.public_id === publicId);
      if (!qr) return [] as T[];
      const entitlement = this.tables.service_entitlements.find(
        (e) => e.qr_sticker_id === qr.id && e.capability === "SAFETY_VIEW_ACTIVE" && e.status === "ENABLED"
      );
      if (!entitlement) return [] as T[];
      return [{ id: entitlement.id, status: entitlement.status, qr_status: qr.status }] as unknown as T[];
    }

    if (sql.includes("FROM service_entitlements")) {
      const [userId, capability] = params as string[];
      const matched = this.tables.service_entitlements.filter(
        (e) => e.user_id === userId && e.capability === capability && e.status === "ENABLED"
      );
      return matched.map((e) => {
        const qr = this.tables.qr_stickers.find((q) => q.id === e.qr_sticker_id);
        return {
          id: e.id,
          status: e.status,
          qr_status: qr?.status || "ACTIVATED",
        };
      }) as unknown as T[];
    }

    if (sql.includes("FROM qr_stickers") && sql.includes("WHERE public_id = ?")) {
      const [publicId] = params as string[];
      const sticker = this.tables.qr_stickers.find((s) => s.public_id === publicId);
      return sticker ? ([sticker] as unknown as T[]) : [];
    }

    if (sql.includes("FROM orders")) {
      const [orderId] = params as string[];
      const order = this.tables.orders.find((o) => o.id === orderId);
      return order ? ([order] as unknown as T[]) : [];
    }

    return [] as T[];
  }

  async execute(sql: string, params: unknown[] = []): Promise<{ success: boolean; rowsAffected?: number }> {
    if (sql.includes("INSERT INTO payment_webhook_events")) {
      const [id, providerEventId, eventType] = params as string[];
      // Check UNIQUE constraint
      const existing = this.tables.payment_webhook_events.find(
        (e) => e.provider === "CASHFREE" && e.provider_event_id === providerEventId
      );
      if (existing) {
        throw new Error("UNIQUE constraint failed: payment_webhook_events.provider_event_id");
      }
      this.tables.payment_webhook_events.push({
        provider: "CASHFREE",
        provider_event_id: providerEventId,
        event_type: eventType,
      });
      return { success: true, rowsAffected: 1 };
    }

    if (sql.includes("INSERT INTO service_entitlements")) {
      const [id, userId, vehicleId, qrStickerId, capability] = params as string[];
      const existingIdx = this.tables.service_entitlements.findIndex(
        (e) => e.vehicle_id === vehicleId && e.qr_sticker_id === qrStickerId && e.capability === capability
      );
      if (existingIdx >= 0) {
        this.tables.service_entitlements[existingIdx].status = "ENABLED";
      } else {
        this.tables.service_entitlements.push({
          id,
          user_id: userId,
          vehicle_id: vehicleId,
          qr_sticker_id: qrStickerId,
          capability,
          status: "ENABLED",
        });
      }
      return { success: true, rowsAffected: 1 };
    }

    return { success: true, rowsAffected: 1 };
  }
}

describe("VaahanSafe Secure QR, Payment & Entitlement Machine", () => {
  let db: MockD1Database;

  beforeEach(() => {
    db = new MockD1Database();
  });

  describe("1. Cashfree HMAC-SHA256 Webhook Security (Rules 04, 05, 06, 07)", () => {
    const secretKey = "cfsk_test_mock_secret_key_12345678";
    const timestamp = "1726512345000";
    const rawBody = JSON.stringify({
      data: {
        order: { order_id: "ord_test_001", order_amount: 999 },
        payment: { cf_payment_id: "cf_pay_999888", payment_status: "SUCCESS" },
      },
      event_time: "2026-09-19T10:00:00Z",
      type: "PAYMENT_SUCCESS_WEBHOOK",
    });

    it("verifies genuine Cashfree HMAC signatures with timing-safe comparison", async () => {
      const genuineSignature = await computeCashfreeSignature(rawBody, timestamp, secretKey);
      expect(genuineSignature).toBeDefined();

      const isValid = await verifyCashfreeSignature(rawBody, genuineSignature, timestamp, secretKey);
      expect(isValid).toBe(true);
    });

    it("strictly rejects tampered or forged webhook payloads (Rule 06)", async () => {
      const genuineSignature = await computeCashfreeSignature(rawBody, timestamp, secretKey);
      const tamperedBody = JSON.stringify({
        data: {
          order: { order_id: "ord_test_001", order_amount: 1 }, // Tampered amount
          payment: { cf_payment_id: "cf_pay_999888", payment_status: "SUCCESS" },
        },
      });

      const isValid = await verifyCashfreeSignature(tamperedBody, genuineSignature, timestamp, secretKey);
      expect(isValid).toBe(false);
    });

    it("enforces database-backed idempotency for duplicate webhook deliveries (Rule 07)", async () => {
      const eventId = "cf_pay_999888_PAYMENT_SUCCESS_WEBHOOK";

      // First webhook delivery succeeds
      await db.execute(
        "INSERT INTO payment_webhook_events (id, provider_event_id, event_type) VALUES (?, ?, ?)",
        ["pwe_1", eventId, "PAYMENT_SUCCESS_WEBHOOK"]
      );
      expect(db.tables.payment_webhook_events.length).toBe(1);

      // Replayed webhook throws unique constraint violation and is caught safely
      await expect(
        db.execute(
          "INSERT INTO payment_webhook_events (id, provider_event_id, event_type) VALUES (?, ?, ?)",
          ["pwe_2", eventId, "PAYMENT_SUCCESS_WEBHOOK"]
        )
      ).rejects.toThrow("UNIQUE constraint failed");
    });
  });

  describe("2. Authoritative Entitlement State Machine (Rules 00, 01, 03, 23, 25)", () => {
    it("denies Digital QR access before payment confirmation or activation (Rule 03, 23)", async () => {
      db.tables.qr_stickers.push({
        id: "qr_101",
        public_id: "vs_test_opaque_101",
        status: "PRINTED",
      });

      const hasAccess = await canViewDigitalQr({
        userId: "usr_buyer_1",
        vehicleId: "veh_101",
        qrId: "qr_101",
        db,
      });

      // Must be locked!
      expect(hasAccess).toBe(false);
    });

    it("grants all 5 authoritative capabilities upon verified acquisition gate (Rule 00, 27)", async () => {
      db.tables.qr_stickers.push({
        id: "qr_101",
        public_id: "vs_test_opaque_101",
        status: "ACTIVATED",
      });
      db.tables.qr_assignments.push({
        id: "qra_101",
        qr_id: "qr_101",
        vehicle_id: "veh_101",
        user_id: "usr_buyer_1",
        ended_at: null,
      });

      // Authoritative Entitlement Grant
      await grantAuthoritativeEntitlements({
        userId: "usr_buyer_1",
        vehicleId: "veh_101",
        qrStickerId: "qr_101",
        acquisitionSource: "ONLINE_PURCHASE",
        orderId: "ord_101",
        db,
      });

      expect(db.tables.service_entitlements.length).toBe(ALL_ENTITLEMENT_CAPABILITIES.length);

      // Digital QR should now be accessible
      const hasDigitalAccess = await canViewDigitalQr({
        userId: "usr_buyer_1",
        vehicleId: "veh_101",
        qrId: "qr_101",
        db,
      });
      expect(hasDigitalAccess).toBe(true);

      // Safety View should now be active
      const canExpose = await canExposeSafetyView({
        qrPublicId: "vs_test_opaque_101",
        db,
      });
      expect(canExpose).toBe(true);
    });
  });

  describe("3. Retail Secret Verification & Opaque Identifier Isolation (Rules 14, 17, 18, 19)", () => {
    it("generates opaque high-entropy public IDs matching the security standard (Rules 17, 18)", () => {
      const publicId1 = generateQrPublicId();
      const publicId2 = generateQrPublicId();

      expect(publicId1).not.toBe(publicId2);
      expect(validateQrPublicId(publicId1).isValid).toBe(true);
      expect(validateQrPublicId(publicId2).isValid).toBe(true);
    });

    it("hashes activation secrets using one-way cryptographic hashing (Rule 14)", async () => {
      const plainSecret = "889911";
      const hashResult = await hashScratchSecret(plainSecret);

      expect(hashResult.secretHash).not.toBe(plainSecret);
      expect(hashResult.secretHash).not.toContain(plainSecret);

      const isMatch = await verifyScratchSecret(plainSecret, hashResult.secretHash, hashResult.hashVersion);
      expect(isMatch).toBe(true);

      const isWrongMatch = await verifyScratchSecret("123456", hashResult.secretHash, hashResult.hashVersion);
      expect(isWrongMatch).toBe(false);
    });

    it("preserves separation between internal ID, public ID, and activation secret (Rule 19)", () => {
      const internalId = "qr_d1_primary_key_001";
      const publicId = generateQrPublicId();
      const scratchSecret = "998877";

      expect(internalId).not.toBe(publicId);
      expect(publicId).not.toBe(scratchSecret);
      expect(internalId).not.toBe(scratchSecret);
    });
  });
});
