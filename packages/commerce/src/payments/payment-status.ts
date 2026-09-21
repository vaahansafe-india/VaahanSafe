/**
 * VaahanSafe Payment Lifecycle State Machine
 *
 * INVARIANTS:
 * - Payment status represents financial settlement state.
 * - Explicit transitions prevent illegal states (e.g. FAILED -> SUCCESS without new attempt).
 * - Terminal states are protected against corruption by delayed out-of-order events.
 */

import { InvalidPaymentStateError } from "../errors/commerce-errors";

export const PAYMENT_STATUSES = [
  "CREATED",
  "PENDING",
  "SUCCESS",
  "FAILED",
  "EXPIRED",
  "REFUND_PENDING",
  "REFUNDED",
  "REFUND_FAILED",
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

const VALID_PAYMENT_TRANSITIONS: Record<PaymentStatus, readonly PaymentStatus[]> = {
  CREATED: ["PENDING", "FAILED", "EXPIRED"],
  PENDING: ["SUCCESS", "FAILED", "EXPIRED"],
  SUCCESS: ["REFUND_PENDING"],
  REFUND_PENDING: ["REFUNDED", "REFUND_FAILED"],
  REFUND_FAILED: ["REFUND_PENDING"], // Allow retry of failed refund
  FAILED: [],
  EXPIRED: [],
  REFUNDED: [],
};

/**
 * Validates whether a payment status transition is allowed.
 */
export function canTransitionPaymentStatus(from: PaymentStatus, to: PaymentStatus): boolean {
  if (from === to) return true;
  const allowed = VALID_PAYMENT_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

/**
 * Asserts valid payment status transition or throws InvalidPaymentStateError.
 */
export function assertValidPaymentStatusTransition(from: PaymentStatus, to: PaymentStatus): void {
  if (!canTransitionPaymentStatus(from, to)) {
    throw new InvalidPaymentStateError(from, to);
  }
}
