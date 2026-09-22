/**
 * VaahanSafe Subscription Domain Entity
 *
 * INVARIANTS:
 * - Subscriptions represent time-bound commercial service entitlements.
 * - Subscriptions reference user_id and optionally vehicle_id.
 * - Provider fields remain external integration metadata.
 */

import { SubscriptionStatus } from "./subscription-status";
import { SubscriptionDomainError } from "../errors/subscription-errors";

export type SubscriptionId = string & { readonly __brand: unique symbol };

export interface Subscription {
  id: SubscriptionId;
  userId: string;
  vehicleId?: string;
  planId: string;
  status: SubscriptionStatus;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  provider: "INTERNAL" | "RAZORPAY" | "CASHFREE";
  providerSubscriptionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubscriptionParams {
  id?: string;
  userId: string;
  vehicleId?: string;
  planId: string;
  status?: SubscriptionStatus;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  provider?: "INTERNAL" | "RAZORPAY" | "CASHFREE";
  providerSubscriptionId?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Generates an opaque SubscriptionId (sub_xxx).
 */
export function generateSubscriptionId(): SubscriptionId {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  let id = "sub_";
  for (let i = 0; i < 12; i++) {
    const byte = bytes[i] ?? 0;
    id += chars.charAt(byte % chars.length);
  }
  return id as SubscriptionId;
}

/**
 * Pure domain factory creating a validated Subscription entity.
 */
export function createSubscription(params: CreateSubscriptionParams): Subscription {
  if (!params.userId || !params.userId.trim()) {
    throw new SubscriptionDomainError("Subscription must belong to an authenticated userId", "INVALID_USER_ID");
  }
  if (!params.planId || !params.planId.trim()) {
    throw new SubscriptionDomainError("Subscription must reference a valid planId", "INVALID_PLAN_ID");
  }

  const now = new Date().toISOString();

  return {
    id: params.id ? (params.id as SubscriptionId) : generateSubscriptionId(),
    userId: params.userId.trim(),
    vehicleId: params.vehicleId?.trim() || undefined,
    planId: params.planId.trim(),
    status: params.status || "CREATED",
    currentPeriodStart: params.currentPeriodStart,
    currentPeriodEnd: params.currentPeriodEnd,
    cancelAtPeriodEnd: params.cancelAtPeriodEnd ?? false,
    provider: params.provider || "INTERNAL",
    providerSubscriptionId: params.providerSubscriptionId?.trim() || undefined,
    createdAt: params.createdAt || now,
    updatedAt: params.updatedAt || now,
  };
}
