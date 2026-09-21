"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedCustomer } from "./session";
import { getAuthoritativeDatabaseClient } from "@vaahansafe/database";

export interface ActionResult {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Toggles auto-renewal preference (cancel_at_period_end) on an active subscription.
 */
export async function toggleAutoRenewalAction(subscriptionId: string, cancelAtEnd: boolean): Promise<ActionResult> {
  const auth = await getAuthenticatedCustomer();
  if (!auth) {
    return { success: false, message: "Authentication required", error: "UNAUTHORIZED" };
  }

  const db = getAuthoritativeDatabaseClient();

  try {
    // 1. Verify subscription belongs to this user
    const sub = await db.queryFirst<{ id: string; user_id: string; status: string }>(
      `SELECT id, user_id, status FROM subscriptions WHERE id = ? AND user_id = ?`,
      [subscriptionId, auth.user.id]
    );

    if (!sub) {
      return { success: false, message: "Subscription not found or not owned by user", error: "NOT_FOUND" };
    }

    if (sub.status !== "ACTIVE" && sub.status !== "CANCEL_AT_PERIOD_END") {
      return { success: false, message: "Only active subscriptions can update renewal preference", error: "INVALID_STATE" };
    }

    const now = new Date().toISOString();
    const newStatus = cancelAtEnd ? "CANCEL_AT_PERIOD_END" : "ACTIVE";

    // 2. Update subscription record
    await db.execute(
      `UPDATE subscriptions 
       SET cancel_at_period_end = ?, status = ?, updated_at = ?
       WHERE id = ?`,
      [cancelAtEnd ? 1 : 0, newStatus, now, subscriptionId]
    );

    // 3. Append to subscription_events for audit trail
    const eventId = `sev_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    await db.execute(
      `INSERT INTO subscription_events (id, subscription_id, event_type, payload_json, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [
        eventId,
        subscriptionId,
        cancelAtEnd ? "CANCELLATION_REQUESTED" : "RECOVERED",
        JSON.stringify({ updatedBy: auth.user.id, cancelAtPeriodEnd: cancelAtEnd }),
        now,
      ]
    );

    revalidatePath("/subscription");
    return {
      success: true,
      message: cancelAtEnd
        ? "Auto-renewal cancelled. Your service will remain active until the end of the term."
        : "Auto-renewal re-enabled. Your service will renew seamlessly.",
    };
  } catch (err: unknown) {
    console.error("[SubscriptionActions] Error updating auto-renewal:", err);
    return {
      success: false,
      message: "We couldn't update your renewal preference right now. Please try again.",
      error: "INTERNAL_ERROR",
    };
  }
}
