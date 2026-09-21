/**
 * VaahanSafe Subscription Lifecycle State Machine
 *
 * INVARIANTS:
 * - Subscription != QR Identity.
 * - Explicit transition graph protects historical and commercial state.
 * - Subscription expiration does not destroy underlying QR physical identity.
 */

import { InvalidSubscriptionStateError } from "../errors/subscription-errors";

export const SUBSCRIPTION_STATUSES = [
  "CREATED",
  "PENDING_PAYMENT",
  "ACTIVE",
  "PAST_DUE",
  "CANCEL_AT_PERIOD_END",
  "CANCELLED",
  "EXPIRED",
] as const;

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

const VALID_SUBSCRIPTION_TRANSITIONS: Record<SubscriptionStatus, readonly SubscriptionStatus[]> = {
  CREATED: ["PENDING_PAYMENT", "CANCELLED"],
  PENDING_PAYMENT: ["ACTIVE", "CANCELLED", "EXPIRED"],
  ACTIVE: ["PAST_DUE", "CANCEL_AT_PERIOD_END", "CANCELLED", "EXPIRED"],
  PAST_DUE: ["ACTIVE", "EXPIRED", "CANCELLED"],
  CANCEL_AT_PERIOD_END: ["ACTIVE", "EXPIRED", "CANCELLED"],
  CANCELLED: [],
  EXPIRED: [],
};

/**
 * Validates whether a subscription status transition is allowed.
 */
export function canTransitionSubscriptionStatus(from: SubscriptionStatus, to: SubscriptionStatus): boolean {
  if (from === to) return true;
  const allowed = VALID_SUBSCRIPTION_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

/**
 * Asserts valid subscription status transition or throws InvalidSubscriptionStateError.
 */
export function assertValidSubscriptionStatusTransition(from: SubscriptionStatus, to: SubscriptionStatus): void {
  if (!canTransitionSubscriptionStatus(from, to)) {
    throw new InvalidSubscriptionStateError(from, to);
  }
}
