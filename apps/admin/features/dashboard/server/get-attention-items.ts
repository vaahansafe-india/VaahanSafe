import "server-only";
import { getSupabaseAdminClient } from "@vaahansafe/database";
import type { AdminIdentity } from "../../../lib/contracts";
import { canReadModule } from "../../../lib/modules";
import type { DashboardAttentionItem, DashboardServiceItem } from "../types";

export async function getAttentionItems(
  identity: AdminIdentity,
  serviceChecks: DashboardServiceItem[],
): Promise<DashboardAttentionItem[]> {
  const db = getSupabaseAdminClient();
  const items: DashboardAttentionItem[] = [];

  // 1. Check if Cloudflare R2 is unavailable
  const r2Service = serviceChecks.find((s) => s.name === "Cloudflare R2");
  if (r2Service && r2Service.status === "unavailable") {
    items.push({
      id: "r2_unavailable",
      title: "Cloudflare R2 unavailable",
      description: "Media storage operations and asset previews may be temporarily affected.",
      severity: "high",
      actionLabel: "Inspect →",
      actionHref: "/gallery",
    });
  }

  // 2. Query failed payment orders
  if (canReadModule(identity.role, "orders")) {
    try {
      const { count, error } = await db
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("payment_state", "FAILED");

      if (!error && count && count > 0) {
        items.push({
          id: "payment_failures",
          title: "Payment failures",
          description: `${count} order${count > 1 ? "s" : ""} recorded payment failures requiring review.`,
          severity: "critical",
          count,
          actionLabel: "Review →",
          actionHref: "/orders?status=FAILED",
        });
      }
    } catch {
      // Graceful error isolation
    }
  }

  // 3. Query pending fulfilment (paid orders awaiting fulfilment/allocation)
  if (canReadModule(identity.role, "shipping") || canReadModule(identity.role, "orders")) {
    try {
      const { count, error } = await db
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("payment_state", "PAID")
        .in("status", ["PAID", "CONFIRMED"]);

      if (!error && count && count > 0) {
        items.push({
          id: "pending_fulfilment",
          title: "Pending fulfilment",
          description: `${count} paid order${count > 1 ? "s" : ""} awaiting sticker allocation or dispatch.`,
          severity: "high",
          count,
          actionLabel: "Review →",
          actionHref: "/orders",
        });
      }
    } catch {
      // Graceful error isolation
    }
  }

  // 4. Query urgent support tickets
  if (canReadModule(identity.role, "support")) {
    try {
      const { count, error } = await db
        .from("admin_support_tickets")
        .select("id", { count: "exact", head: true })
        .in("priority", ["HIGH", "URGENT"])
        .in("status", ["OPEN", "IN_PROGRESS"]);

      if (!error && count && count > 0) {
        items.push({
          id: "urgent_support",
          title: "Urgent support cases",
          description: `${count} priority customer inquiry ticket${count > 1 ? "s" : ""} awaiting response.`,
          severity: "high",
          count,
          actionLabel: "Open →",
          actionHref: "/support",
        });
      }
    } catch {
      // Graceful error isolation
    }
  }

  // 5. Query active incidents
  if (canReadModule(identity.role, "incidents")) {
    try {
      const { count, error } = await db
        .from("admin_incidents")
        .select("id", { count: "exact", head: true })
        .neq("status", "RESOLVED");

      if (!error && count && count > 0) {
        items.push({
          id: "active_incidents",
          title: "Active system incidents",
          description: `${count} active incident report${count > 1 ? "s" : ""} currently under investigation.`,
          severity: "critical",
          count,
          actionLabel: "Inspect →",
          actionHref: "/incidents",
        });
      }
    } catch {
      // Graceful error isolation
    }
  }

  // 6. Query pending replacements
  if (canReadModule(identity.role, "replacements")) {
    try {
      const { count, error } = await db
        .from("replacement_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "PENDING");

      if (!error && count && count > 0) {
        items.push({
          id: "pending_replacements",
          title: "Pending replacements",
          description: `${count} QR replacement request${count > 1 ? "s" : ""} awaiting staff review.`,
          severity: "medium",
          count,
          actionLabel: "Review →",
          actionHref: "/replacements",
        });
      }
    } catch {
      // Graceful error isolation
    }
  }

  // Sort: critical -> high -> medium -> info
  const severityRank: Record<string, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    info: 3,
  };
  return items.sort(
    (a, b) =>
      (severityRank[a.severity] ?? 99) - (severityRank[b.severity] ?? 99),
  );
}
