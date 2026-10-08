import { NextRequest, NextResponse } from "next/server";
import { requireUserSession } from "../../_auth";
import { getApiDatabase } from "../../_db";
import { getNotificationRepository } from "@vaahansafe/database";

export const dynamic = "force-dynamic";

/**
 * Mark All Notifications As Read (POST /v1/notifications/read-all)
 */
export async function POST(req: NextRequest) {
  const authOrResponse = await requireUserSession(req);
  if (authOrResponse instanceof NextResponse) {
    return authOrResponse;
  }

  const { user } = authOrResponse;
  const db = getApiDatabase();
  const notifRepo = getNotificationRepository(db);

  try {
    const affected = await notifRepo.markAllAsRead(user.id);

    return NextResponse.json(
      {
        success: true,
        markedCount: affected,
        message: "All notifications marked as read",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[ApiNotificationReadAll] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to mark all as read", code: "ERR_READ_ALL" },
      { status: 500 }
    );
  }
}
