/**
 * QR Public ID Normalization
 * Centralized parser ensuring consistent formatting before lookups.
 */

/**
 * Normalizes a candidate QR public ID:
 * - Trims whitespace at start and end
 * - Converts to uppercase
 * - Strips leading/trailing slashes, hyphens, and underscores
 * - Normalizes multiple consecutive hyphens or underscores to a single hyphen
 */
export function normalizeQrPublicId(input: string | unknown): string {
  if (typeof input !== "string") {
    return "";
  }

  return input
    .trim()
    .toUpperCase()
    .replace(/^\/+|\/+$/g, "")      // Strip leading/trailing slashes
    .replace(/^[-_]+|[-_]+$/g, "")  // Strip leading/trailing dashes or underscores
    .replace(/[-_]{2,}/g, "-");     // Collapse multiple hyphens/underscores to a single hyphen
}
