import "server-only";
import { getSupabaseAdminClient } from "@vaahansafe/database";
import type { AdminIdentity } from "../../../lib/contracts";
import { canReadModule } from "../../../lib/modules";
import type { DashboardPulse, DashboardPulseBucket } from "../types";

export async function getActivityPulse(
  identity: AdminIdentity,
): Promise<DashboardPulse> {
  const db = getSupabaseAdminClient();
  const now = Date.now();
  const twentyFourHoursAgo = new Date(now - 86400000).toISOString();

  // Create 4 intervals of 6 hours
  // Window 0: -24h to -18h
  // Window 1: -18h to -12h
  // Window 2: -12h to -6h
  // Window 3: -6h to now
  const buckets: DashboardPulseBucket[] = [
    { hourLabel: "24h ago", scans: 0, activations: 0, orders: 0, failures: 0 },
    { hourLabel: "18h ago", scans: 0, activations: 0, orders: 0, failures: 0 },
    { hourLabel: "12h ago", scans: 0, activations: 0, orders: 0, failures: 0 },
    { hourLabel: "6h ago", scans: 0, activations: 0, orders: 0, failures: 0 },
    { hourLabel: "Now", scans: 0, activations: 0, orders: 0, failures: 0 },
  ];

  let totalScans = 0;
  let totalActivations = 0;
  let totalOrders = 0;
  let totalFailures = 0;

  const [scansResult, ordersResult, activationsResult] = await Promise.allSettled([
    canReadModule(identity.role, "analytics")
      ? db
          .from("qr_scan_events")
          .select("id,created_at")
          .gte("created_at", twentyFourHoursAgo)
          .order("created_at", { ascending: false })
          .limit(200)
      : Promise.resolve({ data: [] }),
    canReadModule(identity.role, "orders")
      ? db
          .from("orders")
          .select("id,payment_state,created_at")
          .gte("created_at", twentyFourHoursAgo)
          .order("created_at", { ascending: false })
          .limit(100)
      : Promise.resolve({ data: [] }),
    canReadModule(identity.role, "activations")
      ? db
          .from("qr_activation_attempts")
          .select("id,outcome,created_at")
          .gte("created_at", twentyFourHoursAgo)
          .order("created_at", { ascending: false })
          .limit(100)
      : Promise.resolve({ data: [] }),
  ]);

  function getBucketIndex(createdAt: string): number {
    const time = new Date(createdAt).getTime();
    const elapsed = now - time;
    if (elapsed > 18 * 3600000) return 0;
    if (elapsed > 12 * 3600000) return 1;
    if (elapsed > 6 * 3600000) return 2;
    return 3;
  }

  if (scansResult.status === "fulfilled" && scansResult.value.data) {
    for (const scan of scansResult.value.data) {
      totalScans++;
      const idx = getBucketIndex(scan.created_at);
      if (buckets[idx]) buckets[idx].scans++;
    }
  }

  if (ordersResult.status === "fulfilled" && ordersResult.value.data) {
    for (const order of ordersResult.value.data) {
      totalOrders++;
      const idx = getBucketIndex(order.created_at);
      if (buckets[idx]) buckets[idx].orders++;
      if (order.payment_state === "FAILED") {
        totalFailures++;
        if (buckets[idx]) buckets[idx].failures++;
      }
    }
  }

  if (activationsResult.status === "fulfilled" && activationsResult.value.data) {
    for (const act of activationsResult.value.data) {
      if (act.outcome === "SUCCESS") {
        totalActivations++;
        const idx = getBucketIndex(act.created_at);
        if (buckets[idx]) buckets[idx].activations++;
      } else {
        totalFailures++;
        const idx = getBucketIndex(act.created_at);
        if (buckets[idx]) buckets[idx].failures++;
      }
    }
  }

  const hasData =
    totalScans > 0 || totalActivations > 0 || totalOrders > 0 || totalFailures > 0;

  return {
    buckets,
    totalScans24h: totalScans,
    totalActivations24h: totalActivations,
    totalOrders24h: totalOrders,
    totalFailures24h: totalFailures,
    hasData,
  };
}
