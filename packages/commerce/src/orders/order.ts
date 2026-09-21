/**
 * VaahanSafe Order Domain Entity
 *
 * INVARIANTS:
 * - Order represents the commercial transaction, not payment.
 * - Idempotency key protects against double-checkout.
 * - Amounts are in integer minor units (paise).
 */

import { Currency } from "../catalog/money";
import { OrderStatus } from "./order-status";
import { CommerceDomainError } from "../errors/commerce-errors";

export type OrderId = string & { readonly __brand: unique symbol };

export interface Order {
  id: OrderId;
  userId: string;
  orderNumber: string;
  status: OrderStatus;
  currency: Currency;
  subtotalMinor: number;
  discountMinor: number;
  shippingMinor: number;
  taxMinor: number;
  totalMinor: number;
  shippingAddressId?: string;
  vehicleId?: string;
  idempotencyKey?: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
}

export interface CreateOrderParams {
  id?: string;
  userId: string;
  orderNumber?: string;
  status?: OrderStatus;
  currency?: Currency;
  subtotalMinor: number;
  discountMinor?: number;
  shippingMinor?: number;
  taxMinor?: number;
  totalMinor: number;
  shippingAddressId?: string;
  vehicleId?: string;
  idempotencyKey?: string;
  createdAt?: string;
  updatedAt?: string;
  paidAt?: string;
}

/**
 * Generates an opaque OrderId (ord_xxx).
 */
export function generateOrderId(): OrderId {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  let id = "ord_";
  for (let i = 0; i < 12; i++) {
    const byte = bytes[i] ?? 0;
    id += chars.charAt(byte % chars.length);
  }
  return id as OrderId;
}

/**
 * Generates human-friendly, auditable Order Number (e.g. VS-ORD-2026-7F3K9021).
 */
export function generateOrderNumber(): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let random = "";
  for (let i = 0; i < 6; i++) {
    const byte = bytes[i] ?? 0;
    random += chars.charAt(byte % chars.length);
  }
  const year = new Date().getFullYear();
  return `VS-ORD-${year}-${random}`;
}

/**
 * Pure domain factory creating a validated Order entity.
 */
export function createOrder(params: CreateOrderParams): Order {
  if (!params.userId || !params.userId.trim()) {
    throw new CommerceDomainError("Order must be associated with an authenticated userId", "INVALID_USER_ID");
  }

  if (!Number.isInteger(params.totalMinor) || params.totalMinor < 0) {
    throw new CommerceDomainError("Total minor amount must be a non-negative integer", "INVALID_ORDER_TOTAL");
  }

  const now = new Date().toISOString();

  return {
    id: params.id ? (params.id as OrderId) : generateOrderId(),
    userId: params.userId.trim(),
    orderNumber: params.orderNumber || generateOrderNumber(),
    status: params.status || "DRAFT",
    currency: params.currency || "INR",
    subtotalMinor: params.subtotalMinor,
    discountMinor: params.discountMinor ?? 0,
    shippingMinor: params.shippingMinor ?? 0,
    taxMinor: params.taxMinor ?? 0,
    totalMinor: params.totalMinor,
    shippingAddressId: params.shippingAddressId?.trim() || undefined,
    vehicleId: params.vehicleId?.trim() || undefined,
    idempotencyKey: params.idempotencyKey?.trim() || undefined,
    createdAt: params.createdAt || now,
    updatedAt: params.updatedAt || now,
    paidAt: params.paidAt,
  };
}
