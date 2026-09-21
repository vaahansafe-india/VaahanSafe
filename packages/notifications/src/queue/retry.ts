/**
 * Notification Retry Classification & Bounded Backoff
 *
 * Distinguishes transient, retryable provider errors from permanent rejection.
 * INVARIANT: Permanent failures (e.g. invalid phone format) must NEVER be retried endlessly.
 */

export type FailureCategory = "RETRYABLE" | "PERMANENT";

export interface RetryPolicyConfig {
  maxAttempts: number;
  initialBackoffSeconds: number;
  backoffMultiplier: number;
  maxBackoffSeconds: number;
}

export const DEFAULT_RETRY_POLICY: RetryPolicyConfig = {
  maxAttempts: 3,
  initialBackoffSeconds: 30, // 30s
  backoffMultiplier: 2, // 30s, 60s, 120s
  maxBackoffSeconds: 300, // 5 min cap
};

/**
 * Known normalized error codes mapped to their retry classification.
 */
const KNOWN_ERROR_CLASSIFICATIONS: Record<string, FailureCategory> = {
  NETWORK_TIMEOUT: "RETRYABLE",
  RATE_LIMITED: "RETRYABLE",
  PROVIDER_5XX: "RETRYABLE",
  SERVICE_UNAVAILABLE: "RETRYABLE",
  CONNECTION_RESET: "RETRYABLE",

  INVALID_RECIPIENT: "PERMANENT",
  INVALID_PHONE_NUMBER: "PERMANENT",
  INVALID_EMAIL_ADDRESS: "PERMANENT",
  TEMPLATE_VALIDATION_FAILED: "PERMANENT",
  TEMPLATE_NOT_FOUND: "PERMANENT",
  UNAUTHORIZED_RECIPIENT: "PERMANENT",
  CONTENT_REJECTED: "PERMANENT",
};

/**
 * Classifies an error code or message into RETRYABLE vs PERMANENT.
 */
export function classifyError(errorCode: string): FailureCategory {
  if (KNOWN_ERROR_CLASSIFICATIONS[errorCode]) {
    return KNOWN_ERROR_CLASSIFICATIONS[errorCode];
  }

  // Common pattern checks
  const upper = errorCode.toUpperCase();
  if (
    upper.includes("TIMEOUT") ||
    upper.includes("429") ||
    upper.includes("500") ||
    upper.includes("502") ||
    upper.includes("503") ||
    upper.includes("504") ||
    upper.includes("RATE_LIMIT")
  ) {
    return "RETRYABLE";
  }

  // Default to PERMANENT to prevent accidental infinite retry loops on unrecognized errors
  return "PERMANENT";
}

/**
 * Computes bounded exponential backoff next attempt timestamp.
 */
export function calculateNextAttemptAt(
  attemptNumber: number,
  config: RetryPolicyConfig = DEFAULT_RETRY_POLICY
): string {
  const backoffSec = Math.min(
    config.maxBackoffSeconds,
    config.initialBackoffSeconds * Math.pow(config.backoffMultiplier, attemptNumber - 1)
  );
  return new Date(Date.now() + backoffSec * 1000).toISOString();
}

/**
 * Checks if the delivery attempt count has reached or exceeded max permitted retries.
 */
export function isRetryLimitExceeded(
  attemptNumber: number,
  config: RetryPolicyConfig = DEFAULT_RETRY_POLICY
): boolean {
  return attemptNumber >= config.maxAttempts;
}
