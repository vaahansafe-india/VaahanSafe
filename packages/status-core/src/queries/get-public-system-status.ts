import { StatusRepository } from "../repositories/status.repository";
import { deriveOverallStatus, formatIstTimestamp } from "../services/aggregate-status";
import type { PublicSystemStatusDto, PublicStatusServiceDto } from "../dto/public-status";
import type { ServiceState } from "../domain/service-state";
import { CloudflareD1HttpClient, type DatabaseClient } from "@vaahansafe/database";

interface ProbeResult {
  latencyMs: number;
  ok: boolean;
  statusText: string;
  state?: ServiceState;
  checkedAt?: string;
}

async function getDatabaseHeartbeat(): Promise<NonNullable<PublicSystemStatusDto["databaseHeartbeat"]>> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return {
    status: "UNKNOWN", databaseStatus: "UNKNOWN", cronStatus: "UNKNOWN",
    checkedAt: null, latencyMs: null, scheduledLatencyMs: null, samples: [],
  };
  const started = Date.now();
  try {
    const response = await fetch(
      `${url.replace(/\/$/, "")}/rest/v1/status_heartbeats?select=checked_at,status,latency_ms&service_name=eq.supabase_database&order=checked_at.desc&limit=200`,
      { headers: { apikey: key, "Cache-Control": "no-cache" }, signal: AbortSignal.timeout(5000) }
    );
    if (!response.ok) throw new Error(`Supabase returned HTTP ${response.status}`);
    const rows = await response.json() as Array<{ checked_at: string; status: string; latency_ms: number | string }>;
    const latest = rows[0];
    const historyStart = Date.now() - 25 * 60 * 60 * 1000;
    const samples = rows.flatMap((row) => {
      const timestamp = Date.parse(row.checked_at);
      const latency = Number(row.latency_ms);
      if (!Number.isFinite(timestamp) || timestamp < historyStart || timestamp > Date.now() + 2 * 60 * 1000
        || !Number.isFinite(latency) || latency < 0) return [];
      const status: "OPERATIONAL" | "DEGRADED" | "DOWN" = row.status === "OPERATIONAL" || row.status === "DEGRADED" || row.status === "DOWN"
        ? row.status : "DOWN";
      return [{ checkedAt: row.checked_at, status, latencyMs: latency }];
    }).reverse();
    const checkedAt = latest?.checked_at ?? null;
    const ageMs = checkedAt ? Date.now() - Date.parse(checkedAt) : Number.NaN;
    const fresh = Number.isFinite(ageMs) && ageMs >= -2 * 60 * 1000 && ageMs <= 25 * 60 * 1000;
    const cronStatus = fresh && latest?.status === "OPERATIONAL" ? "OPERATIONAL" : "DEGRADED";
    const scheduledLatencyMs = latest && Number.isFinite(Number(latest.latency_ms))
      ? Number(latest.latency_ms) : null;
    return {
      status: cronStatus,
      databaseStatus: "OPERATIONAL",
      cronStatus,
      checkedAt,
      latencyMs: Date.now() - started,
      scheduledLatencyMs,
      samples,
    };
  } catch {
    return {
      status: "DEGRADED", databaseStatus: "DEGRADED", cronStatus: "UNKNOWN",
      checkedAt: null, latencyMs: Date.now() - started, scheduledLatencyMs: null, samples: [],
    };
  }
}

/**
 * Probes an HTTP endpoint measuring roundtrip latency in milliseconds.
 */
async function probeEndpoint(url: string, timeoutMs = 3000, scheduledCapability = false): Promise<ProbeResult> {
  const start = Date.now();
  try {
    let res = await fetch(url, {
      method: scheduledCapability ? "GET" : "HEAD",
      signal: AbortSignal.timeout(timeoutMs),
      redirect: "manual",
      headers: { "Cache-Control": "no-cache" },
    });
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, {
        method: "GET",
        signal: AbortSignal.timeout(timeoutMs),
        redirect: "manual",
        headers: { "Cache-Control": "no-cache" },
      });
    }
    const latency = Math.max(1, Date.now() - start);
    if (scheduledCapability) {
      const data = await res.json() as { status?: string; checkedAt?: string; latencyMs?: number };
      const age = data.checkedAt ? Date.now() - Date.parse(data.checkedAt) : Number.NaN;
      const fresh = Number.isFinite(age) && age >= -120_000 && age <= 25 * 60_000;
      const state: ServiceState = !fresh ? "UNKNOWN"
        : data.status === "OPERATIONAL" && res.ok ? "OPERATIONAL"
        : data.status === "DOWN" ? "PARTIAL OUTAGE"
        : data.status === "DEGRADED" ? "DEGRADED" : "UNKNOWN";
      return {
        latencyMs: fresh && typeof data.latencyMs === "number" && Number.isFinite(data.latencyMs) && data.latencyMs >= 0 ? data.latencyMs : latency,
        ok: state === "OPERATIONAL", state,
        checkedAt: fresh ? data.checkedAt : undefined,
        statusText: `Scheduled check: ${state}`,
      };
    }
    return {
      latencyMs: latency,
      ok: res.ok,
      statusText: `HTTP ${res.status}`,
    };
  } catch {
    const latency = Math.max(1, Date.now() - start);
    return {
      latencyMs: latency,
      ok: false,
      statusText: "Connection Timeout / Unreachable",
    };
  }
}

