import { describe, it, expect } from "vitest";
import {
  createSubscription,
  canTransitionSubscriptionStatus,
  assertValidSubscriptionStatusTransition,
  createSubscriptionEvent,
  getEntitlements,
  getSafetyCapabilities,
  InvalidSubscriptionStateError,
} from "@vaahansafe/subscriptions";

describe("Phase 10 — Subscriptions, Entitlements & QR Safety Continuity", () => {
  describe("Subscription State Machine (Sections 49 & 50)", () => {
    it("allows valid subscription progression and recovery paths", () => {
      expect(canTransitionSubscriptionStatus("CREATED", "PENDING_PAYMENT")).toBe(true);
      expect(canTransitionSubscriptionStatus("PENDING_PAYMENT", "ACTIVE")).toBe(true);
      expect(canTransitionSubscriptionStatus("ACTIVE", "PAST_DUE")).toBe(true);
      expect(canTransitionSubscriptionStatus("PAST_DUE", "ACTIVE")).toBe(true); // Recovery
      expect(canTransitionSubscriptionStatus("ACTIVE", "CANCEL_AT_PERIOD_END")).toBe(true);
      expect(canTransitionSubscriptionStatus("CANCEL_AT_PERIOD_END", "EXPIRED")).toBe(true);
      expect(canTransitionSubscriptionStatus("ACTIVE", "CANCELLED")).toBe(true);
      expect(canTransitionSubscriptionStatus("PAST_DUE", "EXPIRED")).toBe(true);
    });

    it("rejects illegal subscription state jumps", () => {
      expect(canTransitionSubscriptionStatus("EXPIRED", "ACTIVE")).toBe(false);
      expect(canTransitionSubscriptionStatus("CANCELLED", "ACTIVE")).toBe(false);
      expect(canTransitionSubscriptionStatus("CREATED", "EXPIRED")).toBe(false);

      expect(() => assertValidSubscriptionStatusTransition("EXPIRED", "ACTIVE")).toThrow(
        InvalidSubscriptionStateError
      );
    });

    it("creates append-only subscription events", () => {
      const event = createSubscriptionEvent({
        subscriptionId: "sub_123",
        eventType: "RENEWAL_SUCCEEDED",
        payload: { periodEnd: "2027-09-17T00:00:00Z", invoiceId: "inv_999" },
      });

      expect(event.id).toMatch(/^sev_/);
      expect(event.eventType).toBe("RENEWAL_SUCCEEDED");
      expect(event.payloadJson).toContain("2027-09-17");
    });
  });

  describe("Server-Side Entitlement Evaluation (Sections 52, 53, 54)", () => {
    const samplePlan = {
      code: "SAFETY_PLUS_ANNUAL",
      vehicleLimit: 3,
      contactLimit: 5,
      features: ["CORE_EMERGENCY_PROFILE", "SCAN_HISTORY", "ADVANCED_ANALYTICS", "PRIORITY_SUPPORT"],
      isActive: true,
    };

    it("provides baseline life-safety emergency capabilities even with no subscription", () => {
      const entitlements = getEntitlements({
        userId: "usr_free_user",
        subscription: null,
      });

      expect(entitlements.canCoreEmergencyProfile).toBe(true);
      expect(entitlements.contactLimit).toBe(1);
      expect(entitlements.vehicleLimit).toBe(1);
      expect(entitlements.canScanHistory).toBe(false);
      expect(entitlements.canAdvancedAnalytics).toBe(false);
      expect(entitlements.isSubscriptionActive).toBe(false);
    });

    it("unlocks extended capabilities when commercial subscription is ACTIVE", () => {
      const activeSub = createSubscription({
        userId: "usr_paid_user",
        planId: "plan_safety_plus",
        status: "ACTIVE",
      });

      const entitlements = getEntitlements({
        userId: "usr_paid_user",
        subscription: activeSub,
        plan: samplePlan,
      });

      expect(entitlements.isSubscriptionActive).toBe(true);
      expect(entitlements.canCoreEmergencyProfile).toBe(true);
      expect(entitlements.contactLimit).toBe(5);
      expect(entitlements.vehicleLimit).toBe(3);
      expect(entitlements.canScanHistory).toBe(true);
      expect(entitlements.canAdvancedAnalytics).toBe(true);
      expect(entitlements.canPrioritySupport).toBe(true);
    });

    it("falls back to baseline when subscription is EXPIRED or PAST_DUE", () => {
      const expiredSub = createSubscription({
        userId: "usr_lapsed_user",
        planId: "plan_safety_plus",
        status: "EXPIRED",
      });

      const entitlements = getEntitlements({
        userId: "usr_lapsed_user",
        subscription: expiredSub,
        plan: samplePlan,
      });

      expect(entitlements.isSubscriptionActive).toBe(false);
      expect(entitlements.canCoreEmergencyProfile).toBe(true); // Core safety preserved
      expect(entitlements.canScanHistory).toBe(false); // Premium feature gated
      expect(entitlements.canAdvancedAnalytics).toBe(false);
    });
  });

  describe("CRITICAL QR SAFETY INVARIANT: Subscription Expiry != QR Identity Destruction (Sections 51 & 55)", () => {
    it("guarantees public emergency QR resolution and emergency calling remain ACTIVE even when subscription expires", () => {
      // Scenario: Active physical QR on a vehicle whose annual subscription has expired
      const safety = getSafetyCapabilities({
        qrStatus: "ACTIVATED",
        subscriptionStatus: "EXPIRED",
      });

      // NON-NEGOTIABLE SAFETY INVARIANT:
      // Commercial expiry MUST NEVER disable the finder emergency page or emergency call buttons!
      expect(safety.allowEmergencyResolution).toBe(true);
      expect(safety.allowEmergencyCalling).toBe(true);
      expect(safety.allowMedicalInfoDisplay).toBe(true);
      expect(safety.isCoreSafetyOnly).toBe(true);
    });

    it("guarantees public emergency resolution remains ACTIVE when subscription is PAST_DUE (payment grace period)", () => {
      const safety = getSafetyCapabilities({
        qrStatus: "ACTIVATED",
        subscriptionStatus: "PAST_DUE",
      });

      expect(safety.allowEmergencyResolution).toBe(true);
      expect(safety.allowEmergencyCalling).toBe(true);
      expect(safety.isCoreSafetyOnly).toBe(true);
    });

    it("blocks public resolution only when physical QR itself is inactive (e.g. BLOCKED, REPLACED)", () => {
      const blockedQrSafety = getSafetyCapabilities({
        qrStatus: "BLOCKED",
        subscriptionStatus: "ACTIVE", // Even if subscription is active, blocked QR is denied
      });

      expect(blockedQrSafety.allowEmergencyResolution).toBe(false);
      expect(blockedQrSafety.allowEmergencyCalling).toBe(false);
    });
  });
});
