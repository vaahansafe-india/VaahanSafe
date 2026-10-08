import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "../../_auth";
import { getApiDatabase } from "../../_db";

export const dynamic = "force-dynamic";

interface AuditLogRow {
  id: string;
  qr_sticker_id: string;
  from_status: string;
  to_status: string;
  trigger_source: string;
  actor_type: string;
  actor_id: string | null;
  created_at: string;
  public_code: string;
}

/**
 * Platform Audit Logs (GET /v1/admin/audit-logs)
 *
 * Immutable append-only audit entries for QR transitions, activation events, and incident operations.
 */
export async function GET(req: NextRequest) {
  const authOrResponse = await requireAdminSession(req);
  if (authOrResponse instanceof NextResponse) {
    return authOrResponse;
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 30, 1), 100);
  const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);

  const db = getApiDatabase();

  try {
    const rows = await db.query<AuditLogRow>(
      `SELECT h.id, h.qr_sticker_id, h.from_status, h.to_status, h.trigger_source,
              h.actor_type, h.actor_id, h.created_at, q.public_code
       FROM qr_status_history h
       JOIN qr_stickers q ON q.id = h.qr_sticker_id
       ORDER BY h.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    return NextResponse.json(
      {
        success: true,
        limit,
        offset,
        auditLogs: rows.map((r) => ({
          id: r.id,
          publicCode: r.public_code,
          fromStatus: r.from_status,
          toStatus: r.to_status,
          trigger: r.trigger_source,
          actorType: r.actor_type,
          actorId: r.actor_id,
          timestamp: r.created_at,
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
    console.error("[ApiAdminAuditLogsGet] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load audit logs", code: "ERR_LOAD_AUDIT_LOGS" },
      { status: 500 }
    );
  }
}
