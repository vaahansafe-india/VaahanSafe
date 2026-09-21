/**
 * Shipment Transition Policy & Out-of-Order Event Protection
 *
 * Prevents illegal transitions and stale status downgrades caused by delayed carrier callbacks.
 */

import { ShipmentStatus } from "./shipment-status";
import { InvalidShipmentTransitionError } from "../errors/shipping-errors";

export interface ShipmentTransitionResult {
  allowed: boolean;
  reason?: string;
  isStaleEvent?: boolean;
}

const ALLOWED_SHIPMENT_TRANSITIONS: Record<ShipmentStatus, readonly ShipmentStatus[]> = {
  PENDING: ["MANIFESTED", "PICKED_UP", "CANCELLED"],
  MANIFESTED: ["PICKED_UP", "IN_TRANSIT", "CANCELLED"],
  PICKED_UP: ["IN_TRANSIT", "OUT_FOR_DELIVERY", "CANCELLED"],
  IN_TRANSIT: ["OUT_FOR_DELIVERY", "DELIVERED", "DELIVERY_FAILED", "RTO_INITIATED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "DELIVERY_FAILED", "RTO_INITIATED"],
  DELIVERY_FAILED: ["OUT_FOR_DELIVERY", "RTO_INITIATED"],
  RTO_INITIATED: ["RTO_DELIVERED"],
  DELIVERED: [], // Terminal: never downgrade
  RTO_DELIVERED: [], // Terminal
  CANCELLED: [], // Terminal
};

export function evaluateShipmentTransition(
  currentStatus: ShipmentStatus,
  incomingStatus: ShipmentStatus
): ShipmentTransitionResult {
  if (currentStatus === incomingStatus) {
    return { allowed: true };
  }

  // Out-of-order protection: once DELIVERED or RTO_DELIVERED, incoming non-terminal events are stale
  if (currentStatus === "DELIVERED" || currentStatus === "RTO_DELIVERED") {
    return {
      allowed: false,
      isStaleEvent: true,
      reason: `Ignored stale shipping event "${incomingStatus}" for already finalized shipment in "${currentStatus}" state`,
    };
  }

  const allowedTargets = ALLOWED_SHIPMENT_TRANSITIONS[currentStatus];
  if (!allowedTargets || !allowedTargets.includes(incomingStatus)) {
    return {
      allowed: false,
      reason: `Illegal shipment status transition from "${currentStatus}" to "${incomingStatus}"`,
    };
  }

  return { allowed: true };
}

export function isValidShipmentTransition(
  currentStatus: ShipmentStatus,
  incomingStatus: ShipmentStatus
): boolean {
  return evaluateShipmentTransition(currentStatus, incomingStatus).allowed;
}

export function shouldIgnoreShipmentEvent(
  currentStatus: ShipmentStatus,
  incomingStatus: ShipmentStatus
): boolean {
  const result = evaluateShipmentTransition(currentStatus, incomingStatus);
  return result.isStaleEvent === true;
}

export function assertValidShipmentTransition(
  currentStatus: ShipmentStatus,
  incomingStatus: ShipmentStatus
): void {
  const result = evaluateShipmentTransition(currentStatus, incomingStatus);
  if (!result.allowed) {
    throw new InvalidShipmentTransitionError(currentStatus, incomingStatus);
  }
}
