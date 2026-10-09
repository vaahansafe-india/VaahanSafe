import "server-only";
import { getSupabaseAdminClient } from "@vaahansafe/database";
import type { AdminIdentity } from "../../../lib/contracts";
import { canReadModule } from "../../../lib/modules";
import {
  formatCurrencyMinor,
  formatHumanReference,
  formatIstTimestamp,
  formatRelativeAge,
} from "../presentation";
import type { DashboardQueueItem } from "../types";

export async function getOperationalQueue(
  identity: AdminIdentity,
): Promise<DashboardQueueItem[]> {
  const db = getSupabaseAdminClient();
  const queueItems: DashboardQueueItem[] = [];

  // Query orders if permitted
  if (canReadModule(identity.role, "orders")) {
    try {
      const { data, error } = await db
        .from("orders")
        .select(
          "id,order_number,status,payment_state,total_minor,currency,shipping_name,created_at",
        )
        .order("created_at", { ascending: false })
        .limit(6);

      if (!error && data) {
        for (const row of data) {
          const rawRef = row.order_number || row.id;
          const { display: refDisplay } = formatHumanReference(rawRef);
          const paymentState = String(row.payment_state || "").toUpperCase();
          const orderStatus = String(row.status || "").toUpperCase();

          let type: DashboardQueueItem["type"] = "Order";
          let stateLabel = orderStatus;

          if (paymentState === "FAILED") {
            type = "Payment";
            stateLabel = "Payment failed";
          } else if (paymentState === "PENDING") {
            type = "Order";
            stateLabel = "Awaiting payment";
          } else if (orderStatus === "PAID" || paymentState === "PAID") {
            stateLabel = "Paid";
          }

          let customerContext = "Online purchase";
          if (row.shipping_name) {
            const nameParts = String(row.shipping_name).trim().split(/\s+/);
            customerContext =
              nameParts.length > 1 && nameParts[1]
                ? `${nameParts[0]} ${nameParts[1].slice(0, 1)}.`
                : nameParts[0] || "Customer";
          }

          queueItems.push({
            id: row.id,
            type,
            reference: refDisplay,
            rawReference: rawRef,
            state: stateLabel,
            context: customerContext,
            amountFormatted: formatCurrencyMinor(
              row.total_minor,
              row.currency || "INR",
            ),
            age: formatRelativeAge(row.created_at),
            timestamp: formatIstTimestamp(row.created_at),
            actionLabel: "Review →",
            actionHref: `/orders`,
          });
        }
      }
    } catch {
      // Graceful degradation
    }
  }

  // If no orders permission, check support or inventory
  if (queueItems.length === 0 && canReadModule(identity.role, "support")) {
    try {
      const { data, error } = await db
        .from("admin_support_tickets")
        .select("id,reference_code,subject,priority,status,created_at")
        .order("created_at", { ascending: false })
        .limit(6);

      if (!error && data) {
        for (const row of data) {
          const rawRef = row.reference_code || row.id;
          const { display: refDisplay } = formatHumanReference(rawRef);
          queueItems.push({
            id: row.id,
            type: "Support",
            reference: refDisplay,
            rawReference: rawRef,
            state: String(row.status || "OPEN").replaceAll("_", " "),
            context: String(row.subject || "Support ticket").slice(0, 32),
            amountFormatted: null,
            age: formatRelativeAge(row.created_at),
            timestamp: formatIstTimestamp(row.created_at),
            actionLabel: "Open →",
            actionHref: `/support`,
          });
        }
      }
    } catch {
      // Graceful degradation
    }
  }

  return queueItems;
}
