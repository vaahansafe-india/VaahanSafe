/**
 * VaahanSafe Order Lifecycle State Machine
 *
 * INVARIANTS:
 * - Order status != Payment status.
 * - Explicit transition matrix preventing illegal jumps.
 * - Terminal states cannot transition back to active/pending states.
 */

import { InvalidOrderStateError } from "../errors/commerce-errors";

export const ORDER_STATUSES = [
  "DRAFT",
  "PENDING_PAYMENT",
  "PAID",
  "FULFILMENT_PENDING",
  "FULFILLED",
  "PAYMENT_FAILED",
  "EXPIRED",
  "REFUNDED",
  "CANCELLED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

const VALID_ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  DRAFT: ["PENDING_PAYMENT", "CANCELLED"],
  PENDING_PAYMENT: ["PAID", "PAYMENT_FAILED", "EXPIRED", "CANCELLED"],
  PAYMENT_FAILED: ["PENDING_PAYMENT", "EXPIRED", "CANCELLED"], // Retry path
  PAID: ["FULFILMENT_PENDING", "REFUNDED"],
  FULFILMENT_PENDING: ["FULFILLED", "REFUNDED"],
  FULFILLED: ["REFUNDED"],
  EXPIRED: [],
  REFUNDED: [],
  CANCELLED: [],
};

/**
 * Validates whether an order status transition is allowed by business domain rules.
 */
export function canTransitionOrderStatus(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return true;
  const allowed = VALID_ORDER_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

/**
 * Asserts valid order status transition or throws InvalidOrderStateError.
 */
export function assertValidOrderStatusTransition(from: OrderStatus, to: OrderStatus): void {
  if (!canTransitionOrderStatus(from, to)) {
    throw new InvalidOrderStateError(from, to);
  }
}
