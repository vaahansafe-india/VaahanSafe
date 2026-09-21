/**
 * VaahanSafe Commercial Plan Domain Model
 *
 * INVARIANTS:
 * - Plan != Product != Subscription.
 * - Plans define commercial policies: billing interval, vehicle limit, contact limits, feature capabilities.
 * - Price is integer minor units (paise).
 * - Stable codes (e.g. CORE_ANNUAL) decoupling business logic from marketing copy.
 */

import { Currency } from "./money";
import { CommerceDomainError } from "../errors/commerce-errors";

export type PlanId = string & { readonly __brand: unique symbol };

export const BILLING_INTERVALS = ["ANNUAL", "MONTHLY"] as const;
export type BillingInterval = (typeof BILLING_INTERVALS)[number];

export const STANDARD_PLAN_CODES = {
  CORE_ANNUAL: "CORE_ANNUAL",
  SAFETY_PLUS_ANNUAL: "SAFETY_PLUS_ANNUAL",
} as const;

export interface Plan {
  id: PlanId;
  code: string;
  name: string;
  description?: string;
  billingInterval: BillingInterval;
  priceMinor: number;
  currency: Currency;
  vehicleLimit: number;
  contactLimit: number;
  features: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlanParams {
  id?: string;
  code: string;
  name: string;
  description?: string;
  billingInterval?: BillingInterval;
  priceMinor: number;
  currency?: Currency;
  vehicleLimit?: number;
  contactLimit?: number;
  features?: string[];
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Generates an opaque PlanId (plan_xxx).
 */
export function generatePlanId(): PlanId {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  let id = "plan_";
  for (let i = 0; i < 12; i++) {
    const byte = bytes[i] ?? 0;
    id += chars.charAt(byte % chars.length);
  }
  return id as PlanId;
}

/**
 * Pure domain factory creating a validated commercial Plan entity.
 */
export function createPlan(params: CreatePlanParams): Plan {
  if (!params.code || !params.code.trim()) {
    throw new CommerceDomainError("Plan code is required", "INVALID_PLAN_CODE");
  }
  if (!params.name || !params.name.trim()) {
    throw new CommerceDomainError("Plan name is required", "INVALID_PLAN_NAME");
  }
  if (!Number.isInteger(params.priceMinor) || params.priceMinor < 0) {
    throw new CommerceDomainError("Plan price must be a non-negative integer (paise)", "INVALID_PLAN_PRICE");
  }

  const now = new Date().toISOString();

  return {
    id: params.id ? (params.id as PlanId) : generatePlanId(),
    code: params.code.trim().toUpperCase(),
    name: params.name.trim(),
    description: params.description?.trim(),
    billingInterval: params.billingInterval || "ANNUAL",
    priceMinor: params.priceMinor,
    currency: params.currency || "INR",
    vehicleLimit: params.vehicleLimit ?? 1,
    contactLimit: params.contactLimit ?? 3,
    features: params.features || ["CORE_EMERGENCY_PROFILE", "EMERGENCY_CALL_ACTION"],
    isActive: params.isActive !== false,
    createdAt: params.createdAt || now,
    updatedAt: params.updatedAt || now,
  };
}
