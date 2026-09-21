/**
 * Canonical Fulfilment Types
 *
 * Distinguishes initial physical product fulfilment from replacement fulfilment.
 */

export const FULFILMENT_TYPES = ["PHYSICAL_QR", "REPLACEMENT_QR"] as const;

export type FulfilmentType = (typeof FULFILMENT_TYPES)[number];

export function isValidFulfilmentType(type: string): type is FulfilmentType {
  return (FULFILMENT_TYPES as readonly string[]).includes(type);
}
