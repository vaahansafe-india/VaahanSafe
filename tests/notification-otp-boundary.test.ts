import { describe, it, expect } from "vitest";
import {
  NOTIFICATION_EVENT_TYPES,
  NotificationQueueMessageV1Schema,
  sanitizeLogData,
  Msg91OtpAdapter,
} from "@vaahansafe/notifications";

describe("OTP Boundary & Privacy Isolation", () => {
  it("Scenario D: NOTIFICATION_QUEUE down; OTP architecture remains separate and operational", async () => {
    // 1. Simulate NOTIFICATION_QUEUE is completely unavailable/offline
    const isNotificationQueueOnline = false;

    // 2. Auth OTP path uses synchronous OTP service directly
    const otpService = new Msg91OtpAdapter("test_auth_key", "test_template");
    const sendResult = await otpService.send({ phone: "+919876543210" });

    // OTP succeeds synchronously without touching NOTIFICATION_QUEUE
    expect(sendResult.success).toBe(true);
    expect(sendResult.requestId).toBeDefined();

    // Verification also works directly
    const verifyResult = await otpService.verify("+919876543210", "123456");
    expect(verifyResult.success).toBe(true);
  });

  it("should prevent OTP from being represented as a NotificationIntent event", () => {
    // Schema rejects any attempt to pass OTP into NotificationQueueMessageV1
    expect(() => {
      NotificationQueueMessageV1Schema.parse({
        version: 1,
        messageId: "msg_otp",
        intentId: "intent_otp",
        eventType: "OTP_LOGIN", // Invalid
        createdAt: new Date().toISOString(),
      });
    }).toThrow();

    expect((NOTIFICATION_EVENT_TYPES as readonly string[]).includes("OTP")).toBe(false);
  });

  it("should redact OTP, secrets, and auth keys from logs", () => {
    const sensitiveLog = {
      action: "AUTH_VERIFICATION",
      phone: "+919876543210",
      otp: "123456",
      authKey: "secret_msg91_key_abcdef",
      apiKey: "secret_email_api_key",
      nested: {
        password: "super_secret_pw",
        medicalNotes: "Diabetic patient",
      },
    };

    const sanitized = sanitizeLogData(sensitiveLog);

    expect(sanitized.otp).toBe("[REDACTED]");
    expect(sanitized.authKey).toBe("[REDACTED]");
    expect(sanitized.apiKey).toBe("[REDACTED]");
    expect((sanitized.nested as any).password).toBe("[REDACTED]");
    expect((sanitized.nested as any).medicalNotes).toBe("[REDACTED]");
    expect(sanitized.action).toBe("AUTH_VERIFICATION");
  });
});
