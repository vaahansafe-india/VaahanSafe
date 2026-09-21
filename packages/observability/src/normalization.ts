/**
 * VaahanSafe Safe Error Normalization Engine
 *
 * Normalizes internal exceptions, domain errors, and third-party adapter failures
 * into public-safe, sanitized error contracts with zero credential/stack leaks.
 */

import { generateErrorId } from "./correlation";
import { sanitizeString } from "./redaction";

export interface NormalizedSafeError {
  code: string;
  message: string;
  userMessage: string;
  reference: string;
  statusCode: number;
}

interface DomainErrorLike {
  code?: string;
  statusCode?: number;
  message: string;
  userMessage?: string;
  isOperational?: boolean;
}

function isDomainErrorLike(error: unknown): error is DomainErrorLike {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "statusCode" in error &&
    "message" in error
  );
}

/**
 * Normalizes an unknown error into a secure, non-leaking error contract.
 */
export function normalizeSafeError(
  error: unknown,
  fallbackMessage = "An unexpected error occurred. Please try again later."
): NormalizedSafeError {
  const reference = generateErrorId("VSERR");

  if (isDomainErrorLike(error)) {
    return {
      code: error.code || "ERR_DOMAIN_FAILURE",
      message: sanitizeString(error.message),
      userMessage: error.userMessage ? sanitizeString(error.userMessage) : fallbackMessage,
      reference,
      statusCode: error.statusCode || 400,
    };
  }

  const isProd = process.env.NODE_ENV === "production";
  const rawMessage = error instanceof Error ? error.message : fallbackMessage;

  return {
    code: "ERR_INTERNAL_SERVER_ERROR",
    message: isProd ? fallbackMessage : sanitizeString(rawMessage),
    userMessage: fallbackMessage,
    reference,
    statusCode: 500,
  };
}
