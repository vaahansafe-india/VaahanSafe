/**
 * QR Public ID Validation
 * Validates identifier shapes and protects authoritative resolvers from malformed inputs.
 */

import { QrPublicId, QrPublicIdValidationResult } from "./types";
import { normalizeQrPublicId } from "./normalize";

// Allowed characters: Uppercase alphanumeric, hyphens, underscores. Length: 4-32.
const QR_PUBLIC_ID_REGEX = /^[A-Z0-9][A-Z0-9_-]{2,30}[A-Z0-9]$/;

// Minimum and maximum permissible lengths
export const MIN_QR_PUBLIC_ID_LENGTH = 4;
export const MAX_QR_PUBLIC_ID_LENGTH = 32;

// Suspicious patterns (SQL injection, script injection, traversal)
const SUSPICIOUS_PATTERNS = [
  /[<>'";`\\{}]/,
  /\/\*/,
  /\.\./,
  /\b(SELECT|UNION|INSERT|DELETE|DROP|EXEC|SCRIPT)\b/i,
];

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

  // Check for suspicious injection payloads before normalization
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

/**
 * Type guard checking whether a string is a valid QR public ID.
 */
export function isValidQrPublicId(input: unknown): input is QrPublicId {
  return validateQrPublicId(input).isValid;
}

/**
 * Asserts that an input is a valid QR public ID, throwing an error if invalid.
 */
export function assertValidQrPublicId(input: unknown): QrPublicId {
  const result = validateQrPublicId(input);
  if (!result.isValid || !result.normalizedId) {
    throw new Error(result.errorMessage || "Invalid QR public identifier.");
  }
  return result.normalizedId;
}
