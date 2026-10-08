import { NextRequest, NextResponse } from "next/server";
import { requireUserSession } from "../../../_auth";
import { getApiDatabase } from "../../../_db";

export const dynamic = "force-dynamic";

/**
 * Report Damaged QR Sticker (POST /v1/qr/:publicId/damaged)
 *
 * Allows vehicle owners to report their sticker as damaged/unreadable,
 * transitioning it into DAMAGED and registering replacement eligibility.
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ publicId: string }> }
) {
  const authOrResponse = await requireUserSession(req);
  if (authOrResponse instanceof NextResponse) {
    return authOrResponse;
  }

  const { user } = authOrResponse;
  const { publicId } = await context.params;
  const body = await req.json().catch(() => ({}));
  const reason = body?.reason ? String(body.reason).trim() : "Unreadable / Damaged in field";

  const db = getApiDatabase();

  try {
    // 1. Resolve sticker and verify vehicle ownership
    const sticker = await db.queryFirst<{
      id: string;
      public_code: string;
      status: string;
      vehicle_id: string | null;
      user_id: string;
    }>(
      `SELECT q.id, q.public_code, q.status, q.vehicle_id, v.user_id
       FROM qr_stickers q
       JOIN vehicles v ON v.id = q.vehicle_id
       WHERE q.public_code = ?`,
      [publicId]
    );

    if (!sticker || sticker.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "Sticker not found or not registered to your account", code: "ERR_NOT_FOUND" },
        { status: 404 }
      );
    }

    if (sticker.status === "DAMAGED" || sticker.status === "REPLACED") {
      return NextResponse.json(
        { success: false, error: `Sticker is already in ${sticker.status} state.`, code: "ERR_ALREADY_REPORTED" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // 2. Update sticker status to DAMAGED
    await db.execute(
      "UPDATE qr_stickers SET status = 'DAMAGED', updated_at = ? WHERE id = ?",
      [now, sticker.id]
    );

    // 3. Insert status history audit record
    const historyId = `qsh_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    await db.execute(
      `INSERT INTO qr_status_history (
         id, qr_sticker_id, from_status, to_status, trigger_source,
         actor_type, actor_id, metadata_json, created_at
       ) VALUES (?, ?, ?, 'DAMAGED', 'CUSTOMER_DAMAGED_REPORT', 'CUSTOMER', ?, ?, ?)`,
      [
        historyId,
        sticker.id,
        sticker.status,
        user.id,
        JSON.stringify({ reason }),
        now,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Sticker marked as damaged. You are now eligible to order or claim a replacement.",
        sticker: {
          publicCode: sticker.public_code,
          status: "DAMAGED",
          reportedAt: now,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[ApiQrDamagedPost] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to report damaged sticker", code: "ERR_REPORT_FAILED" },
      { status: 500 }
    );
  }
}
