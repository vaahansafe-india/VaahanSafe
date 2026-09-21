/**
 * Safe Response & Download Headers Generator
 *
 * Enforces secure headers, anti-sniffing protection, and defends against
 * HTTP Response Splitting / CRLF header injection in Content-Disposition filenames.
 */

import type { StorageVisibility, AssetStatus, BucketClass } from "../types";
import { getCacheControlHeader } from "./cache-policy";

export interface SafeDownloadHeaderOptions {
  mimeType: string;
  filename?: string | null;
  disposition?: "inline" | "attachment";
  visibility: StorageVisibility;
  status: AssetStatus;
  bucket: BucketClass;
  contentLength?: number;
}

/**
 * Sanitizes a filename to prevent HTTP Response Splitting (CRLF injection)
 * and header escape sequences.
 */
export function sanitizeHeaderFilename(rawName?: string | null): {
  asciiName: string;
  encodedName: string;
} {
  if (!rawName || typeof rawName !== "string") {
    return { asciiName: "file", encodedName: "file" };
  }

  // Take only the text before any CRLF to completely discard injected headers
  const firstLine = rawName.split(/[\r\n\0]/)[0] || "file";

  // Strip quotes, slashes, and backslashes
  const clean = firstLine
    .replace(/["/\\]/g, "")
    .trim();

  // ASCII fallback: replace non-ASCII characters with underscore
  const ascii = clean.replace(/[^\x20-\x7E]/g, "_") || "file";

  // RFC 5987 / RFC 6266 UTF-8 percent-encoded filename
  const encoded = encodeURIComponent(clean || "file");

  return {
    asciiName: ascii.slice(0, 200),
    encodedName: encoded.slice(0, 300),
  };
}

/**
 * Generates the authoritative set of safe HTTP delivery headers.
 */
export function getSafeDownloadHeaders(
  options: SafeDownloadHeaderOptions
): Record<string, string> {
  const {
    mimeType,
    filename,
    disposition = "inline",
    visibility,
    status,
    bucket,
    contentLength,
  } = options;

  const { asciiName, encodedName } = sanitizeHeaderFilename(filename);

  const headers: Record<string, string> = {
    // 1. Explicit verified Content-Type (Never allow browser sniffing)
    "Content-Type": mimeType || "application/octet-stream",

    // 2. Strict MIME sniffing protection
    "X-Content-Type-Options": "nosniff",

    // 3. Safe Content-Disposition with RFC 5987 encoding
    "Content-Disposition": `${disposition}; filename="${asciiName}"; filename*=UTF-8''${encodedName}`,

    // 4. Deterministic Cache-Control
    "Cache-Control": getCacheControlHeader({ visibility, status, bucket }),
  };

  if (typeof contentLength === "number" && contentLength >= 0) {
    headers["Content-Length"] = contentLength.toString();
  }

  return headers;
}
