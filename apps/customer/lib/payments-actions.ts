"use server";

import { revalidatePath } from "next/cache";
import { getAuthoritativeDatabaseClient } from "@vaahansafe/database";
import { getAuthenticatedCustomer } from "./session";

interface ActionResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

/**
 * Re-validates a pending payment status against authoritative records
 */
export async function refreshPaymentStatusAction(paymentId: string): Promise<ActionResponse> {
  try {
    const auth = await getAuthenticatedCustomer();
    if (!auth?.user?.id) {
      return { success: false, message: "Authentication required." };
    }

    const db = getAuthoritativeDatabaseClient();

    // Verify payment ownership via joined order
    const payment = await db.queryFirst<{ id: string; status: string; order_number: string }>(
      `SELECT p.id, p.status, o.order_number
       FROM payments p
       JOIN orders o ON p.order_id = o.id
       WHERE p.id = ? AND o.user_id = ?`,
      [paymentId, auth.user.id]
    );

    if (!payment) {
      return { success: false, message: "Payment record not found or access denied." };
    }

    revalidatePath("/payments");
    revalidatePath("/orders");

    return {
      success: true,
      message: `Payment status refreshed: ${payment.status}`,
      data: { status: payment.status },
    };
  } catch (err) {
    console.error("[PaymentsAction] refreshPaymentStatusAction error:", err);
    return { success: false, message: "Unable to refresh payment status right now." };
  }
}

/**
 * Safely prepares a retry payment session for an incomplete order
 */
export async function retryPaymentAction(orderId: string): Promise<ActionResponse<{ checkoutUrl?: string }>> {
  try {
    const auth = await getAuthenticatedCustomer();
    if (!auth?.user?.id) {
      return { success: false, message: "Authentication required." };
    }

    const db = getAuthoritativeDatabaseClient();

    // Authorize order ownership and verify state is eligible for retry
    const order = await db.queryFirst<{ id: string; status: string; total_minor: number; order_number: string }>(
      `SELECT id, status, total_minor, order_number
       FROM orders
       WHERE id = ? AND user_id = ?`,
      [orderId, auth.user.id]
    );

    if (!order) {
      return { success: false, message: "Order not found or access denied." };
    }

    if (order.status === "PAID" || order.status === "FULFILLED") {
      return { success: false, message: "Order is already paid and confirmed." };
    }

    if (order.status === "CANCELLED") {
      return { success: false, message: "Cancelled orders cannot be retried." };
    }

    // Route to checkout flow for safe server-side payment order generation
    return {
      success: true,
      message: "Order ready for payment completion.",
      data: {
        checkoutUrl: `/qr/buy?orderId=${encodeURIComponent(order.id)}`,
      },
    };
  } catch (err) {
    console.error("[PaymentsAction] retryPaymentAction error:", err);
    return { success: false, message: "Unable to initialize payment retry right now." };
  }
}
