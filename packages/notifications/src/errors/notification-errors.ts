/**
 * Notification Errors & Safe Redacting Logger
 *
 * INVARIANT: Secrets, OTP plaintext, and sensitive medical/financial payloads
 * must NEVER be emitted in logs or error traces.
 */

export class NotificationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(`[${code}] ${message}`);
    this.name = "NotificationError";
  }
}

export class TemplateMissingError extends NotificationError {
  constructor(templateKey: string) {
    super("TEMPLATE_NOT_FOUND", `Template "${templateKey}" does not exist in registry`);
  }
}

export class IntentNotFoundError extends NotificationError {
  constructor(intentId: string) {
    super("INTENT_NOT_FOUND", `NotificationIntent "${intentId}" was not found in database`);
  }
}

export class ProviderExecutionError extends NotificationError {
  constructor(
    public readonly provider: string,
    public readonly isRetryable: boolean,
    message: string
  ) {
    super(isRetryable ? "PROVIDER_TEMPORARY_FAILURE" : "PROVIDER_PERMANENT_FAILURE", message);
  }
}

export interface SafeLogContext {
  intentId?: string;
  deliveryId?: string;
  eventType?: string;
  channel?: string;
  provider?: string;
  status?: string;
  normalizedError?: string;
  attempt?: number;
  requestId?: string;
  [key: string]: unknown;
}

const REDACTED_KEYS = new Set([
  "otp",
  "rawotp",
  "plaintextotp",
  "authkey",
  "apikey",
  "secret",
  "password",
  "token",
  "medicalnotes",
  "bloodgroup",
  "allergies",
  "cardnumber",
  "cvv",
]);

/**
 * Redacts potential secret/PII fields from an arbitrary logging object.
 */
export function sanitizeLogData(data: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [k, v] of Object.entries(data)) {
    const lowerKey = k.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (REDACTED_KEYS.has(lowerKey)) {
      sanitized[k] = "[REDACTED]";
    } else if (v && typeof v === "object" && !Array.isArray(v)) {
      sanitized[k] = sanitizeLogData(v as Record<string, unknown>);
    } else {
      sanitized[k] = v;
    }
  }

  return sanitized;
}

export const NotificationLogger = {
  info(message: string, context: SafeLogContext = {}): void {
    const safeContext = sanitizeLogData(context as Record<string, unknown>);
    console.info(`[NotificationService] ${message}`, JSON.stringify(safeContext));
  },

  warn(message: string, context: SafeLogContext = {}): void {
    const safeContext = sanitizeLogData(context as Record<string, unknown>);
    console.warn(`[NotificationService] WARN: ${message}`, JSON.stringify(safeContext));
  },

  error(message: string, context: SafeLogContext = {}): void {
    const safeContext = sanitizeLogData(context as Record<string, unknown>);
    console.error(`[NotificationService] ERROR: ${message}`, JSON.stringify(safeContext));
  },
};
