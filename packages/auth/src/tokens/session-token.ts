/**
 * VaahanSafe Session Token Cryptography & Lifecycle
 *
 * INVARIANTS:
 * - Raw bearer tokens are 256-bit cryptographically secure random values (hex-encoded).
 * - Raw bearer tokens are NEVER persisted to Cloudflare D1.
 * - Only SHA-256(rawToken) is stored in sessions.token_hash.
 * - Sessions rotate on login and privilege elevations.
 */

import type { Session, SessionRepository } from "@vaahansafe/types";

/**
 * Generates a cryptographically secure 256-bit random bearer token (64 hex characters).
 */
export function generateRawSessionToken(): string {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  // Fallback if global crypto is absent
  const nodeCrypto = require("crypto");
  return nodeCrypto.randomBytes(32).toString("hex");
}

/**
 * Computes SHA-256 hash of a session token.
 * Output is 64 hex characters, identical to standard SHA-256 hex digest.
 */
export async function hashSessionToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);

  if (typeof crypto !== "undefined" && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  // Node.js fallback
  const nodeCrypto = require("crypto");
  return nodeCrypto.createHash("sha256").update(token).digest("hex");
}

export interface IssueSessionOptions {
  userAgent?: string;
  ipAddress?: string;
  ttlSeconds?: number; // Default 30 days (2,592,000s)
}

export interface IssuedSessionResult {
  session: Session;
  rawToken: string;
}

const DEFAULT_CUSTOMER_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

/**
 * Creates and persists a new hashed session.
 * Returns both the persisted Session entity (containing tokenHash)
 * and the ephemeral rawToken (to be sent via HttpOnly cookie).
 */
export async function issueSession(
  userId: string,
  sessionRepo: SessionRepository,
  options: IssueSessionOptions = {}
): Promise<IssuedSessionResult> {
  const rawToken = generateRawSessionToken();
  const tokenHash = await hashSessionToken(rawToken);
  const ttl = options.ttlSeconds ?? DEFAULT_CUSTOMER_TTL_SECONDS;
  const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();

  const session = await sessionRepo.createSession({
    userId,
    tokenHash,
    userAgent: options.userAgent,
    ipAddress: options.ipAddress,
    expiresAt,
  });

  return {
    session: {
      ...session,
      token: rawToken,
    },
    rawToken,
  };
}

/**
 * Rotates an existing session:
 * 1. Revokes old session with reason "ROTATED".
 * 2. Issues a brand-new session token and record.
 */
export async function rotateSession(
  currentRawToken: string,
  userId: string,
  sessionRepo: SessionRepository,
  options: IssueSessionOptions = {}
): Promise<IssuedSessionResult> {
  const currentHash = await hashSessionToken(currentRawToken);
  await sessionRepo.revokeSession(currentHash, "ROTATED");
  return issueSession(userId, sessionRepo, options);
}

/**
 * Authenticates and validates a raw session token:
 * 1. Computes SHA-256 hash.
 * 2. Checks active session in repository (not revoked, not expired).
 * 3. Touches session (updates last_seen_at).
 */
export async function validateSessionToken(
  rawToken: string,
  sessionRepo: SessionRepository
): Promise<Session | null> {
  if (!rawToken || rawToken.length < 32) {
    return null;
  }
  const tokenHash = await hashSessionToken(rawToken);
  const session = await sessionRepo.findActiveByTokenHash(tokenHash);
  if (!session) {
    return null;
  }

  // Sliding session activity update (fire & forget / touched)
  await sessionRepo.touchSession(tokenHash);

  return session;
}
