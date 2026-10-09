import { describe, expect, it, vi } from "vitest";
import {
  drainNotificationOutbox,
  type ClaimedNotification,
  type NotificationOutboxStore,
} from "../packages/notifications/src/outbox/processor";
function setup(overrides: Partial<ClaimedNotification> = {}) {
  const intent: ClaimedNotification = {
    id: "intent",
    lease_token: "lease",
    event_type: "QR_ACTIVATED",
    category: "SAFETY",
    template_key: "QR_ACTIVATED_V1",
    payload_json: JSON.stringify({
      publicId: "opaque-qr-id",
      vehicleRegMasked: "TS••••1234",
    }),
    profile: { userId: "owner", verifiedPhone: "+919876543210" },
    preferences: [],
    ...overrides,
  };
  const store: NotificationOutboxStore = {
    claimBatch: vi.fn().mockResolvedValue([intent]),
    prepare: vi
      .fn()
      .mockImplementation(async (_intent, channel) => ({
        claimed: true,
        id: `delivery-${channel}`,
        attempt: 1,
      })),
    finishDelivery: vi.fn(),
    finishIntent: vi.fn(),
  };
  const whatsapp = {
    sendWhatsApp: vi
      .fn()
      .mockResolvedValue({
        success: true,
        providerMessageId: "provider-reference",
      }),
  };
  const email = {
    sendEmail: vi
      .fn()
      .mockResolvedValue({
        success: true,
        providerMessageId: "email-reference",
      }),
  };
  return { store, whatsapp, email, intent };
}
describe("Durable notification delivery", () => {
  it("uses the verified owner phone and approved positional contract", async () => {
    const d = setup();
    await drainNotificationOutbox(d);
    expect(d.whatsapp.sendWhatsApp).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientPhone: "+919876543210",
        templateName: "vhn_qr_activated_v1",
        parameters: { 1: "opaque-qr-id", 2: "TS••••1234" },
      }),
    );
    expect(d.store.finishDelivery).toHaveBeenCalledWith(
      d.intent,
      "delivery-IN_APP",
      "DELIVERED",
    );
    expect(d.store.finishDelivery).toHaveBeenCalledWith(
      d.intent,
      "delivery-WHATSAPP",
      "PROCESSING",
      "provider-reference",
      undefined,
    );
  });
  it("does not contact a provider without an atomic delivery claim", async () => {
    const d = setup();
    vi.mocked(d.store.prepare).mockResolvedValue({ claimed: false });
    await drainNotificationOutbox(d);
    expect(d.whatsapp.sendWhatsApp).not.toHaveBeenCalled();
  });
  it("keeps in-app delivery when WhatsApp rejects a template", async () => {
    const d = setup();
    d.whatsapp.sendWhatsApp.mockResolvedValue({
      success: false,
      errorCode: "MSG91_PROVIDER_REJECTED",
      isRetryable: false,
    } as never);
    await drainNotificationOutbox(d);
    expect(d.store.finishDelivery).toHaveBeenCalledWith(
      d.intent,
      "delivery-IN_APP",
      "DELIVERED",
    );
    expect(d.store.finishDelivery).toHaveBeenCalledWith(
      d.intent,
      "delivery-WHATSAPP",
      "FAILED_PERMANENT",
      undefined,
      "MSG91_PROVIDER_REJECTED",
    );
  });
  it("bounds explicit retryable failures to three attempts", async () => {
    const d = setup();
    vi.mocked(d.store.prepare).mockResolvedValue({
      claimed: true,
      id: "delivery",
      attempt: 3,
    });
    d.whatsapp.sendWhatsApp.mockResolvedValue({
      success: false,
      errorCode: "MSG91_HTTP_429",
      isRetryable: true,
    } as never);
    await drainNotificationOutbox(d);
    expect(d.store.finishDelivery).toHaveBeenCalledWith(
      d.intent,
      "delivery",
      "FAILED_PERMANENT",
      undefined,
      "MSG91_HTTP_429",
    );
  });
  it("quarantines an ambiguous transport failure without retrying", async () => {
    const d = setup();
    d.whatsapp.sendWhatsApp.mockRejectedValue(new Error("timeout"));
    await drainNotificationOutbox(d);
    expect(d.store.finishDelivery).toHaveBeenCalledWith(
      d.intent,
      "delivery-WHATSAPP",
      "DEAD_LETTERED",
      undefined,
      "DELIVERY_OUTCOME_UNKNOWN",
    );
  });
  it("respects a saved WhatsApp opt-out", async () => {
    const d = setup({
      preferences: [
        {
          userId: "owner",
          category: "SAFETY",
          channel: "WHATSAPP",
          enabled: false,
        },
      ],
    });
    await drainNotificationOutbox(d);
    expect(d.whatsapp.sendWhatsApp).not.toHaveBeenCalled();
  });
  it("does not send optional payment alerts before opt-in", async () => {
    const d = setup({
      event_type: "PAYMENT_SUCCEEDED",
      category: "COMMERCE",
      template_key: "PAYMENT_SUCCESS_V1",
      payload_json: JSON.stringify({
        orderId: "order",
        orderNumber: "VS-ORDER",
        paymentId: "paid-ref",
        amountDisplay: "INR 499.00",
      }),
    });
    await drainNotificationOutbox(d);
    expect(d.whatsapp.sendWhatsApp).not.toHaveBeenCalled();
  });
  it("rejects invalid variables before contacting external services", async () => {
    const d = setup({ payload_json: "{}" });
    await drainNotificationOutbox(d);
    expect(d.whatsapp.sendWhatsApp).not.toHaveBeenCalled();
    expect(d.store.finishIntent).toHaveBeenCalledWith(
      d.intent,
      "TEMPLATE_VALIDATION_FAILED",
    );
  });
});
