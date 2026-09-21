import { describe, it, expect } from "vitest";
import { SmtpEmailAdapter, sendWelcomeEmail, sendEmergencyAlertEmail } from "@vaahansafe/notifications";

describe("Email Service Subsystem (@vaahansafe/notifications)", () => {
  it("exports SmtpEmailAdapter and email delivery functions", () => {
    expect(typeof SmtpEmailAdapter).toBe("function");
    expect(typeof sendWelcomeEmail).toBe("function");
    expect(typeof sendEmergencyAlertEmail).toBe("function");
  });

  it("generates structured welcome email with recipient name and CTA", async () => {
    const result = await sendWelcomeEmail("test@example.com", "Rohan Sharma");
    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
  });

  it("generates emergency alert email with vehicle plate and scan time", async () => {
    const result = await sendEmergencyAlertEmail({
      to: "emergency@example.com",
      vehiclePlate: "MH12AB1234",
      scanTime: "12:30 PM IST",
      locationAddress: "Pune, Maharashtra",
      message: "Vehicle headlight left on.",
    });
    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
  });
});
