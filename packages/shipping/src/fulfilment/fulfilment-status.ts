/**
 * Canonical Fulfilment Lifecycle Statuses
 *
 * INVARIANT: Models the operational and physical packing/delivery work for an order.
 * Strictly separate from Order status, Payment status, and QR activation.
 */

export const FULFILMENT_STATUSES = [
  "PAID",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "DELIVERY_FAILED",
  "RTO",
  "RECEIVED_RTO",
  "CANCELLED",
] as const;

export type FulfilmentStatus = (typeof FULFILMENT_STATUSES)[number];

export function isValidFulfilmentStatus(status: string): status is FulfilmentStatus {
  return (FULFILMENT_STATUSES as readonly string[]).includes(status);
}

export function isTerminalFulfilmentStatus(status: FulfilmentStatus): boolean {
  return ["DELIVERED", "RECEIVED_RTO", "CANCELLED"].includes(status);
}
