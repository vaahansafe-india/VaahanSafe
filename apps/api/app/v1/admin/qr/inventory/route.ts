import { NextRequest, NextResponse } from "next/server";
import { getApiDatabase } from "../../../_db";

export const dynamic = "force-dynamic";

/**
 * Admin QR Inventory Search & Query Endpoint (GET /v1/admin/qr/inventory)
 *
 * Supports paginated listing, lifecycle filtering, batch lookup, and search.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get("batchId")?.trim();
    const status = searchParams.get("status")?.trim();
    const search = searchParams.get("search")?.trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const offset = (page - 1) * limit;

    const db = getApiDatabase();

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (batchId) {
      conditions.push("s.batch_id = ?");
      params.push(batchId);
    }

    if (status) {
      conditions.push("s.status = ?");
      params.push(status);
    }

    if (search) {
      conditions.push("(s.public_id LIKE ? OR s.visible_code LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Total count query
    const countRow = await db.queryFirst<{ count: number }>(
      `SELECT COUNT(*) AS count FROM qr_stickers s ${whereClause}`,
      params
    );
    const total = Number(countRow?.count) || 0;

    // Items query
    const items = await db.query<{
      id: string;
      public_id: string;
      visible_code: string;
      status: string;
      batch_id: string;
      batch_code: string | null;
      activated_at: string | null;
      vehicle_id: string | null;
      registration_number: string | null;
      created_at: string;
    }>(
      `SELECT s.id, s.public_id, s.visible_code, s.status, s.batch_id,
              b.reference_code AS batch_code, s.activated_at,
              a.vehicle_id, v.registration_number, s.created_at
       FROM qr_stickers s
       LEFT JOIN qr_batches b ON s.batch_id = b.id
       LEFT JOIN qr_assignments a ON s.id = a.qr_id AND a.ended_at IS NULL
       LEFT JOIN vehicles v ON a.vehicle_id = v.id
       ${whereClause}
       ORDER BY s.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return NextResponse.json(
      {
        success: true,
        data: items.map((i) => ({
          id: i.id,
          publicId: i.public_id,
          visibleCode: i.visible_code,
          status: i.status,
          batchId: i.batch_id,
          batchCode: i.batch_code,
          activatedAt: i.activated_at,
          vehicleId: i.vehicle_id,
          registrationNumber: i.registration_number,
          createdAt: i.created_at,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
      {
        status: 200,
        headers: { "Cache-Control": "private, no-cache, no-store, must-revalidate" },
      }
    );
  } catch (error) {
    console.error("[ApiAdminQrInventory GET] Query failed:", error);
    return NextResponse.json(
      { error: "Failed to retrieve QR inventory", code: "ERR_INVENTORY_QUERY_FAILED" },
      { status: 500 }
    );
  }
}
