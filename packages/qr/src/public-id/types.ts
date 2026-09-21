/**
 * VaahanSafe QR Public Identifier Types
 *
 * INVARIANT: A QR public ID (e.g., "7F3K9021" or "VS-7F3K-9021") is an authoritative
 * public locator. It is NOT an authentication token, an activation secret,
 * a session token, or a password.
 */

declare const QrPublicIdBrand: unique symbol;

/**
 * Branded type representing a validated, normalized QR public identifier.
 */
export type QrPublicId = string & { readonly [QrPublicIdBrand]: true };

export interface QrPublicIdValidationResult {
  isValid: boolean;
  normalizedId?: QrPublicId;
  errorCode?:
    | "EMPTY_ID"
    | "TOO_SHORT"
    | "TOO_LONG"
    | "INVALID_CHARACTERS"
    | "SUSPICIOUS_PATTERN"
    | "MALFORMED";
  errorMessage?: string;
}
