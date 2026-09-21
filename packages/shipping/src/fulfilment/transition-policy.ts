/**
 * Fulfilment Transition Policy
 *
 * Enforces valid state machine transitions for physical fulfilment operations.
 * INVARIANT: Arbitrary status mutations are strictly rejected.
 */

import { FulfilmentStatus } from "./fulfilment-status";
import { InvalidFulfilmentTransitionError } from "../errors/shipping-errors";

export interface TransitionResult {
  allowed: boolean;
  reason?: string;
}

const ALLOWED_FULFILMENT_TRANSITIONS: Record<FulfilmentStatus, readonly FulfilmentStatus[]> = {
  PAID: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["PACKED", "CANCELLED"],
  PACKED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["OUT_FOR_DELIVERY", "DELIVERED", "DELIVERY_FAILED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "DELIVERY_FAILED"],
  DELIVERY_FAILED: ["OUT_FOR_DELIVERY", "RTO"], // can re-attempt delivery or initiate RTO
  RTO: ["RECEIVED_RTO"],
  DELIVERED: [], // Terminal
  RECEIVED_RTO: [], // Terminal: quarantined for inspection
  CANCELLED: [], // Terminal
};

export function evaluateFulfilmentTransition(
  fromStatus: FulfilmentStatus,
  toStatus: FulfilmentStatus
): TransitionResult {
  if (fromStatus === toStatus) {
    return { allowed: true };
  }

  const allowedTargets = ALLOWED_FULFILMENT_TRANSITIONS[fromStatus];
  if (!allowedTargets || !allowedTargets.includes(toStatus)) {
    return {
      allowed: false,
      reason: `Illegal fulfilment transition from "${fromStatus}" to "${toStatus}"`,
    };
  }

  return { allowed: true };
}

export function isValidFulfilmentTransition(
  fromStatus: FulfilmentStatus,
  toStatus: FulfilmentStatus
): boolean {
  return evaluateFulfilmentTransition(fromStatus, toStatus).allowed;
}

export function assertValidFulfilmentTransition(
  fromStatus: FulfilmentStatus,
  toStatus: FulfilmentStatus
): void {
  const result = evaluateFulfilmentTransition(fromStatus, toStatus);
  if (!result.allowed) {
    throw new InvalidFulfilmentTransitionError(fromStatus, toStatus);
  }
}
