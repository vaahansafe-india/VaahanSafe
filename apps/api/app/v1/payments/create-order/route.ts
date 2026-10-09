import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRazorpayPaymentGateway } from "@vaahansafe/payments";
import { getApiDatabase } from "../../_db";
import { getApiAuthContext } from "../../_auth";

export const dynamic = "force-dynamic";

const createOrderSchema = z.object({
  productId: z.string().trim().min(1),
  vehicleId: z.string().trim().optional(),
});

/**
 * Authoritative Payment Order Creation Endpoint (POST /v1/payments/create-order)
 *
 * SECTION 08 (Rule 08) — NEVER TRUST CLIENT AMOUNT:
 * 1. Resolves product server-side from D1 products table.
 * 2. Derives authoritative price_minor and currency.
 * 3. Creates internal order with PENDING_PAYMENT status.
 * 4. Initializes Razorpay gateway order with exact authoritative amount.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getApiAuthContext(req);
    if (!auth)
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 },
      );
    }

    const parseResult = createOrderSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid order parameters",
          code: "ERR_VALIDATION_FAILED",
          details: parseResult.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { productId, vehicleId } = parseResult.data;
    const userId = auth.user.id;
    const db = getApiDatabase();
    const identity = await db.queryFirst<{ id: string }>(
      `SELECT id FROM auth_identities WHERE user_id = ? AND provider = 'PHONE' AND provider_subject = ? AND verified_at IS NOT NULL LIMIT 1`,
      [userId, auth.user.phone || ""],
    );
    if (!identity)
      return NextResponse.json(
        { error: "Verify your mobile number before checkout" },
        { status: 403 },
      );
    if (
      vehicleId &&
      !(await db.queryFirst(
        `SELECT id FROM vehicles WHERE id = ? AND user_id = ? AND status != 'DELETED' LIMIT 1`,
        [vehicleId, userId],
      ))
    )
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    const now = new Date().toISOString();

    // 1. Authoritative Product Resolution
    const product = await db.queryFirst<{
      id: string;
      code: string;
      name: string;
      price_minor: number;
      currency: string;
      status: string;
    }>(
      `SELECT id, code, name, price_minor, currency, status
       FROM products
       WHERE (id = ? OR code = ?) AND status = 'ACTIVE'
       LIMIT 1`,
      [productId, productId],
    );

    if (!product) {
      return NextResponse.json(
        {
          error: "Product not found or inactive in catalog",
          code: "ERR_PRODUCT_NOT_FOUND",
        },
        { status: 404 },
      );
    }

    // 2. Authoritative Price Calculation (Rule 08)
    const amountMinor = product.price_minor;
    const currency = product.currency || "INR";
    if (
      currency !== "INR" ||
      !Number.isSafeInteger(amountMinor) ||
      amountMinor <= 0
    )
      throw new Error("Invalid catalog price");

    // 3. Create Internal Order Record
    const orderId = `ord_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const orderNumber = `VS-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
    const orderItemId = `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    await db.execute(
      `INSERT INTO orders (
         id, user_id, order_number, status, currency, subtotal_minor,
         discount_minor, shipping_minor, tax_minor, total_minor,
         vehicle_id, created_at, updated_at
       ) VALUES (?, ?, ?, 'PENDING_PAYMENT', ?, ?, 0, 0, 0, ?, ?, ?, ?)`,
      [
        orderId,
        userId,
        orderNumber,
        currency,
        amountMinor,
        amountMinor,
        vehicleId || null,
        now,
        now,
      ],
    );

    await db.execute(
      `INSERT INTO order_items (
         id, order_id, product_id, quantity, unit_price_minor, total_price_minor, created_at
       ) VALUES (?, ?, ?, 1, ?, ?, ?)`,
      [orderItemId, orderId, product.id, amountMinor, amountMinor, now],
    );

    // 4. Initialize Razorpay Gateway Order
    const rzpGateway = getRazorpayPaymentGateway();
    let gatewayOrderId: string;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005";

    const session = await rzpGateway.createPaymentOrder({
      orderId,
      amountPaise: amountMinor,
      currency: "INR",
      customerId: userId,
      customerPhone: auth.user.phone!,
      returnUrl: `${appUrl}/orders/${orderId}`,
      notifyUrl: `${apiUrl}/v1/payments/webhook`,
    });
    gatewayOrderId = session.gatewayOrderId;

    // 5. Record Payment Intent in Database
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    await db.execute(
      `INSERT INTO payments (
         id, order_id, provider, provider_order_id, status, amount_minor, currency, created_at, updated_at
       ) VALUES (?, ?, 'RAZORPAY', ?, 'PENDING', ?, ?, ?, ?)`,
      [paymentId, orderId, gatewayOrderId, amountMinor, currency, now, now],
    );

    return NextResponse.json(
      {
        success: true,
        order: {
          id: orderId,
          orderNumber,
          amountMinor,
          currency,
          product: {
            id: product.id,
            name: product.name,
          },
        },
        payment: {
          provider: "RAZORPAY",
          providerOrderId: gatewayOrderId,
          keyId: session.checkoutOptions!.keyId,
          amount: amountMinor,
          currency,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[ApiCreateOrder] Payment initiation unavailable");
    return NextResponse.json(
      {
        error: "Failed to create payment order. Please try again.",
        code: "ERR_CREATE_ORDER_FAILED",
      },
      { status: 500 },
    );
  }
}
