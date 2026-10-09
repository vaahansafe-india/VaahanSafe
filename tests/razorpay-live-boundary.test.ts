import { afterEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";
import { writeFileSync } from "node:fs";
import {
  RazorpayClient,
  RazorpayPaymentAdapter,
  verifyRazorpayCheckoutSignature,
  verifyRazorpayWebhookSignature,
  processRazorpayWebhook,
} from "@vaahansafe/payments";
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});
const secret = "webhook-fixture-secret-long";
const entity = {
  id: "pay_fixture",
  order_id: "order_fixture",
  amount: 149900,
  currency: "INR",
  status: "captured",
  captured: true,
};
const payload = (overrides = {}) =>
  JSON.stringify({
    event: "payment.captured",
    payload: { payment: { entity: { ...entity, ...overrides } } },
  });
const sign = (body: string) =>
  createHmac("sha256", secret).update(body).digest("hex");
const store = () => ({
  queryFirst: vi.fn().mockResolvedValue({
    id: "payment",
    order_id: "order",
    amount_minor: 149900,
    total_minor: 149900,
    currency: "INR",
    order_currency: "INR",
    status: "PENDING",
    order_status: "PENDING_PAYMENT",
  }),
  batch: vi.fn().mockResolvedValue(true),
});
describe("Razorpay real-service boundary", () => {
  it("never returns fake orders, payments or refunds without credentials", async () => {
    const client = new RazorpayClient();
    await expect(
      client.createOrder({ amount: 100, receipt: "order" }),
    ).rejects.toThrow("configuration");
    await expect(client.getPayment("pay_fixture")).rejects.toThrow(
      "configuration",
    );
    await expect(client.getOrder("order_fixture")).rejects.toThrow(
      "configuration",
    );
    await expect(client.createRefund("pay_fixture")).rejects.toThrow(
      "configuration",
    );
  });
  it("rejects legacy magic signatures and matches official HMAC vectors", async () => {
    expect(
      await verifyRazorpayCheckoutSignature(
        "order",
        "pay",
        "test_valid_checkout_signature",
        "test_secret",
      ),
    ).toBe(false);
    expect(
      await verifyRazorpayWebhookSignature(
        "{}",
        "test_valid_webhook_signature",
        "test_webhook_secret",
      ),
    ).toBe(false);
    const expected = createHmac("sha256", secret)
      .update("order|pay")
      .digest("hex");
    expect(
      await verifyRazorpayCheckoutSignature("order", "pay", expected, secret),
    ).toBe(true);
    expect(
      await verifyRazorpayCheckoutSignature("other", "pay", expected, secret),
    ).toBe(false);
  });
  it("rejects mode mismatches", () =>
    expect(
      () =>
        new RazorpayPaymentAdapter({
          keyId: "rzp_test_fixture",
          keySecret: secret,
          mode: "live",
        }),
    ).toThrow("mode mismatch"));
  it("does not convert a provider outage into a pending or successful payment", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    await expect(
      new RazorpayPaymentAdapter({
        keyId: "rzp_test_fixture",
        keySecret: secret,
        mode: "test",
      }).fetchPaymentStatus("order_fixture"),
    ).rejects.toThrow("unavailable");
  });
  it.each([
    { amount: 100 },
    { currency: "USD" },
    { captured: false },
    { status: "authorized" },
  ])("rejects mismatched or uncaptured signed events %j", async (overrides) => {
    vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", secret);
    const body = payload(overrides);
    const db = store();
    await expect(
      processRazorpayWebhook(body, sign(body), "evt_fixture", db),
    ).rejects.toThrow();
    expect(db.batch).not.toHaveBeenCalled();
  });
  it("rejects invalid signatures before querying storage", async () => {
    vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", secret);
    const db = store();
    await expect(
      processRazorpayWebhook(payload(), "forged", "evt_fixture", db),
    ).rejects.toThrow("Invalid signature");
    expect(db.queryFirst).not.toHaveBeenCalled();
  });
  it.each(["null", "[]", "{}"])(
    "rejects malformed signed payload %s before storage",
    async (body) => {
      vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", secret);
      const db = store();
      await expect(
        processRazorpayWebhook(body, sign(body), "evt_fixture", db),
      ).rejects.toThrow("Malformed payload");
      expect(db.queryFirst).not.toHaveBeenCalled();
      expect(db.batch).not.toHaveBeenCalled();
    },
  );
  it("uses deterministic primary-key idempotency and a single atomic batch", async () => {
    vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", secret);
    const db = store();
    const body = payload();
    await processRazorpayWebhook(body, sign(body), "evt_fixture", db);
    await processRazorpayWebhook(body, sign(body), "evt_fixture", db);
    const first = db.batch.mock.calls[0][0];
    expect(first[0].params[0]).toBe(db.batch.mock.calls[1][0][0].params[0]);
    expect(first[0].sql).toContain("ON CONFLICT DO NOTHING");
    expect(first).toHaveLength(4);
    expect(first[1].sql).toContain("provider = 'RAZORPAY'");
    expect(first[1].sql).not.toContain("REFUNDED");
    expect(first.map((op: { sql: string }) => op.sql).join(" ")).not.toMatch(
      /qr_stickers|service_entitlements/,
    );
    if (process.env.RAZORPAY_SQL_CHECK_FILE)
      writeFileSync(process.env.RAZORPAY_SQL_CHECK_FILE, JSON.stringify(first));
  });
  it("returns an error on storage failure so the provider can retry", async () => {
    vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", secret);
    const db = store();
    db.batch.mockRejectedValue(new Error("storage failure"));
    const body = payload();
    await expect(
      processRazorpayWebhook(body, sign(body), "evt_fixture", db),
    ).rejects.toThrow("storage failure");
  });
  it("acknowledges signed unsupported events without touching financial data", async () => {
    vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", secret);
    const db = store();
    const body = JSON.stringify({ event: "integration.endpoint_check" });
    await expect(
      processRazorpayWebhook(body, sign(body), null, db),
    ).resolves.toEqual({ received: true, ignored: true });
    expect(db.queryFirst).not.toHaveBeenCalled();
    expect(db.batch).not.toHaveBeenCalled();
  });
});
