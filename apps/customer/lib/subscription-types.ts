/**
 * Authoritative Types for the VaahanSafe Service & Coverage Center
 *
 * CRITICAL ARCHITECTURAL BOUNDARY:
 * VEHICLE → VAAHANSAFE IDENTITY → QR → SERVICE ENTITLEMENT → SUBSCRIPTION → ENABLED SERVICES
 *
 * Each layer is decoupled and server-authoritative.
 */

import type { VaahanIconName } from "@vaahansafe/icons";

export type ServiceEntitlementStatus = "ENABLED" | "BASELINE" | "PLAN_REQUIRED" | "SUSPENDED" | "REVOKED";

export interface ConnectedVehicleServiceItem {
  id: string;
  registrationNumber: string;
  make: string;
  model: string;
  vehicleType: string;
  status: string;
  qr: {
    id: string;
    publicId: string;
    visibleCode: string;
    status: "ACTIVATED" | "ASSIGNED" | "PRINTED" | "REPLACED" | "DAMAGED" | "BLOCKED" | "NOT_ATTACHED";
    activatedAt?: string;
  } | null;
  subscriptionStatus: "ACTIVE" | "BASELINE_ONLY" | "PENDING_PAYMENT" | "PAST_DUE" | "EXPIRED" | "NONE";
  planName?: string;
  entitlementsCount: number;
}

export interface ServiceCapabilityItem {
  id: string;
  name: string;
  category: "RESOLUTION" | "SAFETY" | "COMMUNICATION" | "INTELLIGENCE" | "HARDWARE";
  description: string;
  status: ServiceEntitlementStatus;
  statusLabel: string;
  iconName: VaahanIconName;
  requiresPlan: boolean;
  boundVehiclePlate?: string;
}

export interface CommercialPlanItem {
  id: string;
  code: string;
  name: string;
  description: string;
  billingInterval: "ANNUAL" | "MONTHLY";
  priceMinor: number;
  currency: string;
  vehicleLimit: number;
  contactLimit: number;
  features: string[];
  isActive: boolean;
}

export interface ActiveSubscriptionPassport {
  hasSubscription: boolean;
  id?: string;
  planName: string;
  planCode: string;
  status: "ACTIVE" | "BASELINE_ACTIVE" | "PENDING_PAYMENT" | "PAST_DUE" | "CANCEL_AT_PERIOD_END" | "EXPIRED" | "NO_PLAN";
  statusLabel: string;
  isBaselineContinuity: boolean;
  termStart?: string;
  termEnd?: string;
  cancelAtPeriodEnd: boolean;
  autoRenew: boolean;
  vehicleLimit: number;
  contactLimit: number;
  coveredVehiclesCount: number;
  nextBillingEvent?: {
    date: string;
    description: string;
  };
}

export interface BillingSummaryRecord {
  id: string;
  orderNumber: string;
  status: "PAID" | "PENDING_PAYMENT" | "FAILED" | "REFUNDED";
  amountMinor: number;
  currency: string;
  confirmedAt?: string;
  createdAt: string;
  itemDescription: string;
  paymentMethod?: string;
}

export interface ServiceHistoryTimelineEvent {
  id: string;
  timestamp: string;
  eventType:
    | "HARDWARE_ORDER_PAID"
    | "QR_ACTIVATED"
    | "ENTITLEMENT_GRANTED"
    | "PLAN_ACTIVATED"
    | "PLAN_RENEWED"
    | "RENEWAL_CANCELLED"
    | "VEHICLE_BOUND";
  title: string;
  description: string;
  badgeLabel: string;
  severity: "SUCCESS" | "INFO" | "AMBER" | "MUTED";
}

export interface SubscriptionAttentionItem {
  id: string;
  severity: "AMBER" | "RED" | "INFO";
  title: string;
  description: string;
  actionLabel: string;
  actionTarget: "plan" | "payment" | "vehicle" | "qr" | "contacts";
}

export interface SubscriptionServiceOverview {
  user: {
    id: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  scopedVehicleId?: string;
  passport: ActiveSubscriptionPassport;
  connectedVehicles: ConnectedVehicleServiceItem[];
  availablePlans: CommercialPlanItem[];
  capabilities: ServiceCapabilityItem[];
  billingRecords: BillingSummaryRecord[];
  historyEvents: ServiceHistoryTimelineEvent[];
  attentionItems: SubscriptionAttentionItem[];
}
