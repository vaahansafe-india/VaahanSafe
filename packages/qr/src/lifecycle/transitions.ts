/**
 * VaahanSafe QR State Machine & Allowed Transition Policy
 *
 * SECTION 14 — STATE MACHINE — NOT A STRING FIELD:
 * Enforces authoritative domain state transition rules.
 * Arbitrary status mutations are strictly rejected.
 */

import { QrLifecycleState } from "./qr-status";

export interface TransitionEvaluation {
  allowed: boolean;
  reason?: string;
}

const ALLOWED_TRANSITIONS: Record<QrLifecycleState, readonly QrLifecycleState[]> = {
  PRINTED: [
    "IN_TRANSIT_DISTRIBUTOR",
    "WITH_DISTRIBUTOR",
    "EXPIRED_UNSOLD",
    "LOST_DAMAGED",
    "BLOCKED",
  ],
  IN_TRANSIT_DISTRIBUTOR: [
    "WITH_DISTRIBUTOR",
    "LOST_DAMAGED",
    "BLOCKED",
  ],
  WITH_DISTRIBUTOR: [
    "WITH_RETAILER",
    "IN_TRANSIT_DISTRIBUTOR",
    "EXPIRED_UNSOLD",
    "LOST_DAMAGED",
    "BLOCKED",
  ],
  WITH_RETAILER: [
    "SOLD",
    "ACTIVATED",
    "WITH_DISTRIBUTOR",
    "EXPIRED_UNSOLD",
    "LOST_DAMAGED",
    "BLOCKED",
  ],
  SOLD: [
    "ACTIVATED",
    "EXPIRED_UNSOLD",
    "LOST_DAMAGED",
    "BLOCKED",
  ],
  ACTIVATED: [
    "REPLACED",
    "LOST_DAMAGED",
    "BLOCKED",
  ],
  REPLACED: [
    "BLOCKED", // Terminal state: cannot be reactivated or returned to inventory
  ],
  LOST_DAMAGED: [
    "BLOCKED", // Terminal state: cannot be reactivated or returned to inventory
  ],
  EXPIRED_UNSOLD: [
    "BLOCKED", // Terminal state: expired stock cannot be activated
  ],
  BLOCKED: [
    "LOST_DAMAGED", // Administrative decommissioning
  ],
};

/**
 * Evaluates whether a state transition from `from` to `to` is legally permissible.
 */
export function canTransitionQrStatus(
  from: QrLifecycleState,
  to: QrLifecycleState
): TransitionEvaluation {
  if (from === to) {
    return { allowed: true };
  }

  const allowedTargets = ALLOWED_TRANSITIONS[from];
  if (!allowedTargets || !allowedTargets.includes(to)) {
    if (from === "REPLACED") {
      return {
        allowed: false,
        reason: `Illegal transition: Replaced QR stickers are permanently retired and cannot transition to ${to}.`,
      };
    }
    if (from === "LOST_DAMAGED") {
      return {
        allowed: false,
        reason: `Illegal transition: Lost or damaged QR stickers are permanently decommissioned and cannot transition to ${to}.`,
      };
    }
    if (from === "EXPIRED_UNSOLD") {
      return {
        allowed: false,
        reason: `Illegal transition: Expired unsold inventory cannot transition to ${to}.`,
      };
    }
    if (from === "PRINTED" && to === "ACTIVATED") {
      return {
        allowed: false,
        reason: "Illegal transition: Newly printed QR stickers must pass through distribution/retail before activation.",
      };
    }

    return {
      allowed: false,
      reason: `Illegal transition: Status cannot transition from ${from} to ${to}.`,
    };
  }

  return { allowed: true };
}

/**
 * Asserts that a status transition is permitted, throwing an error if invalid.
 */
export function assertCanTransitionQrStatus(
  from: QrLifecycleState,
  to: QrLifecycleState
): void {
  const result = canTransitionQrStatus(from, to);
  if (!result.allowed) {
    throw new Error(result.reason || `Cannot transition QR from ${from} to ${to}`);
  }
}
