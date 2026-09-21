/**
 * VaahanSafe Visible Support Code Module
 *
 * INVARIANTS:
 * - Visible code is a human-readable support/operational reference (e.g., "VS-7F3K-9021").
 * - Visible code is printed on the physical sticker for customer support and retail handling.
 * - Visible code is NOT secret and MUST NEVER be used as an activation credential.
 */

import { normalizeQrPublicId } from "./public-id";

export const VISIBLE_CODE_PREFIX = "VS-";

/**
 * Formats a public ID into an authoritative human-friendly visible support code.
 * Example: "7F3K9021" -> "VS-7F3K-9021"
 */
export function formatVisibleCode(publicId: string): string {
  const normalized = normalizeQrPublicId(publicId);
  if (!normalized) return "";

  // If already prefixed with VS-, clean and reformat
  const stripped = normalized.startsWith(VISIBLE_CODE_PREFIX)
    ? normalized.slice(VISIBLE_CODE_PREFIX.length)
    : normalized;

  // Split into chunks of 4 characters for readability if 8 characters
  if (stripped.length === 8) {
    return `${VISIBLE_CODE_PREFIX}${stripped.slice(0, 4)}-${stripped.slice(4)}`;
  }

  return `${VISIBLE_CODE_PREFIX}${stripped}`;
}

/**
 * Parses a visible support code back into its underlying public identifier.
 * Example: "VS-7F3K-9021" -> "7F3K9021"
 */
export function parseVisibleCode(visibleCode: string): string {
  if (typeof visibleCode !== "string") return "";

  let cleaned = visibleCode.trim().toUpperCase();
  if (cleaned.startsWith(VISIBLE_CODE_PREFIX)) {
    cleaned = cleaned.slice(VISIBLE_CODE_PREFIX.length);
  }

  // Remove internal hyphens
  return cleaned.replace(/-/g, "");
}
