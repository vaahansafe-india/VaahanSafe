import { NextRequest, NextResponse } from "next/server";
import { requireUserSession } from "../_auth";
import { getApiDatabase } from "../_db";
import { D1OrderRepository } from "@vaahansafe/database";

export const dynamic = "force-dynamic";

interface OrderRow {
  id: string;
  order_number: string;
  status: string;
  currency: string;
  subtotal_minor: number;
  total_minor: number;
  shipping_address_id: string | null;
  vehicle_id: string | null;
  created_at: string;
  paid_at: string | null;
}

/**
 * Customer Orders (GET /v1/orders, POST /v1/orders)
 */
export async function GET(req: NextRequest) {
  const authOrResponse = await requireUserSession(req);
  if (authOrResponse instanceof NextResponse) {
    return authOrResponse;
  }

  const { user } = authOrResponse;
  const db = getApiDatabase();

  try {
    const orders = await db.query<OrderRow>(
      `SELECT id, order_number, status, currency, subtotal_minor, total_minor,
              shipping_address_id, vehicle_id, created_at, paid_at
       FROM orders
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [user.id]
    );

    return NextResponse.json(
      {
        success: true,
        orders: orders.map((o) => ({
          id: o.id,
          orderNumber: o.order_number,
          status: o.status,
          currency: o.currency,
          totalAmountPaise: o.total_minor,
          totalAmountRupees: (o.total_minor / 100).toFixed(2),
          shippingAddressId: o.shipping_address_id,
          vehicleId: o.vehicle_id,
          createdAt: o.created_at,
          paidAt: o.paid_at,
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
    console.error("[ApiOrdersGet] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load orders", code: "ERR_LOAD_ORDERS" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const authOrResponse = await requireUserSession(req);
  if (authOrResponse instanceof NextResponse) {
    return authOrResponse;
  }

  const { user } = authOrResponse;
  const body = await req.json().catch(() => ({}));

  const { productCode, shippingAddressId, vehicleId } = body || {};

  if (!productCode) {
    return NextResponse.json(
      { success: false, error: "Product code is required", code: "ERR_PRODUCT_REQUIRED" },
      { status: 400 }
    );
  }

  const db = getApiDatabase();

  try {
    // 1. Authoritative product pricing lookup (Rule 08: Never trust client amount)
    const product = await db.queryFirst<{
      id: string;
      code: string;
      name: string;
      price_minor: number;
      currency: string;
      requires_shipping: number;
      status: string;
    }>(
      "SELECT id, code, name, price_minor, currency, requires_shipping, status FROM products WHERE code = ? AND status = 'ACTIVE'",
      [productCode]
    );

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not available or active", code: "ERR_PRODUCT_NOT_FOUND" },
        { status: 404 }
      );
    }

    if (product.requires_shipping === 1 && !shippingAddressId) {
      return NextResponse.json(
        { success: false, error: "Shipping address is required for physical items", code: "ERR_SHIPPING_REQUIRED" },
        { status: 400 }
      );
    }

    const orderId = `ord_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const orderNumber = `VS-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();

    const orderRepo = new D1OrderRepository(db);

    await orderRepo.createWithItems(
      {
        id: orderId as any,
        userId: user.id,
        orderNumber,
        status: "PENDING_PAYMENT",
        currency: "INR",
        subtotalMinor: product.price_minor,
        discountMinor: 0,
        shippingMinor: 0,
        taxMinor: 0,
        totalMinor: product.price_minor,
        shippingAddressId: shippingAddressId || undefined,
        vehicleId: vehicleId || undefined,
        createdAt: now,
        updatedAt: now,
      },
      [
        {
          id: `item_${Date.now()}_1` as any,
          orderId: orderId as any,
          itemType: "PRODUCT",
          productId: product.id as any,
          catalogCode: product.code,
          name: product.name,
          quantity: 1,
          unitPriceMinor: product.price_minor,
          totalPriceMinor: product.price_minor,
          createdAt: now,
        },
      ]
    );

    return NextResponse.json(
      {
        success: true,
        order: {
          id: orderId,
          orderNumber,
          status: "PENDING_PAYMENT",
          currency: "INR",
          totalMinor: product.price_minor,
          totalRupees: (product.price_minor / 100).toFixed(2),
          requiresPayment: product.price_minor > 0,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[ApiOrdersPost] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create order", code: "ERR_ORDER_CREATION_FAILED" },
      { status: 500 }
    );
  }
}
