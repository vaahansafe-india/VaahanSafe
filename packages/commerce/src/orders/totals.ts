/**
 * VaahanSafe Server-Side Price Authority & Order Totals Calculation
 *
 * INVARIANTS:
 * - Server is the SOLE authority for order totals.
 * - Client-provided amounts are never trusted or accepted.
 * - All calculations occur in integer minor units (paise in INR).
 */

import { Currency } from "../catalog/money";
import { CommerceDomainError } from "../errors/commerce-errors";

export interface OrderItemPriceable {
  totalPriceMinor: number;
}

export interface CalculationOptions {
  shippingFeeMinor?: number;
  discountMinor?: number;
  taxRatePercent?: number; // E.g. 18 for 18% GST if applicable
  currency?: Currency;
}

export interface OrderTotals {
  subtotalMinor: number;
  discountMinor: number;
  shippingMinor: number;
  taxMinor: number;
  totalMinor: number;
  currency: Currency;
}

/**
 * Calculates authoritative order totals from line items.
 */
export function calculateOrderTotals(
  items: readonly OrderItemPriceable[],
  options: CalculationOptions = {}
): OrderTotals {
  if (!items || items.length === 0) {
    throw new CommerceDomainError("Cannot calculate order totals with zero items", "EMPTY_ORDER_ITEMS");
  }

  let subtotalMinor = 0;
  for (const item of items) {
    if (!Number.isInteger(item.totalPriceMinor) || item.totalPriceMinor < 0) {
      throw new CommerceDomainError(
        `Invalid line item price: ${item.totalPriceMinor}`,
        "INVALID_ITEM_PRICE"
      );
    }
    subtotalMinor += item.totalPriceMinor;
  }

  const shippingMinor = options.shippingFeeMinor ?? 0;
  if (!Number.isInteger(shippingMinor) || shippingMinor < 0) {
    throw new CommerceDomainError("Shipping fee must be a non-negative integer", "INVALID_SHIPPING_FEE");
  }

  const discountMinor = options.discountMinor ?? 0;
  if (!Number.isInteger(discountMinor) || discountMinor < 0) {
    throw new CommerceDomainError("Discount must be a non-negative integer", "INVALID_DISCOUNT");
  }

  if (discountMinor > subtotalMinor) {
    throw new CommerceDomainError("Discount cannot exceed subtotal", "DISCOUNT_EXCEEDS_SUBTOTAL");
  }

  // Tax calculation (e.g. GST) rounded to nearest integer minor unit
  let taxMinor = 0;
  if (options.taxRatePercent && options.taxRatePercent > 0) {
    const taxableAmount = subtotalMinor - discountMinor + shippingMinor;
    taxMinor = Math.round((taxableAmount * options.taxRatePercent) / 100);
  }

  const totalMinor = subtotalMinor - discountMinor + shippingMinor + taxMinor;

  return {
    subtotalMinor,
    discountMinor,
    shippingMinor,
    taxMinor,
    totalMinor,
    currency: options.currency || "INR",
  };
}
