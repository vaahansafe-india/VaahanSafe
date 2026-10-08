import { NextRequest, NextResponse } from "next/server";
import { requireUserSession } from "../_auth";
import { getApiDatabase } from "../_db";
import { getNotificationRepository } from "@vaahansafe/database";

export const dynamic = "force-dynamic";

/**
 * In-App Notifications (GET /v1/notifications)
 */
export async function GET(req: NextRequest) {
  const authOrResponse = await requireUserSession(req);
  if (authOrResponse instanceof NextResponse) {
    return authOrResponse;
  }

  const { user } = authOrResponse;
  const db = getApiDatabase();
  const notifRepo = getNotificationRepository(db);

  try {
    const [notifications, unreadCount] = await Promise.all([
      notifRepo.findByUserId(user.id, 50, 0),
      notifRepo.countUnreadByUserId(user.id),
    ]);

    return NextResponse.json(
      {
        success: true,
        unreadCount,
        notifications: notifications.map((n) => ({
          id: n.id,
          category: n.category,
          priority: n.priority,
          title: n.title,
          body: n.bodySafe,
          actionType: n.actionType,
          actionTarget: n.actionTarget,
          isRead: Boolean(n.readAt),
          readAt: n.readAt,
          createdAt: n.createdAt,
        })),
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("[ApiNotificationsGet] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load notifications", code: "ERR_LOAD_NOTIFICATIONS" },
      { status: 500 }
    );
  }
}
