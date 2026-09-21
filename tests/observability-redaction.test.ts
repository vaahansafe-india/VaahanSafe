import { describe, it, expect } from "vitest";
import {
  redactSensitiveData,
  sanitizeString,
  generateRequestId,
  generateErrorId,
  normalizeSafeError,
  createLogger,
} from "@vaahansafe/observability";
import { QrNotFoundError } from "@vaahansafe/types";

describe("Observability, Correlation & Sensitive-Data Redaction (@vaahansafe/observability)", () => {
  describe("Sensitive-Data Redaction Engine", () => {
    it("should redact sensitive keys in nested objects", () => {
      const sensitivePayload = {
        userId: "usr_123",
        auth: {
          password: "MySuperSecretPassword123!",
          sessionToken: "sess_secret_token_abc999",
          otpCode: "654321",
        },
        scratchCode: "AF7890",
        payment: {
          cardNumber: "4111111111111234",
          cvv: "999",
          clientSecret: "cf_secret_key_99999",
        },
        safeData: "This should remain visible",
      };

      const redacted = redactSensitiveData(sensitivePayload);

      expect(redacted.userId).toBe("usr_123");
      expect(redacted.safeData).toBe("This should remain visible");
      expect(redacted.auth.password).toBe("[REDACTED]");
      expect(redacted.auth.sessionToken).toBe("[REDACTED]");
      expect(redacted.auth.otpCode).toBe("[REDACTED]");
      expect(redacted.scratchCode).toBe("[REDACTED]");
      expect(redacted.payment.clientSecret).toBe("[REDACTED]");
      expect(redacted.payment.cvv).toBe("[REDACTED]");
    });

    it("should sanitize Bearer tokens and sensitive query params in strings", () => {
      expect(
        sanitizeString("Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xyz")
      ).toBe("Authorization: Bearer [REDACTED]");

      expect(
        sanitizeString("https://api.vaahansafe.com/v1/auth?secret=ultra_private_secret&user=rahul")
      ).toBe("https://api.vaahansafe.com/v1/auth?secret=[REDACTED]&user=rahul");
    });

    it("should handle circular references gracefully without crashing", () => {
      const circularObj: Record<string, unknown> = { name: "Test" };
      circularObj.self = circularObj;

      expect(() => redactSensitiveData(circularObj)).not.toThrow();
      const result = redactSensitiveData(circularObj);
      expect(result.self).toBe("[Circular]");
    });
  });

  describe("Standardized Correlation Identifiers", () => {
    it("generateRequestId creates IDs starting with VSREQ-", () => {
      const reqId = generateRequestId();
      expect(reqId.startsWith("VSREQ-")).toBe(true);
      expect(reqId.split("-")).toHaveLength(3);
    });

    it("generateErrorId creates IDs starting with VSERR-", () => {
      const errId = generateErrorId();
      expect(errId.startsWith("VSERR-")).toBe(true);
      expect(errId.split("-")).toHaveLength(3);
    });
  });

  describe("Safe Error Normalization Engine", () => {
    it("preserves operational codes for DomainError instances", () => {
      const domainErr = new QrNotFoundError("7F3K9021");
      const normalized = normalizeSafeError(domainErr);

      expect(normalized.code).toBe("QR_NOT_FOUND");
      expect(normalized.statusCode).toBe(404);
      expect(normalized.userMessage).toBe("The scanned QR code was not recognized.");
      expect(normalized.reference.startsWith("VSERR-")).toBe(true);
    });

    it("normalizes unexpected runtime errors with a safe generic message", () => {
      const rawError = new Error("Database connection timeout at 10.0.1.4:5432 with user postgres");
      const normalized = normalizeSafeError(rawError);

      expect(normalized.code).toBe("ERR_INTERNAL_SERVER_ERROR");
      expect(normalized.statusCode).toBe(500);
      expect(normalized.reference.startsWith("VSERR-")).toBe(true);
      // Ensure user message is safe
      expect(normalized.userMessage).toContain("unexpected error occurred");
    });
  });

  describe("Structured Logger Integration", () => {
    it("createLogger constructs a logger with debug, info, warn, error, and event methods", () => {
      const logger = createLogger("test-service", { correlationId: "VSREQ-123" });
      expect(logger.info).toBeDefined();
      expect(logger.error).toBeDefined();
      expect(logger.event).toBeDefined();
    });
  });
});
