/**
 * VaahanSafe Business Entitlement Model
 *
 * INVARIANTS:
 * - Entitlements are business capabilities derived dynamically from Plan and Subscription status.
 * - Entitlements are NOT stored as random individual booleans on the user account row.
 * - Server-side authoritative evaluation.
 */

export const ENTITLEMENT_KEYS = [
  "CORE_EMERGENCY_PROFILE",
  "CONTACT_LIMIT",
  "SCAN_HISTORY",
  "ADVANCED_ANALYTICS",
  "ALERTS",
  "MULTIPLE_VEHICLES",
  "PRIORITY_SUPPORT",
] as const;

export type EntitlementKey = (typeof ENTITLEMENT_KEYS)[number];

export interface UserEntitlements {
  canCoreEmergencyProfile: boolean;
  contactLimit: number;
  vehicleLimit: number;
  canScanHistory: boolean;
  canAdvancedAnalytics: boolean;
  canPrioritySupport: boolean;
  isSubscriptionActive: boolean;
}
