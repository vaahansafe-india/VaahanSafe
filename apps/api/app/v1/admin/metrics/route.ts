import { NextRequest, NextResponse } from "next/server";
import { getApiDatabase } from "../../_db";

export const dynamic = "force-dynamic";

/**
 * Operations Metrics Endpoint (GET /v1/admin/metrics)
 *
 * Provides real-time aggregated operational metrics for apps/admin.
 */
export async function GET(req: NextRequest) {
  try {
    const db = getApiDatabase();

    // Query stickers breakdown
    const stickerCounts = await db.query<{ status: string; count: number }>(
      `SELECT status, COUNT(*) AS count
       FROM qr_stickers
       GROUP BY status`
    );

    let totalStickers = 0;
    let activatedStickers = 0;
    let inventoryStickers = 0;

    for (const row of stickerCounts) {
      const c = Number(row.count) || 0;
      totalStickers += c;
      if (row.status === "ACTIVATED") {
        activatedStickers += c;
      } else if (["PRINTED", "WITH_DISTRIBUTOR", "WITH_RETAILER", "IN_TRANSIT_DISTRIBUTOR"].includes(row.status)) {
        inventoryStickers += c;
      }
    }

    // Query registered vehicles count
    const vehicleRow = await db.queryFirst<{ count: number }>(
      "SELECT COUNT(*) AS count FROM vehicles WHERE status = 'ACTIVE'"
    );
    const totalVehicles = Number(vehicleRow?.count) || 0;

    // Query emergency scans in last 24h
    const scanRow = await db.queryFirst<{ count: number }>(
      `SELECT COUNT(*) AS count
       FROM qr_scan_events
       WHERE scan_type = 'EMERGENCY_TRIGGER'
         AND created_at > datetime('now', '-24 hours')`
    );
    const emergencyAlerts24h = Number(scanRow?.count) || 0;

    // Query active subscriptions count
    const subRow = await db.queryFirst<{ count: number }>(
      "SELECT COUNT(*) AS count FROM subscriptions WHERE status = 'ACTIVE'"
    );
    const activeSubscriptions = Number(subRow?.count) || 0;

    // Query total paid orders count
    const orderRow = await db.queryFirst<{ count: number; total_revenue: number }>(
      "SELECT COUNT(*) AS count, COALESCE(SUM(total_minor), 0) AS total_revenue FROM orders WHERE status IN ('PAID', 'FULFILLED')"
    );

    return NextResponse.json(
      {
        success: true,
        metrics: {
          totalStickersPrinted: totalStickers,
          activeSubscriptions,
          retailActivations: activatedStickers,
          inventoryStickers,
          emergencyAlerts24h,
          totalVehicles,
          totalPaidOrders: Number(orderRow?.count) || 0,
          totalRevenuePaise: Number(orderRow?.total_revenue) || 0,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("[ApiAdminMetrics] Query failed:", error);
    return NextResponse.json(
      { error: "Failed to load operational metrics", code: "ERR_METRICS_FAILED" },
      { status: 500 }
    );
  }
}
