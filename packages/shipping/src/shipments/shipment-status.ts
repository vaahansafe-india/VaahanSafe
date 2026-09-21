/**
 * Canonical Shipment Transit Statuses
 *
 * Models physical parcel movement through carrier logistics networks.
 */

export const SHIPMENT_STATUSES = [
  "PENDING",
  "MANIFESTED",
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "DELIVERY_FAILED",
  "RTO_INITIATED",
  "RTO_DELIVERED",
  "CANCELLED",
] as const;

export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export function isValidShipmentStatus(status: string): status is ShipmentStatus {
  return (SHIPMENT_STATUSES as readonly string[]).includes(status);
}

export function isTerminalShipmentStatus(status: ShipmentStatus): boolean {
  return ["DELIVERED", "RTO_DELIVERED", "CANCELLED"].includes(status);
}
