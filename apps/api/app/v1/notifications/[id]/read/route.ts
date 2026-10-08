import { NextRequest, NextResponse } from "next/server";
import { requireUserSession } from "../../../_auth";
import { getApiDatabase } from "../../../_db";
import { getNotificationRepository } from "@vaahansafe/database";

export const dynamic = "force-dynamic";

/**
 * Mark Notification As Read (POST /v1/notifications/:id/read)
 *
 * Enforces IDOR security check ensuring notification belongs to calling user.
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authOrResponse = await requireUserSession(req);
  if (authOrResponse instanceof NextResponse) {
    return authOrResponse;
  }

  const { user } = authOrResponse;
  const { id } = await context.params;

  const db = getApiDatabase();
  const notifRepo = getNotificationRepository(db);

  try {
    const success = await notifRepo.markAsRead(id, user.id);

    return NextResponse.json(
      {
        success,
        message: success ? "Notification marked as read" : "Notification not found or already read",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[ApiNotificationMarkRead] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to mark notification as read", code: "ERR_MARK_READ" },
      { status: 500 }
    );
  }
}
