/**
 * VaahanSafe Scratch Secret Consumption & Lockout Policy
 *
 * SECTION 52 — GENERIC FAILURE:
 * Never leak partial match hints or internal thresholds.
 *
 * SECTION 53 — TEMPORARY LOCK:
 * Repeated invalid attempts trigger temporary lockout.
 *
 * SECTION 56 — SCRATCH REUSE:
 * A consumed secret can NEVER be used again.
 */

export const MAX_CONSECUTIVE_FAILED_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MINUTES = 15;
export const GENERIC_SECRET_ERROR_MESSAGE =
  "Activation code could not be verified. Please check the scratched code and try again.";
export const LOCKED_ERROR_MESSAGE =
  "Too many failed verification attempts. Activation has been temporarily locked for security. Please try again later.";

/**
 * Checks whether the secret has already been consumed by an activation transaction.
 */
export function isSecretConsumed(consumedAt: string | null | undefined): boolean {
  return Boolean(consumedAt && consumedAt.trim().length > 0);
}

/**
 * Checks whether the secret is currently temporarily locked due to brute-force protection.
 */
export function isSecretLocked(
  lockedUntil: string | null | undefined,
  now: Date = new Date()
): boolean {
  if (!lockedUntil) return false;
  return new Date(lockedUntil).getTime() > now.getTime();
}

export interface SecretAttemptEvaluation {
  canAttempt: boolean;
  errorCode?: "SECRET_CONSUMED" | "SECRET_LOCKED";
  errorMessage?: string;
}

/**
 * Evaluates whether a candidate attempt can proceed before checking the hash.
 */
export function evaluateSecretAttemptEligibility(
  consumedAt: string | null | undefined,
  lockedUntil: string | null | undefined,
  now: Date = new Date()
): SecretAttemptEvaluation {
  if (isSecretConsumed(consumedAt)) {
    return {
      canAttempt: false,
      errorCode: "SECRET_CONSUMED",
      errorMessage: "This activation secret has already been used and cannot be reactivated.",
    };
  }

  if (isSecretLocked(lockedUntil, now)) {
    return {
      canAttempt: false,
      errorCode: "SECRET_LOCKED",
      errorMessage: LOCKED_ERROR_MESSAGE,
    };
  }

  return { canAttempt: true };
}

export interface LockoutCalculationResult {
  newFailedAttempts: number;
  lockedUntil: string | null;
  isNewlyLocked: boolean;
}

/**
 * Calculates updated failed attempts and potential lockout timestamp on a failed verification.
 */
export function calculateNextLockout(
  currentFailedAttempts: number,
  now: Date = new Date()
): LockoutCalculationResult {
  const newFailedAttempts = currentFailedAttempts + 1;

  if (newFailedAttempts >= MAX_CONSECUTIVE_FAILED_ATTEMPTS) {
    const lockedUntilDate = new Date(now.getTime() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
    return {
      newFailedAttempts,
      lockedUntil: lockedUntilDate.toISOString(),
      isNewlyLocked: true,
    };
  }

  return {
    newFailedAttempts,
    lockedUntil: null,
    isNewlyLocked: false,
  };
}
