/**
 * VaahanSafe Integer Money & Currency Architecture
 *
 * INVARIANTS:
 * - NEVER use floating-point arithmetic for money.
 * - All monetary values are represented as integer minor units (paise in INR).
 * - E.g. ₹499.00 = 49900 paise.
 * - Rejects float amounts, negative values where disallowed, and currency mismatches.
 */

import { CommerceDomainError } from "../errors/commerce-errors";

export const SUPPORTED_CURRENCIES = ["INR"] as const;
export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

export interface Money {
  amountMinor: number; // Integer minor units (e.g. paise)
  currency: Currency;
}

/**
 * Creates a validated Money value object.
 */
export function createMoney(amountMinor: number, currency: Currency = "INR"): Money {
  if (!Number.isInteger(amountMinor)) {
    throw new CommerceDomainError(
      `Monetary amount must be an integer in minor units (paise), received: ${amountMinor}`,
      "INVALID_MONEY_AMOUNT"
    );
  }

  if (amountMinor < 0) {
    throw new CommerceDomainError(
      `Monetary amount cannot be negative, received: ${amountMinor}`,
      "NEGATIVE_MONEY_AMOUNT"
    );
  }

  if (currency !== "INR") {
    throw new CommerceDomainError(
      `Unsupported currency "${currency}". Currently only "INR" is supported.`,
      "UNSUPPORTED_CURRENCY"
    );
  }

  return { amountMinor, currency };
}

/**
 * Adds two Money amounts of the same currency.
 */
export function addMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) {
    throw new CommerceDomainError(
      `Cannot add mismatched currencies: ${a.currency} and ${b.currency}`,
      "CURRENCY_MISMATCH"
    );
  }
  return createMoney(a.amountMinor + b.amountMinor, a.currency);
}

/**
 * Subtracts Money b from a. Throws if result would be negative.
 */
export function subtractMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) {
    throw new CommerceDomainError(
      `Cannot subtract mismatched currencies: ${a.currency} and ${b.currency}`,
      "CURRENCY_MISMATCH"
    );
  }
  if (a.amountMinor < b.amountMinor) {
    throw new CommerceDomainError(
      `Resulting money amount cannot be negative: ${a.amountMinor} - ${b.amountMinor}`,
      "NEGATIVE_MONEY_RESULT"
    );
  }
  return createMoney(a.amountMinor - b.amountMinor, a.currency);
}

/**
 * Multiplies Money by a non-negative integer quantity.
 */
export function multiplyMoney(m: Money, quantity: number): Money {
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new CommerceDomainError(
      `Multiplication factor must be a non-negative integer, received: ${quantity}`,
      "INVALID_QUANTITY"
    );
  }
  return createMoney(m.amountMinor * quantity, m.currency);
}

/**
 * Formats a Money object into standard Indian Rupee display formatting.
 * E.g. 49900 paise -> "₹499.00", 149950 paise -> "₹1,499.50"
 */
export function formatMoneyDisplay(m: Money): string {
  const major = m.amountMinor / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: m.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(major);
}

/**
 * Validates if an object satisfies the Money interface.
 */
export function isMoney(val: unknown): val is Money {
  return (
    typeof val === "object" &&
    val !== null &&
    "amountMinor" in val &&
    "currency" in val &&
    Number.isInteger((val as Money).amountMinor) &&
    (val as Money).currency === "INR"
  );
}
