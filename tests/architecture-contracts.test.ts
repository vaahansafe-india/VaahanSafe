import { describe, it, expect } from "vitest";
import {
  toUserId,
  toVehicleId,
  toQrId,
  toOrderId,
  toPaymentId,
  toSubscriptionId,
  DomainError,
  QrNotFoundError,
  QrAlreadyActivatedError,
  QrActivationSecretInvalidError,
  PaymentNotConfirmedError,
  InvalidStateTransitionError,
  VehicleNotOwnedError,
  QueueMessage,
  PaymentGateway,
  ObjectStorage,
} from "@vaahansafe/types";
import { MockObjectStorage } from "@vaahansafe/storage";
import { RazorpayPaymentAdapter, CashfreePaymentAdapter } from "@vaahansafe/payments";

describe("Architecture Contracts & Domain Primitives (@vaahansafe/types)", () => {
  describe("Branded Identifier Value Objects", () => {
    it("should accept valid non-empty string IDs and brand them", () => {
      const userId = toUserId("usr_12345");
      const vehicleId = toVehicleId("veh_67890");
      const qrId = toQrId("qr_99999");
      const orderId = toOrderId("ord_55555");
      const paymentId = toPaymentId("pay_44444");
      const subId = toSubscriptionId("sub_33333");

      expect(userId).toBe("usr_12345");
      expect(vehicleId).toBe("veh_67890");
      expect(qrId).toBe("qr_99999");
      expect(orderId).toBe("ord_55555");
      expect(paymentId).toBe("pay_44444");
      expect(subId).toBe("sub_33333");
    });

    it("should throw a domain error if attempting to create an empty branded ID", () => {
      expect(() => toUserId("")).toThrow(/Invalid UserId/);
      expect(() => toVehicleId("   ")).toThrow(/Invalid VehicleId/);
      expect(() => toQrId("")).toThrow(/Invalid QrId/);
    });
  });

  describe("Typed Domain Errors Hierarchy", () => {
    it("should ensure all domain errors inherit from DomainError with operational metadata", () => {
      const qrNotFound = new QrNotFoundError("VS-7F3K-9021");
      expect(qrNotFound).toBeInstanceOf(DomainError);
      expect(qrNotFound.code).toBe("QR_NOT_FOUND");
      expect(qrNotFound.statusCode).toBe(404);
      expect(qrNotFound.isOperational).toBe(true);
      expect(qrNotFound.userMessage).toBe("The scanned QR code was not recognized.");

      const qrActive = new QrAlreadyActivatedError("VS-7F3K-9021");
      expect(qrActive.statusCode).toBe(409);
      expect(qrActive.code).toBe("QR_ALREADY_ACTIVATED");

      const secretInvalid = new QrActivationSecretInvalidError();
      expect(secretInvalid.statusCode).toBe(401);
      expect(secretInvalid.code).toBe("QR_ACTIVATION_SECRET_INVALID");

      const paymentUnconfirmed = new PaymentNotConfirmedError("ord_123");
      expect(paymentUnconfirmed.statusCode).toBe(402);
      expect(paymentUnconfirmed.code).toBe("PAYMENT_NOT_CONFIRMED");

      const badTransition = new InvalidStateTransitionError("QR", "ACTIVATED", "PRINTED");
      expect(badTransition.statusCode).toBe(400);

      const notOwned = new VehicleNotOwnedError("veh_1", "usr_2");
      expect(notOwned.statusCode).toBe(403);
    });

    it("DomainError.toJSON serializes structured operational data", () => {
      const err = new QrNotFoundError("7F3K9021");
      const json = err.toJSON();
      expect(json.code).toBe("QR_NOT_FOUND");
      expect(json.statusCode).toBe(404);
      expect(json.userMessage).toBeTruthy();
    });
  });

  describe("Queue & Event Envelopes (INVARIANT 10)", () => {
    it("should enforce versioned queue message structure", () => {
      const event: QueueMessage<{ qrPublicId: string }> = {
        version: 1,
        eventId: "evt_12345",
        type: "qr.activated",
        occurredAt: new Date().toISOString(),
        correlationId: "VSREQ-123",
        payload: { qrPublicId: "7F3K9021" },
      };

      expect(event.version).toBe(1);
      expect(event.type).toBe("qr.activated");
      expect(event.payload.qrPublicId).toBe("7F3K9021");
    });
  });

  describe("Payment Gateway Port & Authority (INVARIANT 08)", () => {
    it("RazorpayPaymentAdapter implements PaymentGateway port", async () => {
      const gateway: PaymentGateway = new RazorpayPaymentAdapter({
        keyId: "rzp_mock_placeholder_id",
        keySecret: "rzp_mock_placeholder_secret",
        mode: "test",
      });

      const session = await gateway.createPaymentOrder({
        orderId: "ord_101",
        amountPaise: 149900,
        customerId: "cust_1",
        customerPhone: "9876543210",
        returnUrl: "https://app.vaahansafe.com/orders/return",
        notifyUrl: "https://api.vaahansafe.com/webhooks/razorpay",
      });

      expect(session.orderId).toBe("ord_101");
      expect(session.gatewayStatus).toBe("PENDING");
      expect(session.checkoutOptions?.keyId).toBe("rzp_mock_placeholder_id");
    });

    it("CashfreePaymentAdapter implements PaymentGateway port (historical audit)", async () => {
      const gateway: PaymentGateway = new CashfreePaymentAdapter("test_id", "test_secret", "TEST");

      const session = await gateway.createPaymentOrder({
        orderId: "ord_101",
        amountPaise: 149900,
        customerId: "cust_1",
        customerPhone: "9876543210",
        returnUrl: "https://app.vaahansafe.com/orders/return",
        notifyUrl: "https://api.vaahansafe.com/webhooks/cashfree",
      });

      expect(session.orderId).toBe("ord_101");
      expect(session.gatewayStatus).toBe("ACTIVE");
    });

    it("verifies webhook signatures authoritatively", async () => {
      const gateway: PaymentGateway = new CashfreePaymentAdapter("test_id", "test_secret", "TEST");
      const webhook = await gateway.verifyWebhook(
        JSON.stringify({
          data: { order: { order_id: "ord_101" }, payment: { payment_status: "SUCCESS", payment_amount: 1499 } },
          event_time: "2026-09-17T03:00:00Z",
          type: "PAYMENT_SUCCESS_WEBHOOK",
        }),
        "test_valid_signature",
        "1726512345"
      );

      expect(webhook.isValid).toBe(true);
      expect(webhook.rawSafePayload?.orderId).toBe("ord_101");
    });
  });

  describe("Object Storage Port & Visibility (INVARIANT 06 & 13)", () => {
    it("MockObjectStorage implements ObjectStorage with explicit visibility", async () => {
      const storage: ObjectStorage = new MockObjectStorage();

      const meta = await storage.put({
        key: "vehicles/veh_1/front.webp",
        data: new Uint8Array([1, 2, 3]),
        contentType: "image/webp",
        visibility: "CONTROLLED",
      });

      expect(meta.key).toBe("vehicles/veh_1/front.webp");
      expect(meta.visibility).toBe("CONTROLLED");
      expect(storage.getPublicUrl(meta.key)).toContain("vehicles/veh_1/front.webp");
    });
  });
});
