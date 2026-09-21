"use server";

import { getAuthenticatedCustomer } from "@/lib/session";
import { getAuthoritativeDatabaseClient } from "@vaahansafe/database";
import { getCashfreePaymentGateway } from "@vaahansafe/payments";

export interface CheckoutAddressInput {
  addressId?: string;
  recipientName?: string;
  phone?: string;
  line1?: string;
  line2?: string;
  landmark?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

export interface CreateOrderCheckoutResult {
  success: boolean;
  paymentSessionId?: string;
  orderId?: string;
  cashfreeMode?: "sandbox" | "production";
  error?: string;
}

export async function createOrderAndCashfreeSession(
  productCode: string,
  vehicleId: string | null,
  addressInput: CheckoutAddressInput
): Promise<CreateOrderCheckoutResult> {
  try {
    const auth = await getAuthenticatedCustomer();
    if (!auth) {
      return { success: false, error: "Authentication required. Please sign in." };
    }

    const db = getAuthoritativeDatabaseClient();

    // 1. Authoritative Product & Pricing Resolution (Rule 08: Server-Authoritative Pricing)
    const products = await db.query<{
      id: string;
      code: string;
      name: string;
      price_minor: number;
      currency: string;
      status: string;
    }>(
      `SELECT id, code, name, price_minor, currency, status
       FROM products
       WHERE (code = ? OR product_type = 'PHYSICAL_QR_STICKER') AND status = 'ACTIVE'
       LIMIT 1`,
      [productCode]
    );

    const product = products[0];
    if (!product) {
      return { success: false, error: "Product is currently unavailable." };
    }

    // 2. Validate Vehicle Ownership if specified
    let verifiedVehicleId: string | null = null;
    if (vehicleId && vehicleId.trim().length > 0) {
      const vehicles = await db.query<{ id: string }>(
        `SELECT id FROM vehicles WHERE id = ? AND user_id = ? LIMIT 1`,
        [vehicleId, auth.user.id]
      );
      const v = vehicles[0];
      if (v) {
        verifiedVehicleId = v.id;
      }
    }

    // 3. Resolve Shipping Address
    let shippingAddressId: string = "";
    let recipientName = addressInput.recipientName?.trim() || auth.user.name || "Valued Customer";
    let recipientPhone = addressInput.phone?.replace(/\D/g, "").slice(-10) || auth.user.phone?.replace(/\D/g, "").slice(-10) || "";

    if (addressInput.addressId) {
      // Use existing address
      const addresses = await db.query<{
        id: string;
        recipient_name: string;
        phone: string;
      }>(
        `SELECT id, recipient_name, phone FROM addresses WHERE id = ? AND user_id = ? LIMIT 1`,
        [addressInput.addressId, auth.user.id]
      );
      const existingAddr = addresses[0];
      if (!existingAddr) {
        return { success: false, error: "Selected address not found." };
      }
      shippingAddressId = existingAddr.id;
      recipientName = existingAddr.recipient_name;
      recipientPhone = existingAddr.phone.replace(/\D/g, "").slice(-10);
    } else {
      // Validate new address fields
      const line1 = addressInput.line1?.trim();
      const city = addressInput.city?.trim();
      const state = addressInput.state?.trim();
      const postalCode = addressInput.postalCode?.trim();

      if (!line1) {
        return { success: false, error: "Street address is required." };
      }
      if (!city) {
        return { success: false, error: "City is required." };
      }
      if (!state) {
        return { success: false, error: "State is required." };
      }
      if (!postalCode || !/^\d{6}$/.test(postalCode)) {
        return { success: false, error: "Valid 6-digit postal PIN code is required." };
      }
      if (!recipientPhone || recipientPhone.length !== 10) {
        return { success: false, error: "Valid 10-digit mobile number is required for courier updates." };
      }

      const newAddressId = `addr_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
      await db.execute(
        `INSERT INTO addresses (
           id, user_id, recipient_name, phone, line1, line2, landmark,
           city, state, postal_code, country_code, type, is_default, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'IN', 'SHIPPING', 1, datetime('now'), datetime('now'))`,
        [
          newAddressId,
          auth.user.id,
          recipientName,
          recipientPhone,
          line1,
          addressInput.line2?.trim() || null,
          addressInput.landmark?.trim() || null,
          city,
          state,
          postalCode,
        ]
      );
      shippingAddressId = newAddressId;
    }

    // 4. Generate Internal Order Identifiers
    const orderId = `ord_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `VS-ORD-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}-${randomSuffix}`;

    // 5. Create D1 Orders Record
    await db.execute(
      `INSERT INTO orders (
         id, user_id, order_number, status, currency,
         subtotal_minor, discount_minor, shipping_minor, tax_minor, total_minor,
         shipping_address_id, vehicle_id, created_at, updated_at
       ) VALUES (
         ?, ?, ?, 'PENDING_PAYMENT', ?,
         ?, 0, 0, 0, ?,
         ?, ?, datetime('now'), datetime('now')
       )`,
      [
        orderId,
        auth.user.id,
        orderNumber,
        product.currency || "INR",
        product.price_minor,
        product.price_minor,
        shippingAddressId,
        verifiedVehicleId,
      ]
    );

    // 6. Create D1 Order Item Record
    const orderItemId = `item_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
    await db.execute(
      `INSERT INTO order_items (
         id, order_id, item_type, product_id, catalog_code, name,
         quantity, unit_price_minor, total_price_minor, created_at
       ) VALUES (
         ?, ?, 'PRODUCT', ?, ?, ?,
         1, ?, ?, datetime('now')
       )`,
      [
        orderItemId,
        orderId,
        product.id,
        product.code,
        product.name,
        product.price_minor,
        product.price_minor,
      ]
    );

    // 7. Request Authoritative Payment Order from Cashfree PG
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
    const gateway = getCashfreePaymentGateway();

    const paymentSession = await gateway.createPaymentOrder({
      orderId,
      amountPaise: product.price_minor,
      currency: "INR",
      customerId: auth.user.id,
      customerPhone: recipientPhone || "9999999999",
      customerName: recipientName,
      customerEmail: auth.user.email || undefined,
      returnUrl: `${appUrl}/orders/checkout-status?order_id=${orderId}`,
      notifyUrl: `${appUrl}/api/webhooks/cashfree`,
    });

    // 8. Record Initial Payment Attempt in D1 Payments
    const paymentId = `pay_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
    await db.execute(
      `INSERT INTO payments (
         id, order_id, provider, provider_order_id, status,
         amount_minor, currency, attempt_number, created_at, updated_at
       ) VALUES (
         ?, ?, 'CASHFREE', ?, 'PENDING',
         ?, ?, 1, datetime('now'), datetime('now')
       )`,
      [
        paymentId,
        orderId,
        paymentSession.gatewayOrderId,
        product.price_minor,
        product.currency || "INR",
      ]
    );

    const cashfreeMode = process.env.CASHFREE_ENV === "PROD" ? "production" : "sandbox";

    return {
      success: true,
      paymentSessionId: paymentSession.paymentSessionId,
      orderId,
      cashfreeMode,
    };
  } catch (err: any) {
    console.error("[createOrderAndCashfreeSession] Error:", err);
    return {
      success: false,
      error: "We couldn't initiate secure payment. Please try again in a few moments.",
    };
  }
}
