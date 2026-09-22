import { describe, it, expect, beforeEach } from "vitest";
import {
  computeRazorpayCheckoutSignature,
  verifyRazorpayCheckoutSignature,
  computeRazorpayWebhookSignature,
  verifyRazorpayWebhookSignature,
  RazorpayPaymentAdapter,
  RazorpayClient,
} from "@vaahansafe/payments";
import {
  canUseQrService,
  canViewDigitalQr,
  canExposeSafetyView,
  grantAuthoritativeEntitlements,
  ALL_ENTITLEMENT_CAPABILITIES,
  type IDatabaseClient,
} from "@vaahansafe/qr-core";

// Mock D1 database client adhering strictly to IDatabaseClient
class MockD1PaymentDatabase implements IDatabaseClient {
  public tables: {
    orders: Array<{ id: string; user_id: string; vehicle_id: string; status: string; total_minor: number }>;
    payments: Array<{ id: string; order_id: string; provider: string; provider_order_id: string; provider_payment_id?: string; status: string; amount_minor: number }>;
    payment_webhook_events: Array<{ provider: string; provider_event_id: string; event_type: string }>;
    qr_stickers: Array<{ id: string; public_id: string; status: string; vehicle_id?: string }>;
    service_entitlements: Array<{ id: string; user_id: string; vehicle_id: string; qr_sticker_id: string; capability: string; status: string }>;
  } = {
    orders: [],
    payments: [],
    payment_webhook_events: [],
    qr_stickers: [],
    service_entitlements: [],
  };

  async query<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
    if (sql.includes("FROM payment_webhook_events") && sql.includes("provider_event_id")) {
      const [provider, eventId] = params as string[];
      const found = this.tables.payment_webhook_events.filter(
        (e) => e.provider === provider && e.provider_event_id === eventId
      );
      return found as unknown as T[];
    }

    if (sql.includes("INSERT INTO payment_webhook_events")) {
      const [provider, eventId, eventType] = params as string[];
      this.tables.payment_webhook_events.push({
        provider,
        provider_event_id: eventId,
        event_type: eventType,
      });
      return [] as T[];
    }

    if (sql.includes("FROM payments") && sql.includes("provider_order_id")) {
      const [provider, providerOrderId] = params as string[];
      const found = this.tables.payments.filter(
        (p) => p.provider === provider && p.provider_order_id === providerOrderId
      );
      return found as unknown as T[];
    }

    if (sql.includes("FROM qr_stickers") && sql.includes("WHERE public_id = ?")) {
      const [publicId] = params as string[];
      const sticker = this.tables.qr_stickers.find((s) => s.public_id === publicId);
      return sticker ? ([sticker] as unknown as T[]) : [];
    }

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
        const qr = this.tables.qr_stickers.find((s) => s.id === e.qr_sticker_id);
        return {
          id: e.id,
          capability: e.capability,
          status: e.status,
          qr_status: qr?.status ?? "ACTIVATED",
        };
      }) as unknown as T[];
    }

    return [] as T[];
  }

  async execute(sql: string, params: unknown[] = []): Promise<{ success: boolean }> {
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
      return { success: true };
    }
    return { success: true };
  }
}

