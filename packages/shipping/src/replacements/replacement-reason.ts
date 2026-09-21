/**
 * Canonical QR Replacement Reasons
 */

export const REPLACEMENT_REASONS = [
  "LOST",
  "DAMAGED",
  "PRINT_DEFECT",
  "DELIVERY_DAMAGE",
  "OTHER",
] as const;

export type ReplacementReason = (typeof REPLACEMENT_REASONS)[number];

export function isValidReplacementReason(reason: string): reason is ReplacementReason {
  return (REPLACEMENT_REASONS as readonly string[]).includes(reason);
}
