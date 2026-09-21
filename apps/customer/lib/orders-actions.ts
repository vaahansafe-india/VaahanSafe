"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedCustomer } from "@/lib/session";
import { getAuthoritativeDatabaseClient } from "@vaahansafe/database";

export interface OrderActionResult {
  success: boolean;
  message?: string;
  error?: string;
}

export async function cancelOrderAction(orderId: string): Promise<OrderActionResult> {
  const auth = await getAuthenticatedCustomer();
  if (!auth) {
    return { success: false, error: "Authentication required." };
  }

  const db = getAuthoritativeDatabaseClient();

  const orders = await db.query<{
    id: string;
    order_number: string;
    status: string;
    user_id: string;
  }>(
    `SELECT id, order_number, status, user_id FROM orders WHERE id = ? AND user_id = ?`,
    [orderId, auth.user.id]
  );

  if (!orders || orders.length === 0 || !orders[0]) {
    return { success: false, error: "Order not found." };
  }

  const order = orders[0];

  if (order.status === "CANCELLED") {
    return { success: false, error: "This order is already cancelled." };
  }

  // Check fulfilment status if exists
  const fulfilments = await db.query<{ id: string; status: string }>(
    `SELECT id, status FROM fulfilments WHERE order_id = ?`,
    [orderId]
  );

  const fulfilment = fulfilments?.[0];
  if (fulfilment) {
    const fStatus = fulfilment.status;
    if (["PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(fStatus)) {
      return {
        success: false,
        error: "This order has already been packed or dispatched and cannot be cancelled online. Please contact support.",
      };
    }
  }

  // Update order to CANCELLED
  await db.execute(
    `UPDATE orders SET status = 'CANCELLED', updated_at = datetime('now') WHERE id = ? AND user_id = ?`,
    [orderId, auth.user.id]
  );

  if (fulfilments && fulfilments.length > 0) {
    await db.execute(
      `UPDATE fulfilments SET status = 'CANCELLED', cancelled_at = datetime('now'), updated_at = datetime('now') WHERE order_id = ?`,
      [orderId]
    );
  }

  revalidatePath("/orders");
  return {
    success: true,
    message: `Order ${order.order_number} has been cancelled successfully.`,
  };
}
