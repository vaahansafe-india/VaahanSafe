/**
 * VaahanSafe Product Catalog Domain Model
 *
 * INVARIANTS:
 * - Product != QR Inventory != Plan.
 * - Product code is stable business identity (e.g. QR_PHYSICAL_STANDARD), not marketing display text.
 * - Price is stored as integer minor units (paise in INR).
 * - Physical products require shipping & QR inventory allocation; digital products do not.
 */

import { Currency } from "./money";
import { CommerceDomainError } from "../errors/commerce-errors";

export type ProductId = string & { readonly __brand: unique symbol };

export const PRODUCT_TYPES = [
  "PHYSICAL_QR_STICKER",
  "DIGITAL_QR",
  "REPLACEMENT_STICKER",
] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

export const PRODUCT_STATUSES = ["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const STANDARD_PRODUCT_CODES = {
  QR_PHYSICAL_STANDARD: "QR_PHYSICAL_STANDARD",
  QR_DIGITAL_STANDARD: "QR_DIGITAL_STANDARD",
  QR_REPLACEMENT_STANDARD: "QR_REPLACEMENT_STANDARD",
} as const;

export interface Product {
  id: ProductId;
  code: string;
  name: string;
  description?: string;
  productType: ProductType;
  status: ProductStatus;
  priceMinor: number; // Integer paise
  currency: Currency;
  requiresShipping: boolean;
  requiresQrAllocation: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductParams {
  id?: string;
  code: string;
  name: string;
  description?: string;
  productType: ProductType;
  status?: ProductStatus;
  priceMinor: number;
  currency?: Currency;
  requiresShipping?: boolean;
  requiresQrAllocation?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Generates an opaque ProductId (prod_xxx).
 */
export function generateProductId(): ProductId {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  let id = "prod_";
  for (let i = 0; i < 12; i++) {
    const byte = bytes[i] ?? 0;
    id += chars.charAt(byte % chars.length);
  }
  return id as ProductId;
}

/**
 * Pure domain factory creating a validated Product entity.
 */
export function createProduct(params: CreateProductParams): Product {
  if (!params.code || !params.code.trim()) {
    throw new CommerceDomainError("Product catalog code is required", "INVALID_PRODUCT_CODE");
  }
  if (!params.name || !params.name.trim()) {
    throw new CommerceDomainError("Product name is required", "INVALID_PRODUCT_NAME");
  }
  if (!Number.isInteger(params.priceMinor) || params.priceMinor < 0) {
    throw new CommerceDomainError("Product price must be a non-negative integer (paise)", "INVALID_PRODUCT_PRICE");
  }

  const isPhysical = params.productType === "PHYSICAL_QR_STICKER" || params.productType === "REPLACEMENT_STICKER";
  const requiresShipping = params.requiresShipping ?? isPhysical;
  const requiresQrAllocation = params.requiresQrAllocation ?? isPhysical;

  const now = new Date().toISOString();

  return {
    id: params.id ? (params.id as ProductId) : generateProductId(),
    code: params.code.trim().toUpperCase(),
    name: params.name.trim(),
    description: params.description?.trim(),
    productType: params.productType,
    status: params.status || "ACTIVE",
    priceMinor: params.priceMinor,
    currency: params.currency || "INR",
    requiresShipping,
    requiresQrAllocation,
    createdAt: params.createdAt || now,
    updatedAt: params.updatedAt || now,
  };
}
