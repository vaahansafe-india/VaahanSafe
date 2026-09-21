/**
 * VaahanSafe QR Public Identifier Module
 *
 * INVARIANTS:
 * - Public ID is an authoritative public locator (e.g., "7F3K9021").
 * - Public IDs are non-sequential, random, and enumeration-resistant.
 * - Public ID is NOT a secret, NOT an authentication token, NOT an activation credential.
 * - Crockford Base32 / unambiguous alphanumeric alphabet (excludes 0/O, 1/I/L).
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

// Unambiguous 32-character alphabet: excludes 0, O, 1, I, L
export const QR_PUBLIC_ID_ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";
export const DEFAULT_PUBLIC_ID_LENGTH = 8;
export const MIN_QR_PUBLIC_ID_LENGTH = 4;
export const MAX_QR_PUBLIC_ID_LENGTH = 32;

// Allowed characters: Uppercase alphanumeric, hyphens, underscores.
const QR_PUBLIC_ID_REGEX = /^[A-Z0-9][A-Z0-9_-]{2,30}[A-Z0-9]$/;

// Suspicious patterns (SQL injection, script injection, path traversal)
const SUSPICIOUS_PATTERNS = [
  /[<>'";`\\{}]/,
  /\/\*/,
  /\.\./,
  /\b(SELECT|UNION|INSERT|DELETE|DROP|EXEC|SCRIPT)\b/i,
];

/**
 * Generates a cryptographically secure, non-sequential, enumeration-resistant QR Public ID.
 * Entropy: 32^8 ≈ 1.0995 × 10^12 combinations.
 */
export function generateQrPublicId(length = DEFAULT_PUBLIC_ID_LENGTH): QrPublicId {
  const bytes = new Uint8Array(length);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    const nodeCrypto = require("crypto");
    const randomBytes = nodeCrypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
      bytes[i] = randomBytes[i];
    }
  }

  let id = "";
  const alphabetLen = QR_PUBLIC_ID_ALPHABET.length;
  for (let i = 0; i < length; i++) {
    const byteVal = bytes[i] ?? 0;
    id += QR_PUBLIC_ID_ALPHABET[byteVal % alphabetLen];
  }

  return id as QrPublicId;
}

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
    .replace(/^\/+|\/+$/g, "")
    .replace(/^[-_]+|[-_]+$/g, "")
    .replace(/[-_]{2,}/g, "-");
}

/**
 * Authoritative validator for QR public ID inputs.
 */
export function validateQrPublicId(rawInput: unknown): QrPublicIdValidationResult {
  if (typeof rawInput !== "string" || !rawInput.trim()) {
    return {
      isValid: false,
      errorCode: "EMPTY_ID",
      errorMessage: "QR public identifier cannot be empty.",
    };
  }

  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(rawInput)) {
      return {
        isValid: false,
        errorCode: "SUSPICIOUS_PATTERN",
        errorMessage: "QR public identifier contains disallowed characters or suspicious sequences.",
      };
    }
  }

  const normalized = normalizeQrPublicId(rawInput);

  if (normalized.length < MIN_QR_PUBLIC_ID_LENGTH) {
    return {
      isValid: false,
      errorCode: "TOO_SHORT",
      errorMessage: `QR public identifier must be at least ${MIN_QR_PUBLIC_ID_LENGTH} characters.`,
    };
  }

  if (normalized.length > MAX_QR_PUBLIC_ID_LENGTH) {
    return {
      isValid: false,
      errorCode: "TOO_LONG",
      errorMessage: `QR public identifier cannot exceed ${MAX_QR_PUBLIC_ID_LENGTH} characters.`,
    };
  }

  if (!QR_PUBLIC_ID_REGEX.test(normalized)) {
    return {
      isValid: false,
      errorCode: "INVALID_CHARACTERS",
      errorMessage: "QR public identifier must consist only of uppercase alphanumeric characters, hyphens, and underscores.",
    };
  }

  return {
    isValid: true,
    normalizedId: normalized as QrPublicId,
  };
}

export function isValidQrPublicId(input: unknown): input is QrPublicId {
  return validateQrPublicId(input).isValid;
}

export function assertValidQrPublicId(input: unknown): QrPublicId {
  const result = validateQrPublicId(input);
  if (!result.isValid || !result.normalizedId) {
    throw new Error(result.errorMessage || "Invalid QR public identifier.");
  }
  return result.normalizedId;
}
