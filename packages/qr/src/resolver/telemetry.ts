/**
 * VaahanSafe Privacy-Safe QR Resolver Telemetry
 *
 * SECTION 39, 40 & 41:
 * - Legitimate public QR resolution produces a scan/resolution event.
 * - Does not count prefetch, crawler, health check, or asset requests.
 * - Non-blocking: Telemetry failure MUST NOT fail or stall public QR resolution.
 * - Initial geography is approximate edge data. Consented browser geography may
 *   enrich this event later; analytics never stores exact GPS coordinates.
 */

import type { DatabaseClient } from "@vaahansafe/database";
import type { QrPublicResolverState } from "./types";

export interface RecordScanEventParams {
  db: DatabaseClient;
  qrId: string;
  state: QrPublicResolverState;
  eventId?: string;
  headers?: Headers | Record<string, string | string[] | undefined> | null;
}

function getHeader(
  headers:
    Headers | Record<string, string | string[] | undefined> | null | undefined,
  name: string,
): string | null {
  if (!headers) return null;
  if ("get" in headers && typeof headers.get === "function") {
    return headers.get(name);
  }
  const rec = headers as Record<string, string | string[] | undefined>;
  const val = rec[name] || rec[name.toLowerCase()];
  if (Array.isArray(val)) return val[0] || null;
  return val || null;
}

export function parseUserAgentFamily(userAgent: string): string {
  if (!userAgent) return "Unknown";
  if (/iphone|ipad|ipod/i.test(userAgent)) return "Mobile Safari";
  if (/android.*mobile/i.test(userAgent)) return "Chrome Mobile";
  if (/android/i.test(userAgent)) return "Android Tablet";
  if (/chrome/i.test(userAgent) && !/edge|opr/i.test(userAgent))
    return "Chrome";
  if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) return "Safari";
  if (/firefox/i.test(userAgent)) return "Firefox";
  if (/edg/i.test(userAgent)) return "Edge";
  return "Browser";
}

/**
 * Best-effort, non-blocking scan event logger.
 * Safe to fire-and-forget or await in server components without error propagation.
 */
export async function recordPublicScanEventSafely(
  params: RecordScanEventParams,
): Promise<void> {
  const { db, qrId, state, headers } = params;

  try {
    const purpose = [
      getHeader(headers, "purpose"),
      getHeader(headers, "sec-purpose"),
    ].join(" ");
    const userAgent = getHeader(headers, "user-agent") || "";

    // 1. Filter out prefetch and automated crawlers / bots
    const isPrefetch = /\b(?:prefetch|prerender|preview)\b/i.test(purpose);
    const isBot =
      /bot|crawler|spider|crawling|slurp|facebookexternalhit|bingpreview|whatsapp/i.test(
        userAgent,
      );

    if (isPrefetch || isBot) {
      return;
    }

    // 2. Resolve safe scan result status
    let scanResult: string;
    switch (state) {
      case "ACTIVE":
        scanResult = "RESOLVED_ACTIVE";
        break;
      case "REPLACED":
        scanResult = "RESOLVED_REPLACED";
        break;
      case "BLOCKED":
      case "LOST_DAMAGED":
        scanResult = "RESOLVED_BLOCKED";
        break;
      case "SETUP_REQUIRED":
        // Staged offline inventory has no scan-history entitlement yet.
        return;
      case "ACTIVATION_AVAILABLE":
        scanResult = "RESOLVED_INACTIVE";
        break;
      case "UNKNOWN":
      default:
        scanResult = "NOT_FOUND";
        break;
    }

    const city =
      getHeader(headers, "cf-ipcity") ||
      getHeader(headers, "x-vercel-ip-city") ||
      null;
    const region =
      getHeader(headers, "cf-region") ||
      getHeader(headers, "cf-ipregion") ||
      getHeader(headers, "x-vercel-ip-country-region") ||
      null;
    const uaFamily = parseUserAgentFamily(userAgent);
    const country =
      getHeader(headers, "cf-ipcountry") ||
      getHeader(headers, "x-vercel-ip-country") ||
      null;
    const eventId =
      params.eventId ||
      `qse_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;

    // Resolve internal primary key if a publicId was supplied
    let resolvedQrId = qrId;
    if (resolvedQrId && !resolvedQrId.startsWith("qr_")) {
      const sticker = await db.queryFirst<{ id: string }>(
        `SELECT id FROM qr_stickers WHERE public_id = ? OR id = ? LIMIT 1`,
        [resolvedQrId, resolvedQrId],
      );
      if (!sticker) {
        // Unknown or non-existent QR identifier: skip inserting to respect foreign key constraint
        return;
      }
      resolvedQrId = sticker.id;
    }

    const nowIso = new Date().toISOString();

    const postgres = db.dialect === "postgres";
    await db.execute(
      `INSERT INTO qr_scan_events (
         id, qr_id, scan_type, result, city, state, user_agent_family, referrer_class, created_at${postgres ? ", country" : ""}
       ) VALUES (?, ?, 'PUBLIC_RESOLVE', ?, ?, ?, ?, 'DIRECT_SCAN', ?${postgres ? ", ?" : ""})`,
      [
        eventId,
        resolvedQrId,
        scanResult,
        city,
        region,
        uaFamily,
        nowIso,
        ...(postgres ? [country] : []),
      ],
    );
  } catch (err) {
    // Invariant 41: Analytics failure MUST NOT block public QR resolution
    // Silent catch with low-noise server log
    if (process.env.NODE_ENV !== "production") {
      console.warn("[VaahanSafe QR Telemetry] Scan event ignored:", err);
    }
  }
}
