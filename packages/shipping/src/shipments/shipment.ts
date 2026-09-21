/**
 * Shipment Domain Entity
 *
 * Tracks the physical movement of a package via a shipping provider or manual dispatch.
 * INVARIANT: Shipping address is private operational data and never exposed via public QR endpoints.
 */

import { ShippingAddressSnapshot } from "../fulfilment/fulfilment";
import { ShipmentStatus } from "./shipment-status";

export interface Shipment {
  id: string;
  fulfilmentId: string;
  orderId: string;
  userId: string;
  provider: string;
  providerShipmentId?: string;
  trackingReference?: string;
  status: ShipmentStatus;
  shippingAddressSnapshot: ShippingAddressSnapshot;
  shippedAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShipmentInput {
  id?: string;
  fulfilmentId: string;
  orderId: string;
  userId: string;
  provider?: string;
  providerShipmentId?: string;
  trackingReference?: string;
  status?: ShipmentStatus;
  shippingAddressSnapshot: ShippingAddressSnapshot;
  createdAt?: string;
}

export function createShipment(input: CreateShipmentInput): Shipment {
  const now = input.createdAt || new Date().toISOString();
  return {
    id: input.id || `shp_${crypto.randomUUID()}`,
    fulfilmentId: input.fulfilmentId,
    orderId: input.orderId,
    userId: input.userId,
    provider: input.provider || "MANUAL",
    providerShipmentId: input.providerShipmentId,
    trackingReference: input.trackingReference,
    status: input.status || "PENDING",
    shippingAddressSnapshot: input.shippingAddressSnapshot,
    createdAt: now,
    updatedAt: now,
  };
}
