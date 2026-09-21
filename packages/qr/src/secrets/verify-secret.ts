/**
 * VaahanSafe Scratch Secret Constant-Time Verification
 *
 * SECTION 12 — CONSTANT-TIME VERIFICATION:
 * Prevents timing side-channel attacks during secret verification.
 */

import { hashScratchSecret, HASH_VERSION_V1 } from "./hash-secret";

/**
 * Constant-time string comparison to prevent timing leakage.
 */
export function timingSafeEqualHex(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") {
    return false;
  }
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Verifies a candidate plaintext scratch secret against stored hash and version.
 *
 * Supports:
 * - V1: PBKDF2-HMAC-SHA256 with salt (format: `${salt}:${digest}`)
 * - Legacy fallback: raw SHA-256 hex digest for legacy seed/dev records
 */
export async function verifyScratchSecret(
  candidateSecret: string,
  storedHash: string,
  hashVersion = HASH_VERSION_V1
): Promise<boolean> {
  if (!candidateSecret || !storedHash) {
    return false;
  }

  const normalizedInput = candidateSecret.trim().toUpperCase();
  if (normalizedInput.length === 0) {
    return false;
  }

  // Check if storedHash contains salt delimiter (v1 format: "salt:digest")
  if (storedHash.includes(":")) {
    const parts = storedHash.split(":");
    const salt = parts[0];
    if (!salt) return false;

    try {
      const derived = await hashScratchSecret(normalizedInput, salt, hashVersion);
      return timingSafeEqualHex(derived.secretHash, storedHash);
    } catch {
      return false;
    }
  }

  // Legacy fallback: single raw SHA-256 hex digest (used in early seeds)
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(normalizedInput);
    let legacyHash = "";

    if (typeof crypto !== "undefined" && crypto.subtle) {
      const buf = await crypto.subtle.digest("SHA-256", data);
      legacyHash = Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    } else {
      const nodeCrypto = require("crypto");
      legacyHash = nodeCrypto.createHash("sha256").update(normalizedInput).digest("hex");
    }

    return timingSafeEqualHex(legacyHash.toLowerCase(), storedHash.toLowerCase());
  } catch {
    return false;
  }
}
