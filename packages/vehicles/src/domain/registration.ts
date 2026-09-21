/**
 * VaahanSafe Centralized Registration Normalization & Display Model
 *
 * INVARIANT: Maintain TWO concepts:
 * 1. registration_number_normalized (uppercase, stripped of all whitespace/hyphens)
 * 2. registration_number_display (properly spaced human-readable representation)
 *
 * Normalization and validation are separate concepts.
 */

const STATE_SERIES_REGEX = /^([A-Z]{2})([0-9]{1,2})([A-Z]{0,3})([0-9]{4})$/;
const BH_SERIES_REGEX = /^([0-9]{2})BH([0-9]{4})([A-Z]{1,2})$/;

/**
 * Strips all whitespace, hyphens, and converts to uppercase.
 * Centralized function used across Customer UI, Activation, Admin, and API.
 */
export function normalizeRegistrationNumber(raw: string): string {
  if (!raw) return "";
  return raw
    .trim()
    .toUpperCase()
    .replace(/[\s\-_.]/g, "");
}

/**
 * Formats a normalized or raw registration into standard human-readable display spacing.
 * E.g. "AP39AB1234" -> "AP 39 AB 1234"
 * E.g. "22BH1234AA" -> "22 BH 1234 AA"
 * E.g. "MH121234"   -> "MH 12 1234"
 */
export function formatRegistrationDisplay(rawOrNormalized: string): string {
  const norm = normalizeRegistrationNumber(rawOrNormalized);
  if (!norm) return "";

  // 1. Standard State Series: e.g. AP 39 AB 1234 or DL 1 C 1234
  const stateMatch = norm.match(STATE_SERIES_REGEX);
  if (stateMatch) {
    const [, state, rto, series, number] = stateMatch;
    // Format RTO code with padding if single digit, or keep as is
    const parts = [state, rto, series, number].filter(Boolean);
    return parts.join(" ");
  }

  // 2. Bharat (BH) Series: e.g. 22 BH 1234 AA
  const bhMatch = norm.match(BH_SERIES_REGEX);
  if (bhMatch) {
    const [, year, number, series] = bhMatch;
    return `${year} BH ${number} ${series}`;
  }

  // Fallback: If non-standard, return normalized string with standard chunking if length >= 8
  if (norm.length >= 8 && norm.length <= 11) {
    return `${norm.slice(0, 2)} ${norm.slice(2, 4)} ${norm.slice(4)}`;
  }

  return norm;
}

/**
 * Validates whether the given registration conforms to recognized Indian vehicle registration standards.
 */
export function isValidRegistrationFormat(raw: string): boolean {
  const norm = normalizeRegistrationNumber(raw);
  if (!norm || norm.length < 6 || norm.length > 13) {
    return false;
  }
  return STATE_SERIES_REGEX.test(norm) || BH_SERIES_REGEX.test(norm);
}
