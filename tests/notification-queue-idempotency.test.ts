import { describe, it, expect } from "vitest";
import {
  NotificationQueueMessageV1Schema,
  validateQueueMessageV1,
  createQueueMessageV1,
  classifyError,
  calculateNextAttemptAt,
  isRetryLimitExceeded,
  DEFAULT_RETRY_POLICY,
  InMemoryDeadLetterHandler,
} from "@vaahansafe/notifications";

describe("Notification Queue Contract & Idempotency", () => {
  describe("Queue Message Envelope V1", () => {
    it("should create and validate a minimal V1 envelope without PII", () => {
      const msg = createQueueMessageV1("nint_12345", "QR_ACTIVATED", "msg_001");

      expect(msg.version).toBe(1);
      expect(msg.messageId).toBe("msg_001");
      expect(msg.intentId).toBe("nint_12345");
      expect(msg.eventType).toBe("QR_ACTIVATED");
      expect(msg.createdAt).toBeDefined();

      // Ensure zero payload data or PII in the envelope
      expect((msg as any).payload).toBeUndefined();
      expect((msg as any).phone).toBeUndefined();
      expect((msg as any).email).toBeUndefined();

      const validated = validateQueueMessageV1(msg);
      expect(validated.intentId).toBe("nint_12345");
    });

    it("should reject malformed or unrecognized event type envelopes", () => {
      expect(() => {
        validateQueueMessageV1({
          version: 2, // invalid version
          messageId: "m1",
          intentId: "i1",
          eventType: "QR_ACTIVATED",
          createdAt: "2026-09-17",
        });
      }).toThrow(/Malformed queue message envelope/);

      expect(() => {
        validateQueueMessageV1({
          version: 1,
          messageId: "m1",
          intentId: "i1",
          eventType: "INVALID_UNRECOGNIZED_EVENT",
          createdAt: "2026-09-17",
        });
      }).toThrow();
    });
  });

  describe("Retry Classification & Bounded Backoff", () => {
    it("should classify transient provider errors as RETRYABLE", () => {
      expect(classifyError("NETWORK_TIMEOUT")).toBe("RETRYABLE");
      expect(classifyError("RATE_LIMITED")).toBe("RETRYABLE");
      expect(classifyError("PROVIDER_5XX")).toBe("RETRYABLE");
      expect(classifyError("HTTP_503_SERVICE_UNAVAILABLE")).toBe("RETRYABLE");
      expect(classifyError("HTTP_429_TOO_MANY_REQUESTS")).toBe("RETRYABLE");
    });

    it("should classify malformed inputs or invalid recipients as PERMANENT", () => {
      expect(classifyError("INVALID_RECIPIENT")).toBe("PERMANENT");
      expect(classifyError("INVALID_PHONE_NUMBER")).toBe("PERMANENT");
      expect(classifyError("TEMPLATE_VALIDATION_FAILED")).toBe("PERMANENT");
      expect(classifyError("UNAUTHORIZED_RECIPIENT")).toBe("PERMANENT");
    });

    it("should compute exponential backoff with upper bound", () => {
      const now = Date.now();
      const next1 = new Date(calculateNextAttemptAt(1, DEFAULT_RETRY_POLICY)).getTime();
      const next2 = new Date(calculateNextAttemptAt(2, DEFAULT_RETRY_POLICY)).getTime();
      const next3 = new Date(calculateNextAttemptAt(3, DEFAULT_RETRY_POLICY)).getTime();

      // Attempt 1: 30s
      expect(next1 - now).toBeGreaterThanOrEqual(29000);
      expect(next1 - now).toBeLessThanOrEqual(32000);

      // Attempt 2: 60s
      expect(next2 - now).toBeGreaterThanOrEqual(59000);
      expect(next2 - now).toBeLessThanOrEqual(62000);

      // Attempt 3: 120s
      expect(next3 - now).toBeGreaterThanOrEqual(119000);
      expect(next3 - now).toBeLessThanOrEqual(122000);

      // High attempt capped at maxBackoffSeconds (300s = 5m)
      const next10 = new Date(calculateNextAttemptAt(10, DEFAULT_RETRY_POLICY)).getTime();
      expect(next10 - now).toBeLessThanOrEqual(301000);
    });

    it("should correctly detect when max retry limit is exceeded", () => {
      expect(isRetryLimitExceeded(1, DEFAULT_RETRY_POLICY)).toBe(false);
      expect(isRetryLimitExceeded(2, DEFAULT_RETRY_POLICY)).toBe(false);
      expect(isRetryLimitExceeded(3, DEFAULT_RETRY_POLICY)).toBe(true);
      expect(isRetryLimitExceeded(4, DEFAULT_RETRY_POLICY)).toBe(true);
    });
  });

  describe("Dead-Letter Contract", () => {
    it("should record dead-letter events with minimal safe diagnostic metadata", async () => {
      const dlq = new InMemoryDeadLetterHandler();

      await dlq.recordDeadLetter({
        intentId: "nint_exhausted",
        deliveryId: "deliv_123",
        channel: "WHATSAPP",
        normalizedError: "RATE_LIMITED",
        attemptCount: 3,
        lastAttemptAt: new Date().toISOString(),
        correlationId: "req_xyz",
      });

      expect(dlq.deadLetters).toHaveLength(1);
      const record = dlq.deadLetters[0];
      expect(record.intentId).toBe("nint_exhausted");
      expect(record.channel).toBe("WHATSAPP");
      expect(record.attemptCount).toBe(3);

      // Ensure no secrets or full payload data exist in DLQ record
      expect((record as any).otp).toBeUndefined();
      expect((record as any).phone).toBeUndefined();
    });
  });
});
