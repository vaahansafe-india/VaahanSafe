/**
 * VaahanSafe Refund Lifecycle State Machine
 *
 * INVARIANTS:
 * - Refund is an independent financial lifecycle.
 * - Payment success is never mutated to "FAILED" to represent a refund.
 * - Idempotency and audit tracking are mandatory for all refund actions.
 */

export const REFUND_STATUSES = [
  "REQUESTED",
  "PENDING",
  "PROCESSED",
  "FAILED",
  "REJECTED",
] as const;

export type RefundStatus = (typeof REFUND_STATUSES)[number];

const VALID_REFUND_TRANSITIONS: Record<RefundStatus, readonly RefundStatus[]> = {
  REQUESTED: ["PENDING", "REJECTED"],
  PENDING: ["PROCESSED", "FAILED"],
  FAILED: ["PENDING"], // Retry failed provider refund
  PROCESSED: [],
  REJECTED: [],
};

/**
 * Validates whether a refund status transition is allowed.
 */
export function canTransitionRefundStatus(from: RefundStatus, to: RefundStatus): boolean {
  if (from === to) return true;
  const allowed = VALID_REFUND_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}
