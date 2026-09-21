/**
 * VaahanSafe Scratch Secret Hashing & Derivation
 *
 * SECTION 11 — HASHING ARCHITECTURE:
 * Uses NIST-standard PBKDF2-HMAC-SHA256 with cryptographically random salts
 * and iteration parameters supported natively by Web Crypto on Cloudflare Workers & Node.js.
 *
 * INVARIANTS:
 * - Versioned metadata (hash_version: "v1")
 * - Salted derivation prevents rainbow table attacks
 * - Plaintext scratch secret NEVER enters D1 storage
 */

export const HASH_VERSION_V1 = "v1";
export const PBKDF2_ITERATIONS = 10000;
export const SALT_BYTE_LENGTH = 16; // 128 bits
export const DERIVED_KEY_LENGTH_BYTES = 32; // 256 bits

/**
 * Generates a cryptographically random salt (hex-encoded).
 */
export function generateSalt(byteLength = SALT_BYTE_LENGTH): string {
  const bytes = new Uint8Array(byteLength);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    const nodeCrypto = require("crypto");
    const randomBytes = nodeCrypto.randomBytes(byteLength);
    for (let i = 0; i < byteLength; i++) {
      bytes[i] = randomBytes[i];
    }
  }

  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Computes PBKDF2-HMAC-SHA256 digest using Web Crypto (with Node fallback).
 */
async function derivePbkdf2Hex(
  secret: string,
  saltHex: string,
  iterations = PBKDF2_ITERATIONS
): Promise<string> {
  const normalizedSecret = secret.trim().toUpperCase();
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(normalizedSecret);
  const saltData = encoder.encode(saltHex);

  if (typeof crypto !== "undefined" && crypto.subtle) {
    const baseKey = await crypto.subtle.importKey(
      "raw",
      passwordData,
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: saltData,
        iterations,
        hash: "SHA-256",
      },
      baseKey,
      DERIVED_KEY_LENGTH_BYTES * 8
    );

    return Array.from(new Uint8Array(derivedBits))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  // Node.js fallback
  const nodeCrypto = require("crypto");
  const derivedKey = nodeCrypto.pbkdf2Sync(
    normalizedSecret,
    saltHex,
    iterations,
    DERIVED_KEY_LENGTH_BYTES,
    "sha256"
  );
  return derivedKey.toString("hex");
}

export interface HashSecretResult {
  secretHash: string;
  hashVersion: string;
  salt: string;
}

/**
 * Hashes a scratch secret with a salt.
 * Output format in secretHash: `${salt}:${digest}` (version tracked in hashVersion: "v1").
 */
export async function hashScratchSecret(
  secret: string,
  providedSalt?: string,
  version = HASH_VERSION_V1
): Promise<HashSecretResult> {
  if (!secret || secret.trim().length === 0) {
    throw new Error("Cannot hash an empty scratch secret");
  }

  const salt = providedSalt || generateSalt();
  const digest = await derivePbkdf2Hex(secret, salt);
  const secretHash = `${salt}:${digest}`;

  return {
    secretHash,
    hashVersion: version,
    salt,
  };
}
