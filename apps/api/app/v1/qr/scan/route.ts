import { NextRequest, NextResponse } from "next/server";
import { recordPublicScanEventSafely, isValidPublicIdFormat } from "@vaahansafe/qr-core";
import { getApiDatabase } from "../../_db";

export const dynamic = "force-dynamic";

/**
 * QR Scan Telemetry Endpoint (POST /v1/qr/scan)
 *
 * Records privacy-preserving scan events in Cloudflare D1.
 * Filters automated crawlers, bots, and prefetch requests.
 */
export async function POST(req: NextRequest) {
  try {
    let body: { publicId?: string; state?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const { publicId, state = "ACTIVE" } = body;
    const cleanPublicId = typeof publicId === "string" ? publicId.trim() : "";

    if (!cleanPublicId || !isValidPublicIdFormat(cleanPublicId)) {
      return NextResponse.json(
        { error: "Invalid QR public identifier format", code: "ERR_INVALID_PUBLIC_ID" },
        { status: 400 }
      );
    }

    const db = getApiDatabase();

    // Look up the sticker to get its internal qrId
    const sticker = await db.queryFirst<{ id: string }>(
      "SELECT id FROM qr_stickers WHERE public_id = ? LIMIT 1",
      [cleanPublicId]
    );

    if (!sticker) {
      return NextResponse.json(
        { error: "QR sticker not found", code: "ERR_QR_NOT_FOUND" },
        { status: 404 }
      );
    }

    // Record non-blocking privacy-minimized telemetry
    await recordPublicScanEventSafely({
      db,
      qrId: sticker.id,
      state: (state as any) || "ACTIVE",
      headers: req.headers,
    });

    return NextResponse.json(
      {
        success: true,
        recorded: true,
        publicId: cleanPublicId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[ApiQrScan] Telemetry recording error:", error);
    // Best-effort response: Do not break the client experience on telemetry errors
    return NextResponse.json(
      { success: false, error: "Failed to record scan event" },
      { status: 500 }
    );
  }
}
