/**
 * VaahanSafe Order Item Domain Model & Historical Snapshot
 *
 * INVARIANTS:
 * - Immutable purchase-time line items.
 * - Preserves safe snapshot of product/plan data so historical invoices remain accurate
 *   even if catalog pricing or names change later.
 * - Unit and total prices are strictly integer minor units (paise).
 */

import { CommerceDomainError } from "../errors/commerce-errors";

export type OrderItemId = string & { readonly __brand: unique symbol };

export const ORDER_ITEM_TYPES = [
  "PRODUCT",
  "PLAN",
  "REPLACEMENT_FEE",
  "SHIPPING_FEE",
] as const;
export type OrderItemType = (typeof ORDER_ITEM_TYPES)[number];

export interface OrderItemSnapshot {
  code: string;
  name: string;
  description?: string;
  billingInterval?: string;
  requiresShipping?: boolean;
}

export interface OrderItem {
  id: OrderItemId;
  orderId: string;
  itemType: OrderItemType;
  productId?: string;
  planId?: string;
  catalogCode: string;
  name: string;
  quantity: number;
  unitPriceMinor: number;
  totalPriceMinor: number;
  snapshotJson?: string;
  createdAt: string;
}

export interface CreateOrderItemParams {
  id?: string;
  orderId: string;
  itemType: OrderItemType;
  productId?: string;
  planId?: string;
  catalogCode: string;
  name: string;
  quantity?: number;
  unitPriceMinor: number;
  snapshot?: OrderItemSnapshot;
  createdAt?: string;
}

/**
 * Generates an opaque OrderItemId (item_xxx).
 */
export function generateOrderItemId(): OrderItemId {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  let id = "item_";
  for (let i = 0; i < 12; i++) {
    const byte = bytes[i] ?? 0;
    id += chars.charAt(byte % chars.length);
  }
  return id as OrderItemId;
}

/**
 * Pure domain factory creating an immutable OrderItem with calculated total.
 */
export function createOrderItem(params: CreateOrderItemParams): OrderItem {
  if (!params.orderId || !params.orderId.trim()) {
    throw new CommerceDomainError("Order item must belong to an orderId", "INVALID_ORDER_ID");
  }
  if (!params.catalogCode || !params.catalogCode.trim()) {
    throw new CommerceDomainError("Order item catalogCode is required", "INVALID_CATALOG_CODE");
  }
  if (!Number.isInteger(params.unitPriceMinor) || params.unitPriceMinor < 0) {
    throw new CommerceDomainError("Unit price must be a non-negative integer (paise)", "INVALID_UNIT_PRICE");
  }

  const quantity = params.quantity ?? 1;
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new CommerceDomainError("Item quantity must be a positive integer", "INVALID_QUANTITY");
  }

  const totalPriceMinor = params.unitPriceMinor * quantity;
  const snapshotJson = params.snapshot ? JSON.stringify(params.snapshot) : undefined;
  const now = new Date().toISOString();

  return {
    id: params.id ? (params.id as OrderItemId) : generateOrderItemId(),
    orderId: params.orderId.trim(),
    itemType: params.itemType,
    productId: params.productId?.trim(),
    planId: params.planId?.trim(),
    catalogCode: params.catalogCode.trim().toUpperCase(),
    name: params.name.trim(),
    quantity,
    unitPriceMinor: params.unitPriceMinor,
    totalPriceMinor,
    snapshotJson,
    createdAt: params.createdAt || now,
  };
}
