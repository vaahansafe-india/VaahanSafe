/**
 * VaahanSafe Privacy-Safe QR Resolver Telemetry
 *
 * SECTION 39, 40 & 41:
 * - Legitimate public QR resolution produces a scan/resolution event.
 * - Does not count prefetch, crawler, health check, or asset requests.
 * - Non-blocking: Telemetry failure MUST NOT fail or stall public QR resolution.
 * - Privacy-safe: No GPS tracking, device fingerprinting, or long-term IP logging.
 */

import type { DatabaseClient } from "@vaahansafe/database";
import type { QrPublicResolverState } from "./types";

export interface RecordScanEventParams {
  db: DatabaseClient;
  qrId: string;
  state: QrPublicResolverState;
  headers?: Headers | Record<string, string | string[] | undefined> | null;
}

function getHeader(
  headers: Headers | Record<string, string | string[] | undefined> | null | undefined,
  name: string
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
  if (/chrome/i.test(userAgent) && !/edge|opr/i.test(userAgent)) return "Chrome";
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
  params: RecordScanEventParams
): Promise<void> {
  const { db, qrId, state, headers } = params;

  try {
    const purpose = getHeader(headers, "purpose") || getHeader(headers, "sec-purpose") || "";
    const userAgent = getHeader(headers, "user-agent") || "";

    // 1. Filter out prefetch and automated crawlers / bots
    const isPrefetch = purpose.toLowerCase() === "prefetch";
    const isBot = /bot|crawler|spider|crawling|slurp|facebookexternalhit|bingpreview/i.test(
      userAgent
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
      case "ACTIVATION_AVAILABLE":
        scanResult = "RESOLVED_INACTIVE";
        break;
      case "UNKNOWN":
      default:
        scanResult = "NOT_FOUND";
        break;
    }

    const city = getHeader(headers, "cf-ipcity") || null;
    const region =
      getHeader(headers, "cf-region") || getHeader(headers, "cf-ipregion") || null;
    const uaFamily = parseUserAgentFamily(userAgent);
    const eventId = `qse_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;

    // Resolve internal primary key if a publicId was supplied
    let resolvedQrId = qrId;
    if (resolvedQrId && !resolvedQrId.startsWith("qr_")) {
      const sticker = await db.queryFirst<{ id: string }>(
        `SELECT id FROM qr_stickers WHERE public_id = ? OR id = ? LIMIT 1`,
        [resolvedQrId, resolvedQrId]
      );
      if (!sticker) {
        // Unknown or non-existent QR identifier: skip inserting to respect foreign key constraint
        return;
      }
      resolvedQrId = sticker.id;
    }

    const nowIso = new Date().toISOString();

    await db.execute(
      `INSERT INTO qr_scan_events (
         id, qr_id, scan_type, result, city, state, user_agent_family, referrer_class, created_at
       ) VALUES (?, ?, 'PUBLIC_RESOLVE', ?, ?, ?, ?, 'DIRECT_SCAN', ?)`,
      [eventId, resolvedQrId, scanResult, city, region, uaFamily, nowIso]
    );

    // Notify vehicle owner on active QR scans
    if (scanResult === "RESOLVED_ACTIVE" && db.dialect !== "postgres") {
      try {
        const assignment = await db.queryFirst<{
          user_id: string;
          vehicle_id: string;
          registration_number: string;
          make: string;
          model: string;
          public_id: string;
        }>(
          `SELECT a.user_id, a.vehicle_id, v.registration_number, v.make, v.model, s.public_id
           FROM qr_assignments a
           JOIN vehicles v ON a.vehicle_id = v.id
           JOIN qr_stickers s ON a.qr_id = s.id
           WHERE a.qr_id = ? AND a.ended_at IS NULL
           LIMIT 1`,
          [resolvedQrId]
        );

        if (assignment?.user_id) {
          const dedupeKey = `scan_${resolvedQrId}_${nowIso.slice(0, 16)}`;
          const notifIntentId = `intent_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
          const notifId = `notif_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;

          await db.execute(
            `INSERT INTO notification_intents (
               id, event_type, recipient_user_id, category, priority,
               template_key, template_version, payload_json, source_type,
               source_id, dedupe_key, status, created_at, dispatched_at
             ) VALUES (?, 'QR_SCANNED', ?, 'SAFETY', 'HIGH', 'QR_SCANNED_V1', 1, '{}', 'SYSTEM', ?, ?, 'PROCESSED', ?, ?)
             ON CONFLICT(dedupe_key) DO NOTHING`,
            [notifIntentId, assignment.user_id, eventId, dedupeKey, nowIso, nowIso]
          );

          const locationText = [city, region].filter(Boolean).join(", ");
          const scanLocationStr = locationText ? ` near ${locationText}` : "";
          const vehicleName = `${assignment.make || ""} ${assignment.model || ""}`.trim() || "vehicle";

          await db.execute(
            `INSERT INTO notifications (
               id, user_id, intent_id, event_type, category, priority,
               title, body_safe, action_type, action_target, read_at, archived_at, created_at
             ) VALUES (?, ?, ?, 'QR_SCANNED', 'SAFETY', 'HIGH', ?, ?, 'NAVIGATE', ?, NULL, NULL, ?)
             ON CONFLICT DO NOTHING`,
            [
              notifId,
              assignment.user_id,
              notifIntentId,
              "Safety QR Scanned",
              `Someone scanned the VaahanSafe QR on your ${vehicleName} (${assignment.registration_number})${scanLocationStr}.`,
              `/vehicles/${assignment.vehicle_id}`,
              nowIso,
            ]
          );
        }
      } catch (notifErr) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[VaahanSafe QR Telemetry] Scan notification skipped:", notifErr);
        }
      }
    }
  } catch (err) {
    // Invariant 41: Analytics failure MUST NOT block public QR resolution
    // Silent catch with low-noise server log
    if (process.env.NODE_ENV !== "production") {
      console.warn("[VaahanSafe QR Telemetry] Scan event ignored:", err);
    }
  }
}
