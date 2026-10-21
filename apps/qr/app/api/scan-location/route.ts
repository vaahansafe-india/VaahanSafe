import { NextResponse } from "next/server";
import { getAuthoritativeDatabaseClient } from "@vaahansafe/database";
import {
  resolvePublicQr,
  isFreshScanLocation,
  scanLocationLabels,
} from "@vaahansafe/qr-core";
import { readScanLocationTicket } from "../../../lib/scan-location-ticket";
import { createSupabaseQrRepository } from "../../../lib/supabase-resolver";

export const dynamic = "force-dynamic";
const reply = (body: object, status: number) =>
  NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
export async function POST(request: Request) {
  try {
    if (request.headers.get("origin") !== new URL(request.url).origin)
      return reply({ error: "Open the QR page to share your location." }, 403);
    if (
      !request.headers.get("content-type")?.startsWith("application/json") ||
      !request.body
    )
      return reply({ error: "Invalid location request." }, 400);
    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 4096) {
        await reader.cancel();
        return reply({ error: "Invalid location request." }, 413);
      }
      chunks.push(value);
    }
    let body;
    try {
      body = JSON.parse(Buffer.concat(chunks).toString());
    } catch {
      return reply({ error: "Invalid location request." }, 400);
    }
    const ticket = readScanLocationTicket(body?.ticket);
    if (!ticket)
      return reply(
        {
          error: "This scan session expired. Refresh the QR page to continue.",
        },
        410,
      );
    if (body.consent !== true || !isFreshScanLocation(body.location))
      return reply(
        { error: "Share a fresh device location to continue." },
        400,
      );
    const resolution = await resolvePublicQr(ticket.publicId, {
      repository: createSupabaseQrRepository(),
    });
    if (resolution.state !== "ACTIVE" || resolution.qrId !== ticket.qrId)
      return reply({ error: "This QR is unavailable right now." }, 404);
    const db = getAuthoritativeDatabaseClient();
    // Check the signed event before contacting the geocoder; never accept a browser event ID.
    const event = await db.queryFirst<{
      id: string;
      referrer_class: string;
      city: string | null;
      state: string | null;
    }>(
      "SELECT id, referrer_class, city, state FROM qr_scan_events WHERE id = ? AND qr_id = ? AND result = 'RESOLVED_ACTIVE'",
      [ticket.eventId, ticket.qrId],
    );
    if (!event)
      return reply(
        {
          error: "Your scan is still being recorded. Please retry in a moment.",
        },
        409,
      );
    if (event.referrer_class === "DIRECT_SCAN_LOCATION_SHARED")
      return reply(
        {
          recorded: true,
          place: [event.city, event.state].filter(Boolean).join(", "),
        },
        200,
      );
    const place = await scanLocationLabels(body.location);
    const saved = await db.execute(
      "UPDATE qr_scan_events SET city = ?, state = ?, region = ?, country = ?, referrer_class = 'DIRECT_SCAN_LOCATION_SHARED' WHERE id = ? AND qr_id = ? AND referrer_class = 'DIRECT_SCAN'",
      [
        place.city,
        place.state,
        place.state,
        place.country,
        ticket.eventId,
        ticket.qrId,
      ],
    );
    if (!saved.success || saved.rowsAffected !== 1)
      return reply({ error: "Please retry sharing your location." }, 409);
    return reply(
      {
        recorded: true,
        place: [place.city, place.state].filter(Boolean).join(", "),
      },
      200,
    );
  } catch {
    console.warn("[QR location] Location capture unavailable");
    return reply(
      { error: "We couldn’t save your location right now. Please try again." },
      503,
    );
  }
}
