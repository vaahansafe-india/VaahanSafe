/**
 * VaahanSafe Permanent Printed QR URL Contract
 *
 * SECTION 03 — PERMANENT PRINTED QR CONTRACT:
 * Every physical sticker permanently encodes:
 * https://qr.vaahansafe.com/{publicId}
 *
 * CRITICAL INVARIANT:
 * NEVER print workers.dev, pages.dev, vercel.app, localhost, preview hostnames,
 * or temporary redirects on physical manufacturing assets.
 */

import { normalizeQrPublicId } from "./public-id";

export const PERMANENT_QR_DOMAIN = "qr.vaahansafe.com";
export const PERMANENT_QR_BASE_URL = `https://${PERMANENT_QR_DOMAIN}`;

const DISALLOWED_HOSTS = [
  "workers.dev",
  "pages.dev",
  "vercel.app",
  "localhost",
  "127.0.0.1",
  "preview",
];

/**
 * Generates the authoritative permanent QR URL for physical manufacturing and digital resolution.
 * Example: "7F3K9021" -> "https://qr.vaahansafe.com/7F3K9021"
 */
export function getQrUrl(publicId: string): string {
  const normalized = normalizeQrPublicId(publicId);
  if (!normalized) {
    throw new Error("Cannot generate QR URL from empty public identifier");
  }

  return `${PERMANENT_QR_BASE_URL}/${normalized}`;
}

/**
 * Validates that an incoming URL strictly adheres to the permanent QR domain contract.
 */
export function isPermanentQrUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== "https:") return false;
    if (parsed.hostname !== PERMANENT_QR_DOMAIN) return false;

    // Must not match any disallowed host
    for (const disallowed of DISALLOWED_HOSTS) {
      if (parsed.hostname.includes(disallowed)) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}
