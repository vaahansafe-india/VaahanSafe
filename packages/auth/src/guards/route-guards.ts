/**
 * VaahanSafe Route Guard Matrix Evaluator
 *
 * Section 7.4 Route guard matrix:
 * Route class               | Authenticated | Verified mobile    | Onboarding complete      | Extra
 * ------------------------------------------------------------------------------------------------------------------
 * Public website/blog/status| No            | No                 | No                       | —
 * QR emergency profile      | No            | No                 | No                       | Public projection only
 * Activation scratch entry  | No initially  | Before ownership   | Before final activation  | Turnstile/rate limit
 * Customer dashboard        | Yes           | Yes                | Yes                      | Session
 * Checkout                  | Yes           | Yes                | Yes                      | Vehicle/address as req.
 * Admin                     | Yes           | N/A                | N/A                      | Admin RBAC + MFA/stepup
 */

import type { User, Session, RouteClass, UserRole } from "@vaahansafe/types";

export type ActivationStage = "ENTRY" | "CLAIM_OWNERSHIP" | "ACTIVATE_STICKER";

export interface RouteGuardContext {
  routeClass: RouteClass;
  user?: User | null;
  session?: Session | null;
  activationStage?: ActivationStage;
  checkoutRequirements?: {
    hasShippingAddress?: boolean;
    hasSelectedVehicle?: boolean;
  };
}

export interface RouteGuardDecision {
  allowed: boolean;
  redirectTo?: string;
  statusCode?: number;
  reason?: string;
}

const ADMIN_ROLES: ReadonlySet<string> = new Set([
  "ADMIN",
  "SUPER_ADMIN",
  "OPS_ADMIN",
  "SUPPORT_AGENT",
  "FINANCE_ADMIN",
  "CONTENT_EDITOR",
  "STATUS_MANAGER",
  "READ_ONLY_ANALYST",
]);

/**
 * Evaluates access control and routing decisions according to the Section 7.4 matrix.
 */
export function evaluateRouteGuard(context: RouteGuardContext): RouteGuardDecision {
  const { routeClass, user, activationStage, checkoutRequirements } = context;

  switch (routeClass) {
    case "PUBLIC":
      return { allowed: true };

    case "QR_EMERGENCY_PROFILE":
      // Emergency projection is open to the public; scanned by any first-responder/passerby
      return { allowed: true };

    case "ACTIVATION_SCRATCH_ENTRY": {
      const stage = activationStage || "ENTRY";

      // 1. Initial scratch code landing: open initially without authentication
      if (stage === "ENTRY") {
        return { allowed: true };
      }

      // 2. Ownership claiming requires authenticated user with verified mobile
      if (stage === "CLAIM_OWNERSHIP") {
        if (!user) {
          return { allowed: false, redirectTo: "/login", statusCode: 401, reason: "Authentication required to claim QR code ownership" };
        }
        if (user.onboardingState === "PHONE_REQUIRED") {
          return { allowed: false, redirectTo: "/onboarding/phone", statusCode: 403, reason: "Verified mobile required before claiming QR ownership" };
        }
        return { allowed: true };
      }

      // 3. Final sticker activation requires full onboarding completion
      if (stage === "ACTIVATE_STICKER") {
        if (!user) {
          return { allowed: false, redirectTo: "/login", statusCode: 401, reason: "Authentication required for final QR activation" };
        }
        if (user.onboardingState === "PHONE_REQUIRED") {
          return { allowed: false, redirectTo: "/onboarding/phone", statusCode: 403, reason: "Verified mobile required" };
        }
        if (user.onboardingState !== "COMPLETED") {
          return { allowed: false, redirectTo: "/onboarding/profile", statusCode: 403, reason: "Onboarding must be complete before activating QR sticker" };
        }
        return { allowed: true };
      }

      return { allowed: false, statusCode: 400, reason: "Invalid activation stage" };
    }

    case "CUSTOMER_DASHBOARD": {
      if (!user) {
        return { allowed: false, redirectTo: "/login", statusCode: 401, reason: "Authentication required" };
      }
      if (user.status === "SUSPENDED") {
        return { allowed: false, redirectTo: "/account-suspended", statusCode: 403, reason: "Account is suspended" };
      }
      if (user.onboardingState === "PHONE_REQUIRED") {
        return { allowed: false, redirectTo: "/onboarding/phone", statusCode: 403, reason: "Mobile verification required" };
      }
      if (user.onboardingState === "PROFILE_REQUIRED") {
        return { allowed: false, redirectTo: "/onboarding/profile", statusCode: 403, reason: "Profile completion required" };
      }
      return { allowed: true };
    }

    case "CHECKOUT": {
      if (!user) {
        return { allowed: false, redirectTo: "/login", statusCode: 401, reason: "Authentication required to checkout" };
      }
      if (user.onboardingState === "PHONE_REQUIRED") {
        return { allowed: false, redirectTo: "/onboarding/phone", statusCode: 403, reason: "Mobile verification required for checkout" };
      }
      if (user.onboardingState !== "COMPLETED") {
        return { allowed: false, redirectTo: "/onboarding/profile", statusCode: 403, reason: "Profile must be complete before checkout" };
      }
      if (checkoutRequirements) {
        if (checkoutRequirements.hasShippingAddress === false) {
          return { allowed: false, redirectTo: "/checkout/address", statusCode: 422, reason: "Shipping address required" };
        }
        if (checkoutRequirements.hasSelectedVehicle === false) {
          return { allowed: false, redirectTo: "/checkout/vehicle", statusCode: 422, reason: "Vehicle selection required" };
        }
      }
      return { allowed: true };
    }

    case "ADMIN": {
      if (!user) {
        return { allowed: false, redirectTo: "/admin/login", statusCode: 401, reason: "Admin authentication required" };
      }
      if (!ADMIN_ROLES.has(user.role)) {
        return { allowed: false, statusCode: 403, reason: "Forbidden: Access restricted to authorized administrative personnel" };
      }
      // Mobile and Onboarding are N/A for admin portal
      return { allowed: true };
    }

    default:
      return { allowed: false, statusCode: 404, reason: "Unknown route class" };
  }
}
