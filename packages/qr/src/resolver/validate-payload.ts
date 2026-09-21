/**
 * Zero-Trust QR Payload Parser & Host Allowlist Validator
 *
 * CRITICAL INVARIANTS:
 * 1. A decoded QR is untrusted user input.
 * 2. Never navigate to arbitrary or unverified URLs.
 * 3. Enforce exact hostname matching (qr.vaahansafe.com) and reject lookalike domains.
 * 4. Reject dangerous URI schemes (javascript:, data:, file:, intent:).
 * 5. Extract only the safe publicId and normalize.
 */

export function isValidPublicIdFormat(publicId: string): boolean {
  if (!publicId || typeof publicId !== "string") return false;
  const trimmed = publicId.trim();
  if (trimmed.length < 3 || trimmed.length > 64) return false;
  return /^[a-zA-Z0-9_-]+$/.test(trimmed);
}

export type QrPayloadRejectionReason =
  | "EMPTY_PAYLOAD"
  | "INVALID_PROTOCOL"
  | "NOT_VAAHANSAFE_HOST"
  | "INVALID_PATH"
  | "MALFORMED_PUBLIC_ID";

export interface QrPayloadParseResult {
  valid: boolean;
  publicId?: string;
  rawPayload: string;
  reason?: QrPayloadRejectionReason;
}

const ALLOWED_HOSTS = new Set([
  "qr.vaahansafe.com",
  // Local development hosts
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
]);

/**
 * Parses and validates an untrusted QR string scanned by the camera or manual entry.
 * Guarantees that only valid VaahanSafe identities on the approved domain are accepted.
 */
export function parseVaahanSafeQrPayload(raw: string): QrPayloadParseResult {
  if (!raw || typeof raw !== "string") {
    return { valid: false, rawPayload: "", reason: "EMPTY_PAYLOAD" };
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return { valid: false, rawPayload: "", reason: "EMPTY_PAYLOAD" };
  }

  // 1. Direct Alphanumeric Identifier fallback (e.g. VS-7F3K-9021 or 7F3K9021)
  if (!trimmed.includes("://") && !trimmed.includes("/")) {
    const cleanId = trimmed.toUpperCase().replace(/^VS-/, "");
    if (isValidPublicIdFormat(cleanId)) {
      return { valid: true, publicId: cleanId, rawPayload: trimmed };
    }
    return { valid: false, rawPayload: trimmed, reason: "MALFORMED_PUBLIC_ID" };
  }

  // 2. Full URL Parsing
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmed);
  } catch {
    return { valid: false, rawPayload: trimmed, reason: "MALFORMED_PUBLIC_ID" };
  }

  // 3. Protocol Validation
  const isLocal = parsedUrl.hostname === "localhost" || parsedUrl.hostname === "127.0.0.1" || parsedUrl.hostname === "0.0.0.0";
  if (parsedUrl.protocol !== "https:" && !(isLocal && parsedUrl.protocol === "http:")) {
    return { valid: false, rawPayload: trimmed, reason: "INVALID_PROTOCOL" };
  }

  // 4. Exact Host Allowlisting (no lookalikes!)
  const host = parsedUrl.hostname.toLowerCase();
  if (!ALLOWED_HOSTS.has(host)) {
    return { valid: false, rawPayload: trimmed, reason: "NOT_VAAHANSAFE_HOST" };
  }

  // 5. Path Structure Validation (must be single segment /[publicId])
  const pathname = parsedUrl.pathname.replace(/^\/+|\/+$/g, "");
  const segments = pathname ? pathname.split("/") : [];

  if (segments.length !== 1 || !segments[0]) {
    return { valid: false, rawPayload: trimmed, reason: "INVALID_PATH" };
  }

  const rawId = decodeURIComponent(segments[0]);
  const cleanId = rawId.toUpperCase().replace(/^VS-/, "");

  if (!isValidPublicIdFormat(cleanId)) {
    return { valid: false, rawPayload: trimmed, reason: "MALFORMED_PUBLIC_ID" };
  }

  return {
    valid: true,
    publicId: cleanId,
    rawPayload: trimmed,
  };
}