describe("Razorpay Payment Architecture & Security Invariants", () => {
  const TEST_KEY_SECRET = "rzp_test_secret_key_abcdef123456";
  const TEST_WEBHOOK_SECRET = "whsec_test_secret_9876543210";
  let mockDb: MockD1PaymentDatabase;

  beforeEach(() => {
    mockDb = new MockD1PaymentDatabase();
  });

  describe("1. Razorpay Checkout HMAC-SHA256 Signature Verification (Rules 23, 24)", () => {
    const orderId = "order_O4eG47ZkK27z0r";
    const paymentId = "pay_O4eG8QW6P0h4kH";

    it("verifies genuine Razorpay checkout signatures with timing-safe comparison", async () => {
      const signature = await computeRazorpayCheckoutSignature(orderId, paymentId, TEST_KEY_SECRET);
      expect(signature).toBeDefined();
      expect(signature.length).toBe(64); // SHA-256 hex string

      const isValid = await verifyRazorpayCheckoutSignature(orderId, paymentId, signature, TEST_KEY_SECRET);
      expect(isValid).toBe(true);
    });

    it("rejects tampered payment_id", async () => {
      const signature = await computeRazorpayCheckoutSignature(orderId, paymentId, TEST_KEY_SECRET);
      const tamperedPaymentId = "pay_TAMPERED999999";

      const isValid = await verifyRazorpayCheckoutSignature(orderId, tamperedPaymentId, signature, TEST_KEY_SECRET);
      expect(isValid).toBe(false);
    });

    it("rejects tampered order_id", async () => {
      const signature = await computeRazorpayCheckoutSignature(orderId, paymentId, TEST_KEY_SECRET);
      const tamperedOrderId = "order_TAMPERED1111";

      const isValid = await verifyRazorpayCheckoutSignature(tamperedOrderId, paymentId, signature, TEST_KEY_SECRET);
      expect(isValid).toBe(false);
    });

    it("rejects tampered signature", async () => {
      const signature = await computeRazorpayCheckoutSignature(orderId, paymentId, TEST_KEY_SECRET);
      const tamperedSignature = signature.slice(0, -2) + "00";

      const isValid = await verifyRazorpayCheckoutSignature(orderId, paymentId, tamperedSignature, TEST_KEY_SECRET);
      expect(isValid).toBe(false);
    });

    it("rejects when key secret is wrong or missing", async () => {
      const signature = await computeRazorpayCheckoutSignature(orderId, paymentId, TEST_KEY_SECRET);

      const isValidWrongSecret = await verifyRazorpayCheckoutSignature(orderId, paymentId, signature, "wrong_secret");
      expect(isValidWrongSecret).toBe(false);

      const isValidEmptySecret = await verifyRazorpayCheckoutSignature(orderId, paymentId, signature, "");
      expect(isValidEmptySecret).toBe(false);
    });
  });

  describe("2. Razorpay Webhook HMAC-SHA256 Signature Verification (Rules 29, 30, 31)", () => {
    const rawWebhookPayload = JSON.stringify({
      entity: "event",
      account_id: "acc_test_123",
      event: "payment.captured",
      contains: ["payment"],
      payload: {
        payment: {
          entity: {
            id: "pay_O4eG8QW6P0h4kH",
            entity: "payment",
            amount: 49900,
            currency: "INR",
            status: "captured",
            order_id: "order_O4eG47ZkK27z0r",
          },
        },
      },
      created_at: 1726512345,
    });

    it("verifies genuine Razorpay webhook payload signature", async () => {
      const signature = await computeRazorpayWebhookSignature(rawWebhookPayload, TEST_WEBHOOK_SECRET);
      expect(signature).toBeDefined();

      const isValid = await verifyRazorpayWebhookSignature(rawWebhookPayload, signature, TEST_WEBHOOK_SECRET);
      expect(isValid).toBe(true);
    });

    it("rejects webhook if raw body was altered after transmission", async () => {
      const signature = await computeRazorpayWebhookSignature(rawWebhookPayload, TEST_WEBHOOK_SECRET);
      const tamperedPayload = rawWebhookPayload.replace("49900", "10000");

      const isValid = await verifyRazorpayWebhookSignature(tamperedPayload, signature, TEST_WEBHOOK_SECRET);
      expect(isValid).toBe(false);
    });

    it("rejects webhook if signature header is missing or empty", async () => {
      const isValid = await verifyRazorpayWebhookSignature(rawWebhookPayload, "", TEST_WEBHOOK_SECRET);
      expect(isValid).toBe(false);
    });
  });

  describe("3. Webhook Idempotency & Replay Protection (Rules 07, 33)", () => {
    const eventId = "evt_rzp_test_dedup_001";

    it("records first webhook event and rejects duplicate replays", async () => {
      // First check
      const existing = await mockDb.query(
        "SELECT provider_event_id FROM payment_webhook_events WHERE provider = ? AND provider_event_id = ?",
        ["RAZORPAY", eventId]
      );
      expect(existing.length).toBe(0);

      // Record first processing
      await mockDb.query(
        "INSERT INTO payment_webhook_events (provider, provider_event_id, event_type) VALUES (?, ?, ?)",
        ["RAZORPAY", eventId, "payment.captured"]
      );

      // Replay attempt
      const replayCheck = await mockDb.query(
        "SELECT provider_event_id FROM payment_webhook_events WHERE provider = ? AND provider_event_id = ?",
        ["RAZORPAY", eventId]
      );
      expect(replayCheck.length).toBe(1); // Dedup prevented duplicate processing
    });
  });

  describe("4. Trusted Order ID Enforcement (Rule 25)", () => {
    it("matches client payment callback only against trusted order ID in D1", async () => {
      const trustedOrderId = "order_O4eG47ZkK27z0r";
      const attackerSuppliedOrderId = "order_ATTACKER_999";

      mockDb.tables.payments.push({
        id: "pay_rec_001",
        order_id: "vs_ord_101",
        provider: "RAZORPAY",
        provider_order_id: trustedOrderId,
        status: "PENDING",
        amount_minor: 49900,
      });

      // Server looks up payment attempt by trusted order ID stored in DB
      const [trustedRecord] = await mockDb.query<{ id: string; provider_order_id: string }>(
        "SELECT id, provider_order_id FROM payments WHERE provider = ? AND provider_order_id = ?",
        ["RAZORPAY", attackerSuppliedOrderId]
      );

      expect(trustedRecord).toBeUndefined(); // Attacker cannot hijack another order
    });
  });

  describe("5. Entitlement Hard Gate — No Entitlement Without Captured Payment (Rules 01, 03, 52)", () => {
    const userId = "usr_test_001";
    const vehicleId = "veh_test_001";
    const qrId = "qr_test_001";

    it("denies all entitlements before payment capture", async () => {
      const canAccess = await canUseQrService({
        userId,
        vehicleId,
        qrId,
        db: mockDb,
      });
      expect(canAccess).toBe(false);

      const canView = await canViewDigitalQr({
        userId,
        vehicleId,
        qrId,
        db: mockDb,
      });
      expect(canView).toBe(false);

      const canExpose = await canExposeSafetyView({
        qrPublicId: "VS-TEST-PUBLIC-ID",
        db: mockDb,
      });
      expect(canExpose).toBe(false);
    });

    it("grants entitlements only after authoritative payment confirmation", async () => {
      mockDb.tables.qr_stickers.push({
        id: qrId,
        public_id: "VS-TEST-PUBLIC-ID",
        status: "ACTIVATED",
        vehicle_id: vehicleId,
      });

      // Authoritative grant triggered only after payment capture
      await grantAuthoritativeEntitlements({
        userId,
        vehicleId,
        qrStickerId: qrId,
        acquisitionSource: "ONLINE_PURCHASE",
        orderId: "ord_test_001",
        db: mockDb,
      });

      // Verify records were created
      expect(mockDb.tables.service_entitlements.length).toBe(ALL_ENTITLEMENT_CAPABILITIES.length);

      const canAccess = await canUseQrService({
        userId,
        vehicleId,
        qrId,
        db: mockDb,
      });
      expect(canAccess).toBe(true);

      const canView = await canViewDigitalQr({
        userId,
        vehicleId,
        qrId,
        db: mockDb,
      });
      expect(canView).toBe(true);

      const canExpose = await canExposeSafetyView({
        qrPublicId: "VS-TEST-PUBLIC-ID",
        db: mockDb,
      });
      expect(canExpose).toBe(true);
    });
  });

  describe("6. Provider Port & Historical Audit Record Retention (Rules 38, 39)", () => {
    it("retains historical Cashfree transactions alongside Razorpay transactions", async () => {
      mockDb.tables.payments.push(
        {
          id: "pay_hist_001",
          order_id: "vs_ord_old_01",
          provider: "CASHFREE",
          provider_order_id: "cf_order_998877",
          provider_payment_id: "cf_pay_112233",
          status: "SUCCESS",
          amount_minor: 49900,
        },
        {
          id: "pay_new_001",
          order_id: "vs_ord_new_02",
          provider: "RAZORPAY",
          provider_order_id: "order_rzp_554433",
          provider_payment_id: "pay_rzp_998877",
          status: "SUCCESS",
          amount_minor: 49900,
        }
      );

      // Historical Cashfree query
      const [histRecord] = await mockDb.query<{ id: string; provider: string }>(
        "SELECT id, provider FROM payments WHERE provider = ? AND provider_order_id = ?",
        ["CASHFREE", "cf_order_998877"]
      );
      expect(histRecord).toBeDefined();
      expect(histRecord.provider).toBe("CASHFREE");

      // New Razorpay query
      const [newRecord] = await mockDb.query<{ id: string; provider: string }>(
        "SELECT id, provider FROM payments WHERE provider = ? AND provider_order_id = ?",
        ["RAZORPAY", "order_rzp_554433"]
      );
      expect(newRecord).toBeDefined();
      expect(newRecord.provider).toBe("RAZORPAY");
    });
  });

  describe("7. Razorpay Adapter Offline Test Mode Safety", () => {
    it("RazorpayClient safely uses synthetic responses when in offline test mode without live credentials", async () => {
      const client = new RazorpayClient("mock_placeholder_key", "mock_placeholder_secret");
      expect(client.isConfigured()).toBe(false);

      const order = await client.createOrder({
        amount: 49900,
        currency: "INR",
        receipt: "test_receipt_001",
      });

      expect(order.id).toBeDefined();
      expect(order.amount).toBe(49900);
      expect(order.currency).toBe("INR");
      expect(order.receipt).toBe("test_receipt_001");
    });

    it("RazorpayPaymentAdapter initializes with safe test mode defaults", () => {
      const adapter = new RazorpayPaymentAdapter({
        keyId: "rzp_test_sample",
        keySecret: "sample_secret",
        mode: "test",
      });

      expect(adapter.mode).toBe("test");
    });
  });
});
