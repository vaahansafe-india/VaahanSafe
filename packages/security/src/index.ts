/**
 * VaahanSafe Security & Privacy Utilities
 */

/**
 * Mask sensitive phone numbers for public logs & screens (e.g. +91 98****3210)
 */
export function maskPhoneNumber(phone?: string): string {
  if (!phone) return "";
  const cleaned = phone.replace(/\s+/g, "");
  if (cleaned.length <= 4) return "****";
  const start = cleaned.slice(0, 3);
  const end = cleaned.slice(-3);
  return `${start}****${end}`;
}

/**
 * Mask email address (e.g. j***e@example.com)
 */
export function maskEmail(email?: string): string {
  if (!email || !email.includes("@")) return "*****";
  const [user, domain] = email.split("@");
  if (!user || !domain) return "*****";
  if (user.length <= 2) return `${user[0]}*@${domain}`;
  return `${user[0]}***${user[user.length - 1]}@${domain}`;
}

/**
 * Mask any secret token/key (shows only last 4 chars)
 */
export function maskSecret(secret?: string): string {
  if (!secret) return "";
  if (secret.length <= 4) return "****";
  return `****${secret.slice(-4)}`;
}

/**
 * Turnstile verification interface and adapter
 */
export interface TurnstileVerificationResult {
  success: boolean;
  challengeTs?: string;
  hostname?: string;
  errorCodes?: string[];
}

export interface TurnstileVerifier {
  verify(token: string, remoteIp?: string): Promise<TurnstileVerificationResult>;
}

export class MockTurnstileVerifier implements TurnstileVerifier {
  async verify(token: string): Promise<TurnstileVerificationResult> {
    if (token === "invalid-token") {
      return { success: false, errorCodes: ["invalid-input-response"] };
    }
    return { success: true, hostname: "localhost" };
  }
}

/**
 * Security headers for Web/API responses
 */
export const SECURITY_HEADERS = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
} as const;
