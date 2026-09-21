/**
 * VaahanSafe Deep Sensitive-Data Redaction Engine
 *
 * Recursively sanitizes logs, errors, and telemetry payloads to guarantee that
 * credentials, OTPs, session tokens, and financial data are never emitted in logs.
 */

export const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /scratchcode/i,
  /otp/i,
  /authorization/i,
  /cookie/i,
  /cvv/i,
  /pan/i,
  /cardnumber/i,
  /accountnumber/i,
  /authkey/i,
  /clientsecret/i,
  /privatekey/i,
  /apikey/i,
  /session/i,
];

const BEARER_REGEX = /Bearer\s+[A-Za-z0-9\-_.]+/gi;
const URL_SECRET_PARAM_REGEX = /([?&](?:token|secret|otp|scratchCode|key)=)[^&]+/gi;
const CARD_PAN_REGEX = /\b(?:\d[ -]*?){13,16}\b/g;

/**
 * Sanitizes a string containing potential credentials or card numbers.
 */
export function sanitizeString(val: string): string {
  if (!val || typeof val !== "string") return val;

  return val
    .replace(BEARER_REGEX, "Bearer [REDACTED]")
    .replace(URL_SECRET_PARAM_REGEX, "$1[REDACTED]")
    .replace(CARD_PAN_REGEX, (match) => {
      // If it looks like a 13-16 digit card number, redact it
      const clean = match.replace(/[\s-]/g, "");
      if (clean.length >= 13 && clean.length <= 16 && !isNaN(Number(clean))) {
        return `[REDACTED_CARD_****${clean.slice(-4)}]`;
      }
      return match;
    });
}

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

/**
 * Deeply and recursively redacts sensitive fields in any object, array, or primitive.
 */
export function redactSensitiveData<T>(input: T, seen = new WeakSet()): T {
  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input === "string") {
    return sanitizeString(input) as unknown as T;
  }

  if (typeof input !== "object") {
    return input;
  }

  // Handle circular references safely
  if (seen.has(input as object)) {
    return "[Circular]" as unknown as T;
  }
  seen.add(input as object);

  if (Array.isArray(input)) {
    return input.map((item) => redactSensitiveData(item, seen)) as unknown as T;
  }

  const output: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (isSensitiveKey(key)) {
      output[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      output[key] = redactSensitiveData(value, seen);
    } else if (typeof value === "string") {
      output[key] = sanitizeString(value);
    } else {
      output[key] = value;
    }
  }

  return output as T;
}
