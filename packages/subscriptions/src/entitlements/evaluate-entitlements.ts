/**
 * VaahanSafe Centralized Entitlement Evaluator
 *
 * INVARIANTS:
 * - Computes effective permissions server-side.
 * - Core life-safety emergency profile capability remains active even if subscription is expired/lapsed.
 */

import { Subscription } from "../domain/subscription";
import { UserEntitlements } from "./entitlement";

export interface PlanContext {
  code: string;
  vehicleLimit: number;
  contactLimit: number;
  features: string[];
  isActive: boolean;
}

export interface EvaluateEntitlementsInput {
  userId: string;
  subscription?: Subscription | null;
  plan?: PlanContext | null;
}

/**
 * Centrally evaluates user business capabilities.
 */
export function getEntitlements(input: EvaluateEntitlementsInput): UserEntitlements {
  const { subscription, plan } = input;
  const isSubscriptionActive = subscription?.status === "ACTIVE";

  // Base capabilities (Life-Safety Baseline)
  const entitlements: UserEntitlements = {
    canCoreEmergencyProfile: true, // Life-safety invariant: baseline QR functionality
    contactLimit: 1,
    vehicleLimit: 1,
    canScanHistory: false,
    canAdvancedAnalytics: false,
    canPrioritySupport: false,
    isSubscriptionActive,
  };

  // If subscription is active, expand capabilities according to commercial plan
  if (isSubscriptionActive && plan) {
    entitlements.contactLimit = Math.max(entitlements.contactLimit, plan.contactLimit);
    entitlements.vehicleLimit = Math.max(entitlements.vehicleLimit, plan.vehicleLimit);
    entitlements.canScanHistory = plan.features.includes("SCAN_HISTORY");
    entitlements.canAdvancedAnalytics = plan.features.includes("ADVANCED_ANALYTICS");
    entitlements.canPrioritySupport = plan.features.includes("PRIORITY_SUPPORT");
  }

  return entitlements;
}
