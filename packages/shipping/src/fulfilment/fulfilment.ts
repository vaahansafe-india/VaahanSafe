/**
 * Fulfilment Domain Entity
 *
 * Represents physical logistics and packing tasks required to fulfill an order.
 * INVARIANT: Order address snapshot is immutable at fulfilment creation time.
 */

import { FulfilmentType } from "./fulfilment-type";
import { FulfilmentStatus } from "./fulfilment-status";

export interface ShippingAddressSnapshot {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Fulfilment {
  id: string;
  orderId: string;
  userId: string;
  type: FulfilmentType;
  status: FulfilmentStatus;
  shippingAddressSnapshot: ShippingAddressSnapshot;
  exceptionCode?: string;
  processingAt?: string;
  packedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFulfilmentInput {
  id?: string;
  orderId: string;
  userId: string;
  type?: FulfilmentType;
  status?: FulfilmentStatus;
  shippingAddressSnapshot: ShippingAddressSnapshot;
  createdAt?: string;
}

export function createFulfilment(input: CreateFulfilmentInput): Fulfilment {
  const now = input.createdAt || new Date().toISOString();
  return {
    id: input.id || `ful_${crypto.randomUUID()}`,
    orderId: input.orderId,
    userId: input.userId,
    type: input.type || "PHYSICAL_QR",
    status: input.status || "PAID",
    shippingAddressSnapshot: input.shippingAddressSnapshot,
    createdAt: now,
    updatedAt: now,
  };
}
