/**
 * VaahanSafe Scratch Secret Cryptographic Generation
 *
 * SECTION 09 — SCRATCH SECRET GENERATION:
 * Physical scratch secrets prove physical possession of the sticker.
 *
 * CRITICAL INVARIANTS:
 * - High-entropy cryptographically secure random generation via Web Crypto.
 * - STRICTLY FORBIDDEN: Math.random(), predictable UUIDs, timestamps,
 *   batch/sequence combinations, publicId derivations, vehicle derivations.
 */

// Unambiguous 32-character alphabet (excludes 0, O, 1, I)
export const SCRATCH_SECRET_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const DEFAULT_SCRATCH_SECRET_LENGTH = 10;

/**
 * Generates a cryptographically secure random scratch secret for physical manufacturing.
 * Entropy: 32^10 ≈ 1.125 × 10^15 combinations.
 */
export function generateScratchSecret(length = DEFAULT_SCRATCH_SECRET_LENGTH): string {
  if (length < 8) {
    throw new Error("Scratch secret length must be at least 8 characters for cryptographic security");
  }

  const bytes = new Uint8Array(length);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    const nodeCrypto = require("crypto");
    const randomBytes = nodeCrypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
      bytes[i] = randomBytes[i];
    }
  }

  let secret = "";
  const alphabetLen = SCRATCH_SECRET_ALPHABET.length;
  for (let i = 0; i < length; i++) {
    const byteVal = bytes[i] ?? 0;
    secret += SCRATCH_SECRET_ALPHABET[byteVal % alphabetLen];
  }

  return secret;
}
