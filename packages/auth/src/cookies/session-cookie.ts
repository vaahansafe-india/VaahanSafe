/**
 * VaahanSafe Cookie Management
 *
 * Enforces RFC 6265 compliant, secure HttpOnly cookie headers for:
 * - Customer browser sessions (vs_session, 30 days sliding)
 * - Admin privileged sessions (vs_admin_session, 4 hours strict)
 */

export const CUSTOMER_SESSION_COOKIE_NAME = "vs_session";
export const ADMIN_SESSION_COOKIE_NAME = "vs_admin_session";

export const CUSTOMER_SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds
export const ADMIN_SESSION_MAX_AGE = 4 * 60 * 60; // 4 hours in seconds

export interface SessionCookieOptions {
  cookieName?: string;
  maxAge?: number;
  secure?: boolean;
  sameSite?: "Lax" | "Strict" | "None";
  path?: string;
  domain?: string;
}

/**
 * Serializes a customer session cookie header (Set-Cookie).
 */
export function serializeSessionCookie(
  rawToken: string,
  options: SessionCookieOptions = {}
): string {
  const name = options.cookieName || CUSTOMER_SESSION_COOKIE_NAME;
  const maxAge = options.maxAge ?? CUSTOMER_SESSION_MAX_AGE;
  const isProductionHttps = process.env.NODE_ENV !== "development";
  const secure = options.secure ?? isProductionHttps;
  const sameSite = options.sameSite || "Lax";
  const path = options.path || "/";

  const parts = [
    `${name}=${encodeURIComponent(rawToken)}`,
    `Path=${path}`,
    `Max-Age=${maxAge}`,
    `SameSite=${sameSite}`,
    "HttpOnly",
  ];

  if (secure) {
    parts.push("Secure");
  }

  if (options.domain) {
    parts.push(`Domain=${options.domain}`);
  }

  return parts.join("; ");
}

/**
 * Serializes an admin session cookie header (Set-Cookie).
 * Uses stricter SameSite policy and shorter max-age (4h).
 */
export function serializeAdminSessionCookie(
  rawToken: string,
  options: SessionCookieOptions = {}
): string {
  return serializeSessionCookie(rawToken, {
    cookieName: ADMIN_SESSION_COOKIE_NAME,
    maxAge: ADMIN_SESSION_MAX_AGE,
    sameSite: "Strict",
    ...options,
  });
}

/**
 * Serializes an immediate cookie expiration header for logging out.
 */
export function serializeClearSessionCookie(
  cookieName: string = CUSTOMER_SESSION_COOKIE_NAME,
  options: { path?: string; domain?: string } = {}
): string {
  const path = options.path || "/";
  const parts = [
    `${cookieName}=`,
    `Path=${path}`,
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    "Max-Age=0",
    "SameSite=Lax",
    "HttpOnly",
  ];

  if (options.domain) {
    parts.push(`Domain=${options.domain}`);
  }

  return parts.join("; ");
}

/**
 * Parses a session bearer token from an incoming HTTP `Cookie` header.
 */
export function parseSessionCookie(
  cookieHeader: string | null | undefined,
  cookieName: string = CUSTOMER_SESSION_COOKIE_NAME
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
