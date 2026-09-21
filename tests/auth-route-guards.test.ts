import { describe, it, expect } from "vitest";
import type { User } from "@vaahansafe/types";
import { evaluateRouteGuard } from "@vaahansafe/auth";

describe("Section 7.4: Route Guard Matrix Evaluator", () => {
  const completedUser: User = {
    id: "usr_completed_1",
    phone: "+919876543210",
    email: "user@example.com",
    name: "Aman Gupta",
    role: "CUSTOMER",
    onboardingState: "COMPLETED",
    status: "ACTIVE",
    createdAt: "2026-09-01T00:00:00Z",
    updatedAt: "2026-09-01T00:00:00Z",
  };

  const phoneRequiredUser: User = {
    ...completedUser,
    id: "usr_phone_req",
    phone: undefined,
    onboardingState: "PHONE_REQUIRED",
  };

  const profileRequiredUser: User = {
    ...completedUser,
    id: "usr_profile_req",
    name: undefined,
    onboardingState: "PROFILE_REQUIRED",
  };

  const suspendedUser: User = {
    ...completedUser,
    id: "usr_suspended",
    status: "SUSPENDED",
  };

  const adminUser: User = {
    id: "adm_super_1",
    email: "admin@vaahansafe.com",
    name: "Admin Officer",
    role: "SUPER_ADMIN",
    onboardingState: "COMPLETED",
    status: "ACTIVE",
    createdAt: "2026-09-01T00:00:00Z",
    updatedAt: "2026-09-01T00:00:00Z",
  };

  describe("Public website / blog / status", () => {
    it("allows unauthenticated public access", () => {
      const decision = evaluateRouteGuard({
        routeClass: "PUBLIC",
        user: null,
      });
      expect(decision.allowed).toBe(true);
    });
  });

  describe("QR emergency profile", () => {
    it("allows public access for emergency projection without requiring authentication", () => {
      const decision = evaluateRouteGuard({
        routeClass: "QR_EMERGENCY_PROFILE",
        user: null,
      });
      expect(decision.allowed).toBe(true);
    });
  });

  describe("Activation scratch entry", () => {
    it("allows unauthenticated access for initial scratch entry landing", () => {
      const decision = evaluateRouteGuard({
        routeClass: "ACTIVATION_SCRATCH_ENTRY",
        activationStage: "ENTRY",
        user: null,
      });
      expect(decision.allowed).toBe(true);
    });

    it("requires authentication and verified mobile before claiming QR ownership", () => {
      // 1. Unauthenticated -> rejected with redirect to /login
      const unauth = evaluateRouteGuard({
        routeClass: "ACTIVATION_SCRATCH_ENTRY",
        activationStage: "CLAIM_OWNERSHIP",
        user: null,
      });
      expect(unauth.allowed).toBe(false);
      expect(unauth.redirectTo).toBe("/login");
      expect(unauth.statusCode).toBe(401);

      // 2. Google-first user with PHONE_REQUIRED -> rejected with redirect to /onboarding/phone
      const unverifiedMobile = evaluateRouteGuard({
        routeClass: "ACTIVATION_SCRATCH_ENTRY",
        activationStage: "CLAIM_OWNERSHIP",
        user: phoneRequiredUser,
      });
      expect(unverifiedMobile.allowed).toBe(false);
      expect(unverifiedMobile.redirectTo).toBe("/onboarding/phone");

      // 3. User with verified mobile (PROFILE_REQUIRED or COMPLETED) -> allowed to claim ownership
      const verifiedMobile = evaluateRouteGuard({
        routeClass: "ACTIVATION_SCRATCH_ENTRY",
        activationStage: "CLAIM_OWNERSHIP",
        user: profileRequiredUser,
      });
      expect(verifiedMobile.allowed).toBe(true);
    });

    it("requires onboarding completion before final sticker activation", () => {
      // Incomplete profile -> rejected
      const profileIncomplete = evaluateRouteGuard({
        routeClass: "ACTIVATION_SCRATCH_ENTRY",
        activationStage: "ACTIVATE_STICKER",
        user: profileRequiredUser,
      });
      expect(profileIncomplete.allowed).toBe(false);
      expect(profileIncomplete.redirectTo).toBe("/onboarding/profile");

      // Fully onboarded -> allowed
      const fullyOnboarded = evaluateRouteGuard({
        routeClass: "ACTIVATION_SCRATCH_ENTRY",
        activationStage: "ACTIVATE_STICKER",
        user: completedUser,
      });
      expect(fullyOnboarded.allowed).toBe(true);
    });
  });

  describe("Customer dashboard", () => {
    it("redirects unauthenticated visitor to /login", () => {
      const decision = evaluateRouteGuard({
        routeClass: "CUSTOMER_DASHBOARD",
        user: null,
      });
      expect(decision.allowed).toBe(false);
      expect(decision.redirectTo).toBe("/login");
      expect(decision.statusCode).toBe(401);
    });

    it("redirects user with unverified mobile to /onboarding/phone", () => {
      const decision = evaluateRouteGuard({
        routeClass: "CUSTOMER_DASHBOARD",
        user: phoneRequiredUser,
      });
      expect(decision.allowed).toBe(false);
      expect(decision.redirectTo).toBe("/onboarding/phone");
    });

    it("redirects user with incomplete profile to /onboarding/profile", () => {
      const decision = evaluateRouteGuard({
        routeClass: "CUSTOMER_DASHBOARD",
        user: profileRequiredUser,
      });
      expect(decision.allowed).toBe(false);
      expect(decision.redirectTo).toBe("/onboarding/profile");
    });

    it("blocks suspended user account", () => {
      const decision = evaluateRouteGuard({
        routeClass: "CUSTOMER_DASHBOARD",
        user: suspendedUser,
      });
      expect(decision.allowed).toBe(false);
      expect(decision.statusCode).toBe(403);
      expect(decision.redirectTo).toBe("/account-suspended");
    });

    it("allows fully onboarded customer into dashboard", () => {
      const decision = evaluateRouteGuard({
        routeClass: "CUSTOMER_DASHBOARD",
        user: completedUser,
      });
      expect(decision.allowed).toBe(true);
    });
  });

  describe("Checkout", () => {
    it("enforces authentication, mobile verification, onboarding, and shipping/vehicle requirements", () => {
      // Missing auth
      expect(evaluateRouteGuard({ routeClass: "CHECKOUT", user: null }).allowed).toBe(false);

      // Incomplete mobile
      expect(evaluateRouteGuard({ routeClass: "CHECKOUT", user: phoneRequiredUser }).redirectTo).toBe("/onboarding/phone");

      // Incomplete profile
      expect(evaluateRouteGuard({ routeClass: "CHECKOUT", user: profileRequiredUser }).redirectTo).toBe("/onboarding/profile");

      // Missing shipping address
      const missingAddr = evaluateRouteGuard({
        routeClass: "CHECKOUT",
        user: completedUser,
        checkoutRequirements: { hasShippingAddress: false, hasSelectedVehicle: true },
      });
      expect(missingAddr.allowed).toBe(false);
      expect(missingAddr.redirectTo).toBe("/checkout/address");

      // Valid checkout
      const validCheckout = evaluateRouteGuard({
        routeClass: "CHECKOUT",
        user: completedUser,
        checkoutRequirements: { hasShippingAddress: true, hasSelectedVehicle: true },
      });
      expect(validCheckout.allowed).toBe(true);
    });
  });

  describe("Admin portal", () => {
    it("requires admin authentication and RBAC, with mobile/onboarding marked N/A", () => {
      // Unauthenticated
      const unauth = evaluateRouteGuard({ routeClass: "ADMIN", user: null });
      expect(unauth.allowed).toBe(false);
      expect(unauth.redirectTo).toBe("/admin/login");

      // Regular customer trying to access admin
      const customerForbidden = evaluateRouteGuard({ routeClass: "ADMIN", user: completedUser });
      expect(customerForbidden.allowed).toBe(false);
      expect(customerForbidden.statusCode).toBe(403);

      // Authorized admin allowed (even if phone/onboarding status is N/A)
      const adminAllowed = evaluateRouteGuard({ routeClass: "ADMIN", user: adminUser });
      expect(adminAllowed.allowed).toBe(true);
    });
  });
});
