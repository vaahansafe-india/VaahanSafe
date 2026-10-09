import "server-only";
import type { AdminIdentity } from "../../../lib/contracts";
import { getGreetingForIstHour } from "../presentation";
import type { AdminDashboardSummary } from "../types";
import { getActivityPulse } from "./get-activity-pulse";
import { getAttentionItems } from "./get-attention-items";
import { getDashboardMetrics } from "./get-dashboard-metrics";
import { getOperationalQueue } from "./get-operational-queue";
import { getRecentAdminActivity } from "./get-recent-activity";
import { getDashboardServiceHealth } from "./get-service-health";

export async function getDashboardSummary(
  identity: AdminIdentity,
): Promise<AdminDashboardSummary> {
  const now = new Date();

  // Run independent dashboard queries concurrently in parallel
  const [
    serviceResult,
    metricsResult,
    queueResult,
    pulseResult,
    auditResult,
  ] = await Promise.allSettled([
    getDashboardServiceHealth(),
    getDashboardMetrics(identity),
    getOperationalQueue(identity),
    getActivityPulse(identity),
    getRecentAdminActivity(identity),
  ]);

  const { services, systemStatus } =
    serviceResult.status === "fulfilled"
      ? serviceResult.value
      : {
          services: [],
          systemStatus: "degraded" as const,
        };

  const metrics =
    metricsResult.status === "fulfilled" ? metricsResult.value : [];

  const queueItems =
    queueResult.status === "fulfilled" ? queueResult.value : [];

  const pulse =
    pulseResult.status === "fulfilled"
      ? pulseResult.value
      : {
          buckets: [],
          totalScans24h: 0,
          totalActivations24h: 0,
          totalOrders24h: 0,
          totalFailures24h: 0,
          hasData: false,
        };

  const recentAudit =
    auditResult.status === "fulfilled" ? auditResult.value : [];

  // Derive attention items
  const attentionItems = await getAttentionItems(identity, services);

  // If there are critical attention items, system status should reflect attention
  const finalSystemStatus =
    attentionItems.some((a) => a.severity === "critical")
      ? "attention"
      : systemStatus;

  // Format IST sync time & date
  const formattedSyncTime =
    new Intl.DateTimeFormat("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Kolkata",
    }).format(now) + " IST";

  const formattedSyncDate = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(now);

  const operatorFirstName =
    identity.name.trim().split(/\s+/)[0] || "Operator";
  const greeting = getGreetingForIstHour(now);

  return {
    generatedAt: now.toISOString(),
    formattedSyncTime,
    formattedSyncDate,
    greeting,
    operatorFirstName,
    operatorRole: identity.role.replaceAll("_", " ").toLowerCase(),
    systemStatus: finalSystemStatus,
    metrics,
    attentionItems,
    queueItems,
    pulse,
    services,
    recentAudit,
  };
}
