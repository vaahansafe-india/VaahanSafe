import { describe, it, expect } from "vitest";
import {
  EVENT_CHANNEL_POLICY,
  getEligibleChannelsForEvent,
  evaluateNotificationChannels,
  isChannelMandatoryForCategory,
  resolveTrustedDestination,
} from "@vaahansafe/notifications";

describe("Notification Policy & Preference Evaluation", () => {
  describe("Central Channel Matrix", () => {
    it("should enforce mandatory security policy for SECURITY_CHANGED", () => {
      const policy = EVENT_CHANNEL_POLICY.SECURITY_CHANGED;
      expect(policy.isMandatorySecurity).toBe(true);
      expect(policy.defaultPriority).toBe("CRITICAL");
      expect(isChannelMandatoryForCategory("SECURITY", "IN_APP")).toBe(true);
      expect(isChannelMandatoryForCategory("SECURITY", "EMAIL")).toBe(true);
    });

    it("should allow preference customization for COMMERCE and ACCOUNT", () => {
      expect(EVENT_CHANNEL_POLICY.PAYMENT_SUCCEEDED.isMandatorySecurity).toBe(false);
      expect(EVENT_CHANNEL_POLICY.ACCOUNT_WELCOME.isMandatorySecurity).toBe(false);
    });
  });

  describe("Preference Evaluator", () => {
    it("should preserve mandatory channels even if user explicitly disabled them", () => {
      const activeChannels = evaluateNotificationChannels({
        eventType: "SECURITY_CHANGED",
        category: "SECURITY",
        userPreferences: [
          { userId: "usr_1", category: "SECURITY", channel: "EMAIL", enabled: false },
          { userId: "usr_1", category: "SECURITY", channel: "IN_APP", enabled: false },
        ],
        capabilities: {
          hasPhone: true,
          hasEmail: true,
        },
      });

      // Mandatory policy overrides user opt-out for security notifications
      expect(activeChannels).toContain("IN_APP");
      expect(activeChannels).toContain("EMAIL");
    });

    it("should respect user opt-out for non-mandatory categories (COMMERCE)", () => {
      const activeChannels = evaluateNotificationChannels({
        eventType: "PAYMENT_SUCCEEDED",
        category: "COMMERCE",
        userPreferences: [
          { userId: "usr_1", category: "COMMERCE", channel: "WHATSAPP", enabled: false },
        ],
        capabilities: {
          hasPhone: true,
          hasEmail: true,
        },
      });

      expect(activeChannels).not.toContain("WHATSAPP");
      expect(activeChannels).toContain("IN_APP");
      expect(activeChannels).toContain("EMAIL");
    });

    it("should exclude channels when recipient lacks required contact credentials", () => {
      const activeChannels = evaluateNotificationChannels({
        eventType: "QR_ACTIVATED",
        category: "SAFETY",
        capabilities: {
          hasPhone: false, // user has no verified phone
          hasEmail: true,
        },
      });

      expect(activeChannels).not.toContain("WHATSAPP");
      expect(activeChannels).toContain("EMAIL");
      expect(activeChannels).toContain("IN_APP");
    });
  });

  describe("Trusted Destination Policy", () => {
    it("should resolve verified destinations from authoritative database profile", () => {
      const profile = {
        userId: "usr_123",
        verifiedPhone: "+919876543210",
        verifiedEmail: "user@example.com",
      };

      const dest = resolveTrustedDestination(profile, "COMMERCE");
      expect(dest.phone).toBe("+919876543210");
      expect(dest.email).toBe("user@example.com");
      expect(dest.source).toBe("ACCOUNT_VERIFIED");
    });

    it("should prefer destination snapshot for SECURITY category to prevent race conditions", () => {
      const profile = {
        userId: "usr_123",
        verifiedPhone: "+919876543210", // newly modified attacker phone
        verifiedEmail: "attacker@example.com",
      };

      const snapshot = {
        phone: "+919999988888", // original owner phone captured at event creation
        email: "original_owner@example.com",
      };

      const dest = resolveTrustedDestination(profile, "SECURITY", snapshot);
      expect(dest.phone).toBe("+919999988888");
      expect(dest.email).toBe("original_owner@example.com");
      expect(dest.source).toBe("SNAPSHOT");
    });
  });
});
