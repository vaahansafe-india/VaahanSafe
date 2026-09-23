import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedCustomer } from "@/lib/session";
import { getAuthoritativeDatabaseClient } from "@vaahansafe/database";
import { recordPublicScanEventSafely, getQrUrl } from "@vaahansafe/qr-core";

export const dynamic = "force-dynamic";

interface StickerRow {
  id: string;
  public_id: string;
  status: string;
}

/**
 * Authoritative Server Endpoint: QR Test Scan
 * 
 * Allows an authenticated vehicle owner to test their active QR identity.
 * Strictly verifies ownership in D1, securely writes a verified scan event,
 * and returns the authoritative resolver URL.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedCustomer();
    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to test your QR pass." },
        { status: 401 }
      );
    }

    let publicId: string | undefined;
    try {
      const body = await request.json();
      publicId = body.publicId;
    } catch {
      // Body might be empty, check searchParams
    }

    if (!publicId) {
      const { searchParams } = new URL(request.url);
      publicId = searchParams.get("id") || undefined;
    }

    const db = getAuthoritativeDatabaseClient();

    // Query active sticker owned by the authenticated customer
    let sticker: StickerRow | null = null;
    if (publicId) {
      sticker = await db.queryFirst<StickerRow>(
        `SELECT s.id, s.public_id, s.status
         FROM qr_stickers s
         JOIN qr_assignments a ON s.id = a.qr_id AND a.ended_at IS NULL
         WHERE a.user_id = ? AND (s.public_id = ? OR s.id = ?)
         LIMIT 1`,
        [auth.user.id, publicId, publicId]
      );
    } else {
      sticker = await db.queryFirst<StickerRow>(
        `SELECT s.id, s.public_id, s.status
         FROM qr_stickers s
         JOIN qr_assignments a ON s.id = a.qr_id AND a.ended_at IS NULL
         WHERE a.user_id = ?
         ORDER BY a.assigned_at DESC
         LIMIT 1`,
        [auth.user.id]
      );
    }

    if (!sticker) {
      return NextResponse.json(
        { error: "No active QR pass found for this account." },
        { status: 404 }
      );
    }

    // Authoritative record telemetry insertion in D1
    await recordPublicScanEventSafely({
      db,
      qrId: sticker.id,
      state: sticker.status === "ACTIVATED" ? "ACTIVE" : "ACTIVATION_AVAILABLE",
      headers: request.headers,
    });

    const resolverUrl = getQrUrl(sticker.public_id);

    return NextResponse.json({
      success: true,
      recorded: true,
      qrId: sticker.id,
      publicId: sticker.public_id,
      resolverUrl,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    console.error("[VaahanSafe Test Scan API Error]:", message);
    return NextResponse.json(
      { error: "We couldn't record the test scan right now. Please try again." },
      { status: 500 }
    );
  }
}
