import "server-only";
import { getSupabaseAdminClient } from "@vaahansafe/database";
import type { AdminIdentity } from "../../../lib/contracts";
import { canReadModule } from "../../../lib/modules";
import type { DashboardMetric } from "../types";

export async function getDashboardMetrics(
  identity: AdminIdentity,
): Promise<DashboardMetric[]> {
  const db = getSupabaseAdminClient();
  const twentyFourHoursAgo = new Date(Date.now() - 86400000).toISOString();

  const [
    qrTotalResult,
    qrActiveResult,
    scansResult,
    ordersPaidResult,
    attentionOrdersResult,
  ] = await Promise.allSettled([
    canReadModule(identity.role, "inventory")
      ? db.from("qr_stickers").select("id", { count: "exact", head: true })
      : Promise.resolve({ count: null, error: null }),
    canReadModule(identity.role, "inventory")
      ? db
          .from("qr_stickers")
          .select("id", { count: "exact", head: true })
          .eq("status", "ACTIVE")
      : Promise.resolve({ count: null, error: null }),
    canReadModule(identity.role, "analytics")
      ? db
          .from("qr_scan_events")
          .select("id", { count: "exact", head: true })
          .gte("created_at", twentyFourHoursAgo)
      : Promise.resolve({ count: null, error: null }),
    canReadModule(identity.role, "orders")
      ? db
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("payment_state", "PAID")
      : Promise.resolve({ count: null, error: null }),
    canReadModule(identity.role, "orders")
      ? db
          .from("orders")
          .select("id", { count: "exact", head: true })
          .in("payment_state", ["FAILED", "PENDING"])
      : Promise.resolve({ count: null, error: null }),
  ]);

  const qrTotal =
    qrTotalResult.status === "fulfilled" && !qrTotalResult.value.error
      ? qrTotalResult.value.count
      : null;

  const qrActive =
    qrActiveResult.status === "fulfilled" && !qrActiveResult.value.error
      ? qrActiveResult.value.count
      : null;

  const scans24h =
    scansResult.status === "fulfilled" && !scansResult.value.error
      ? scansResult.value.count
      : null;

  const ordersPaid =
    ordersPaidResult.status === "fulfilled" && !ordersPaidResult.value.error
      ? ordersPaidResult.value.count
      : null;

  const attentionOrders =
    attentionOrdersResult.status === "fulfilled" &&
    !attentionOrdersResult.value.error
      ? attentionOrdersResult.value.count
      : null;

  const activePercent =
    qrTotal && qrTotal > 0 && qrActive != null
      ? `${Math.round((qrActive / qrTotal) * 100)}%`
      : null;

  const metrics: DashboardMetric[] = [
    {
      id: "qr_total",
      label: "QR identities",
      value: qrTotal,
      detail: qrTotal === null ? "Unavailable" : "Physical inventory",
      subtext: qrTotal !== null ? "Total catalog" : undefined,
      href: "/inventory",
    },
    {
      id: "qr_active",
      label: "Active QR",
      value: qrActive,
      detail: qrActive === null ? "Unavailable" : activePercent ? `${activePercent} activated` : "Bound to vehicles",
      subtext: activePercent ? `Activation rate ${activePercent}` : undefined,
      href: "/inventory",
    },
    {
      id: "scans_24h",
      label: "Scans 24h",
      value: scans24h,
      detail: scans24h === null ? "Unavailable" : "Last 24 hours",
      subtext: scans24h !== null ? "Resolver queries" : undefined,
      href: "/analytics",
    },
    {
      id: "orders_paid",
      label: "Confirmed orders",
      value: ordersPaid,
      detail: ordersPaid === null ? "Unavailable" : "Verified paid",
      subtext: ordersPaid !== null ? "Completed checkout" : undefined,
      href: "/orders",
    },
    {
      id: "orders_attention",
      label: "Action queue",
      value: attentionOrders,
      detail:
        attentionOrders === null
          ? "Unavailable"
          : attentionOrders === 0
            ? "Queue clear"
            : `${attentionOrders} awaiting review`,
      subtext: attentionOrders && attentionOrders > 0 ? "Pending or failed" : undefined,
      href: "/orders",
      status: attentionOrders && attentionOrders > 0 ? "warning" : "normal",
    },
  ];

  return metrics;
}