export function getStatusDatabaseClient(): DatabaseClient | undefined {
  if (!process.env.CLOUDFLARE_ACCOUNT_ID || !process.env.CLOUDFLARE_D1_DATABASE_ID
    || !process.env.CLOUDFLARE_API_TOKEN) return undefined;
  return new CloudflareD1HttpClient({
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    databaseId: process.env.CLOUDFLARE_D1_DATABASE_ID,
    token: process.env.CLOUDFLARE_API_TOKEN,
  });
}

export async function getPublicSystemStatus(db?: DatabaseClient): Promise<PublicSystemStatusDto> {
  // 1. Authoritative D1 Database Client Resolution
  const client = db ?? getStatusDatabaseClient();

  const repo = new StatusRepository(client);

  // 2. Query Authoritative Relational Records from Cloudflare D1
  const [baseServices, activeIncidents, activeMaintenance, databaseHeartbeat, resolvedIncidentCount30D] = await Promise.all([
    repo.getPublicServices(),
    repo.getActiveIncidents(),
    repo.getUpcomingMaintenance(),
    getDatabaseHeartbeat(),
    repo.getResolvedIncidentCount30D(),
  ]);
  const serviceHistoriesPromise = repo.getServiceHistories(baseServices.map((service) => service.slug));

  // 3. Concurrently Run Live Edge Probes for Real Telemetry
  const webUrl = process.env.STATUS_WEB_HEALTH_URL;
  const appUrl = process.env.STATUS_APP_HEALTH_URL;
  const activateUrl = process.env.STATUS_ACTIVATE_HEALTH_URL;
  const qrUrl = process.env.STATUS_QR_HEALTH_URL;

  const probePromises = baseServices.map(async (service): Promise<{ slug: string; probe: ProbeResult | null }> => {
    let probe: ProbeResult | null = null;
    switch (service.slug) {
      case "website":
        if (webUrl) probe = await probeEndpoint(webUrl);
        break;
      case "customer-app":
        if (appUrl) probe = await probeEndpoint(appUrl);
        break;
      case "payments":
        if (process.env.STATUS_PAYMENTS_HEALTH_URL) probe = await probeEndpoint(process.env.STATUS_PAYMENTS_HEALTH_URL, 5000, true);
        break;
      case "customer-analytics":
        if (process.env.STATUS_ANALYTICS_HEALTH_URL) probe = await probeEndpoint(process.env.STATUS_ANALYTICS_HEALTH_URL, 5000, true);
        break;
      case "retail-activation":
        if (activateUrl) probe = await probeEndpoint(activateUrl);
        break;
      case "vehicle-qr-access":
        if (qrUrl) probe = await probeEndpoint(qrUrl);
        break;
      case "notifications":
        if (process.env.STATUS_NOTIFICATIONS_HEALTH_URL) probe = await probeEndpoint(process.env.STATUS_NOTIFICATIONS_HEALTH_URL, 5000, true);
        break;
      default:
        break;
    }
    return { slug: service.slug, probe };
  });

  const [probeResults, serviceHistories] = await Promise.all([
    Promise.all(probePromises),
    serviceHistoriesPromise,
  ]);
  const probeMap = new Map<string, ProbeResult | null>(
    probeResults.map((p) => [p.slug, p.probe])
  );

  const now = new Date();

  // 4. Enrich Services with Real Live Telemetry
  const enrichedServices: PublicStatusServiceDto[] = baseServices.map((service) => {
    const probe = probeMap.get(service.slug);
    let state: ServiceState = probe?.state ?? (!probe ? "UNKNOWN"
      : !probe.ok ? "DEGRADED"
      : service.state === "UNKNOWN" ? "OPERATIONAL" : service.state);

    if (activeMaintenance.some((window) => window.state === "IN_PROGRESS"
      && window.affectedServiceSlugs.includes(service.slug))
      && (state === "UNKNOWN" || state === "OPERATIONAL")) state = "MAINTENANCE";

    for (const incident of activeIncidents) {
      if (!incident.affectedServiceSlugs.includes(service.slug)) continue;
      const incidentState: ServiceState = incident.impact === "CRITICAL" ? "MAJOR OUTAGE"
        : incident.impact === "MAJOR" ? "PARTIAL OUTAGE"
        : incident.impact === "MINOR" ? "DEGRADED" : "UNKNOWN";
      if (incidentState === "MAJOR OUTAGE"
        || (incidentState === "PARTIAL OUTAGE" && state !== "MAJOR OUTAGE")
        || (incidentState === "DEGRADED" && (state === "OPERATIONAL" || state === "UNKNOWN" || state === "MAINTENANCE"))) {
        state = incidentState;
      }
    }

    return {
      ...service,
      state,
      latencyMs: probe?.latencyMs,
      lastProbeAt: probe?.state ? probe.checkedAt : probe ? now.toISOString() : undefined,
      probeStatus: probe?.statusText,
    };
  });

  // Customer-facing overall status reflects customer capabilities. Infrastructure
  // telemetry is reported separately and must not imply user impact by itself.
  const overall = deriveOverallStatus(enrichedServices, false);

  return {
    overallState: overall.overallState,
    headline: overall.headline,
    description: overall.description,
    generatedAt: now.toISOString(),
    generatedAtFormatted: formatIstTimestamp(now),
    isStale: false,
    databaseHeartbeat,
    services: enrichedServices,
    serviceHistories,
    activeIncidents,
    activeMaintenance,
    historySummary: {
      recordedDays: Math.max(0, ...serviceHistories.map((history) => history.recordedDaysCount)),
      resolvedIncidentCount30D,
    },
  };
}
