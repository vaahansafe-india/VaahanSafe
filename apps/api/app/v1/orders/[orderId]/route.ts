import { NextRequest, NextResponse } from "next/server";
import { requireUserSession } from "../../_auth";
import { getApiDatabase } from "../../_db";
import { D1OrderRepository } from "@vaahansafe/database";

export const dynamic = "force-dynamic";

/**
 * Order Details & Fulfillment Status (GET /v1/orders/:orderId)
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  const authOrResponse = await requireUserSession(req);
  if (authOrResponse instanceof NextResponse) {
    return authOrResponse;
  }

  const { user } = authOrResponse;
  const { orderId } = await context.params;

  const db = getApiDatabase();
  const orderRepo = new D1OrderRepository(db);

  try {
    const order = await orderRepo.findById(orderId);
    if (!order || order.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Order not found", code: "ERR_NOT_FOUND" },
        { status: 404 }
      );
    }

    // Query items
    const items = await db.query<{
      id: string;
      name: string;
      catalog_code: string;
      quantity: number;
      unit_price_minor: number;
      total_price_minor: number;
    }>("SELECT * FROM order_items WHERE order_id = ?", [orderId]);

    // Query fulfillment if any
    const fulfillment = await db.queryFirst<{
      id: string;
      status: string;
      tracking_number: string | null;
      courier: string | null;
      shipped_at: string | null;
      delivered_at: string | null;
    }>(
      `SELECT f.id, f.status, s.tracking_number, s.courier, s.shipped_at, s.delivered_at
       FROM fulfilments f
       LEFT JOIN shipments s ON s.fulfilment_id = f.id
       WHERE f.order_id = ?`,
      [orderId]
    );

    return NextResponse.json(
      {
        success: true,
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          currency: order.currency,
          subtotalPaise: order.subtotalMinor,
          totalPaise: order.totalMinor,
          totalRupees: (order.totalMinor / 100).toFixed(2),
          createdAt: order.createdAt,
          paidAt: order.paidAt,
          items: items.map((i) => ({
            id: i.id,
            name: i.name,
            code: i.catalog_code,
            quantity: i.quantity,
            unitPriceMinor: i.unit_price_minor,
            totalPriceMinor: i.total_price_minor,
          })),
          fulfillment: fulfillment
            ? {
                id: fulfillment.id,
                status: fulfillment.status,
                trackingNumber: fulfillment.tracking_number,
                courier: fulfillment.courier,
                shippedAt: fulfillment.shipped_at,
                deliveredAt: fulfillment.delivered_at,
              }
            : null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[ApiOrderDetailGet] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load order", code: "ERR_LOAD_ORDER" },
      { status: 500 }
    );
  }
}
