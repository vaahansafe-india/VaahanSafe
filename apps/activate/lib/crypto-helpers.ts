/**
 * Cryptographic & Cookie Utilities for Activation Challenge
 */

export const ACTIVATION_CHALLENGE_COOKIE_NAME = "vs_act_challenge";
export const ACTIVATION_CHALLENGE_MAX_AGE = 15 * 60; // 15 minutes

export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);

  if (typeof crypto !== "undefined" && crypto.subtle) {
    const buffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  // Node fallback if crypto.subtle unavailable in specific runtime
  const nodeCrypto = require("crypto");
  return nodeCrypto.createHash("sha256").update(token).digest("hex");
}

export function generateChallengeToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `ch_${hex}`;
}

export function serializeChallengeCookie(
  rawToken: string,
  options: { maxAge?: number; secure?: boolean; path?: string } = {}
): string {
  const maxAge = options.maxAge ?? ACTIVATION_CHALLENGE_MAX_AGE;
  const isProductionHttps = process.env.NODE_ENV !== "development";
  const secure = options.secure ?? isProductionHttps;
  const path = options.path || "/";

  const parts = [
    `${ACTIVATION_CHALLENGE_COOKIE_NAME}=${encodeURIComponent(rawToken)}`,
    `Path=${path}`,
    `Max-Age=${maxAge}`,
    "SameSite=Lax",
    "HttpOnly",
  ];

  if (secure) {
    parts.push("Secure");
  }

  return parts.join("; ");
}

export function serializeClearChallengeCookie(
  options: { path?: string; secure?: boolean } = {}
): string {
  const path = options.path || "/";
  const isProductionHttps = process.env.NODE_ENV !== "development";
  const secure = options.secure ?? isProductionHttps;

  const parts = [
    `${ACTIVATION_CHALLENGE_COOKIE_NAME}=`,
    `Path=${path}`,
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    "Max-Age=0",
    "SameSite=Lax",
    "HttpOnly",
  ];

  if (secure) {
    parts.push("Secure");
  }

  return parts.join("; ");
}

export function parseCookie(
  cookieHeader: string | null | undefined,
  cookieName: string
): string | null {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(";");
  for (const cookie of cookies) {
    const [rawKey, ...rest] = cookie.trim().split("=");
    if (rawKey === cookieName) {
      const val = rest.join("=");
      return val ? decodeURIComponent(val) : null;
    }
  }
  return null;
}
