import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "../../_auth";
import { getApiDatabase } from "../../_db";

export const dynamic = "force-dynamic";

interface AdminUserRow {
  id: string;
  primary_phone: string | null;
  primary_email: string | null;
  full_name: string | null;
  onboarding_status: string;
  status: string;
  created_at: string;
  vehicles_count: number;
}

/**
 * Admin User Fleet List (GET /v1/admin/users)
 */
export async function GET(req: NextRequest) {
  const authOrResponse = await requireAdminSession(req);
  if (authOrResponse instanceof NextResponse) {
    return authOrResponse;
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 20, 1), 100);
  const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);
  const search = searchParams.get("search")?.trim() || "";

  const db = getApiDatabase();

  try {
    let whereClause = "WHERE 1=1";
    const params: unknown[] = [];

    if (search) {
      whereClause += " AND (primary_phone LIKE ? OR primary_email LIKE ? OR full_name LIKE ?)";
      const pattern = `%${search}%`;
      params.push(pattern, pattern, pattern);
    }

    params.push(limit, offset);

    const rows = await db.query<AdminUserRow>(
      `SELECT u.id, u.primary_phone, u.primary_email, u.full_name, u.onboarding_status, u.status, u.created_at,
              (SELECT COUNT(*) FROM vehicles v WHERE v.user_id = u.id AND v.status != 'DELETED') as vehicles_count
       FROM users u
       ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT ? OFFSET ?`,
      params
    );

    const countRow = await db.queryFirst<{ total: number }>(
      "SELECT COUNT(*) AS total FROM users"
    );

    return NextResponse.json(
      {
        success: true,
        total: Number(countRow?.total) || 0,
        limit,
        offset,
        users: rows.map((u) => ({
          id: u.id,
          phone: u.primary_phone,
          email: u.primary_email,
          name: u.full_name,
          onboardingState: u.onboarding_status,
          status: u.status,
          vehiclesCount: Number(u.vehicles_count) || 0,
          createdAt: u.created_at,
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
    console.error("[ApiAdminUsersGet] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load users", code: "ERR_LOAD_USERS" },
      { status: 500 }
    );
  }
}
