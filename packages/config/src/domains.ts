/**
 * VaahanSafe Cross-Surface URL Builders & Permanent Contract Helpers
 * Ensures consistent, environment-aware routing across all 8 surfaces
 * without hardcoding or leaking provider deployment domains.
 */

import { SURFACES, SurfaceId } from "./surfaces";
import { AppEnvironment, getAppEnv } from "./environment";

/**
 * Sanitizes and normalizes a relative URL path.
 */
function cleanPath(path?: string): string {
  if (!path) return "";
  const trimmed = path.trim();
  if (!trimmed || trimmed === "/") return "";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

/**
 * Resolves the base origin for a specific surface based on environment.
 */
export function getSurfaceOrigin(
  surfaceId: SurfaceId,
  envOverride?: AppEnvironment
): string {
  const surface = SURFACES[surfaceId];
  if (!surface) {
    throw new Error(`[VaahanSafe Config] Unknown surface identifier: "${surfaceId}"`);
  }

  const env = envOverride || getAppEnv();

  // In production, strictly use the owned VaahanSafe domain contract.
  if (env === "production") {
    return surface.productionOrigin;
  }

  // In development / test, resolve to the local port origin.
  return surface.localOrigin;
}

/**
 * Generates an environment-aware full URL for a target surface and path.
 *
 * @example
 * getSurfaceUrl("customer", "/vehicles")
 * // Production: "https://app.vaahansafe.com/vehicles"
 * // Development: "http://localhost:3001/vehicles"
 */
export function getSurfaceUrl(
  surfaceId: SurfaceId,
  path?: string,
  envOverride?: AppEnvironment
): string {
  const origin = getSurfaceOrigin(surfaceId, envOverride);
  const normalizedPath = cleanPath(path);
  return `${origin}${normalizedPath}`;
}

/**
 * Permanent Printed QR Contract:
 *
 * https://qr.vaahansafe.com/{publicId}
 *
 * INVARIANT: This URL is physically printed on vehicle stickers, helmets,
 * and packaging. It must NEVER resolve to workers.dev, pages.dev,
 * vercel.app, or preview domains in production.
 * It must NEVER include scratch secrets or auth tokens.
 */
export function getQrUrl(
  publicId: string,
  options?: {
    env?: AppEnvironment;
  }
): string {
  if (!publicId || typeof publicId !== "string") {
    throw new Error("[VaahanSafe QR] publicId must be a non-empty string locator.");
  }

  // Ensure no accidental inclusion of query strings, fragments, or scratch secrets
  const cleanId = publicId.trim().replace(/^\/+|\/+$/g, "");
  if (!cleanId) {
    throw new Error("[VaahanSafe QR] Invalid publicId locator.");
  }

  const origin = getSurfaceOrigin("qr", options?.env);
  return `${origin}/${cleanId}`;
}

/**
 * Cross-surface URL helper for activate.vaahansafe.com
 * When a physical sticker is scanned in an unactivated state, finder/owner is
 * directed to activation with the public locator ONLY.
 * NEVER appends scratch secrets.
 */
export function getActivateUrl(
  publicId?: string,
  options?: {
    env?: AppEnvironment;
  }
): string {
  const origin = getSurfaceOrigin("activate", options?.env);
  if (!publicId) {
    return origin;
  }
  const cleanId = publicId.trim().replace(/^\/+|\/+$/g, "");
  return `${origin}/${cleanId}`;
}

/**
 * Cross-surface URL helper for customer app (app.vaahansafe.com)
 */
export function getCustomerUrl(
  path?: string,
  options?: {
    env?: AppEnvironment;
  }
): string {
  return getSurfaceUrl("customer", path, options?.env);
}

/**
 * Cross-surface URL helper for editorial blog (blog.vaahansafe.com)
 */
export function getBlogUrl(
  path?: string,
  options?: {
    env?: AppEnvironment;
  }
): string {
  return getSurfaceUrl("blog", path, options?.env);
}

/**
 * Cross-surface URL helper for system status (status.vaahansafe.com)
 */
export function getStatusUrl(
  path?: string,
  options?: {
    env?: AppEnvironment;
  }
): string {
  return getSurfaceUrl("status", path, options?.env);
}

/**
 * Cross-surface URL helper for API (api.vaahansafe.com)
 */
export function getApiUrl(
  path?: string,
  options?: {
    env?: AppEnvironment;
  }
): string {
  return getSurfaceUrl("api", path, options?.env);
}

/**
 * Cross-surface URL helper for Operations / Admin (admin.vaahansafe.com)
 */
export function getAdminUrl(
  path?: string,
  options?: {
    env?: AppEnvironment;
  }
): string {
  return getSurfaceUrl("admin", path, options?.env);
}

/**
 * Cross-surface URL helper for Public Marketing (vaahansafe.com)
 */
export function getWebUrl(
  path?: string,
  options?: {
    env?: AppEnvironment;
  }
): string {
  return getSurfaceUrl("web", path, options?.env);
}
