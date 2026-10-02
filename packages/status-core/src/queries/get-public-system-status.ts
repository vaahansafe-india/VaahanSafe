import { StatusRepository } from "../repositories/status.repository";
import { deriveOverallStatus, formatIstTimestamp } from "../services/aggregate-status";
import type { PublicSystemStatusDto, PublicStatusServiceDto } from "../dto/public-status";
import type { ServiceState } from "../domain/service-state";
import type { DatabaseClient } from "@vaahansafe/database";

interface ProbeResult {
  latencyMs: number;
  ok: boolean;
  statusText: string;
  targetUrl: string;
}

async function getDatabaseHeartbeat(): Promise<NonNullable<PublicSystemStatusDto["databaseHeartbeat"]>> {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return { status: "UNKNOWN", checkedAt: null, latencyMs: null };
  const started = Date.now();
  try {
    const response = await fetch(
      `${url.replace(/\/$/, "")}/rest/v1/status_heartbeats?select=checked_at&service_name=eq.supabase_database&order=checked_at.desc&limit=1`,
      { headers: { apikey: key, "Cache-Control": "no-cache" }, signal: AbortSignal.timeout(5000) }
    );
    if (!response.ok) throw new Error(`Supabase returned HTTP ${response.status}`);
    const rows = await response.json() as Array<{ checked_at: string }>;
    const checkedAt = rows[0]?.checked_at ?? null;
    const fresh = checkedAt !== null && Number.isFinite(Date.parse(checkedAt))
      && Date.now() - Date.parse(checkedAt) <= 25 * 60 * 1000;
    return { status: fresh ? "OPERATIONAL" : "DEGRADED", checkedAt, latencyMs: Date.now() - started };
  } catch {
    return { status: "DEGRADED", checkedAt: null, latencyMs: Date.now() - started };
  }
}

/**
 * Probes an HTTP endpoint measuring roundtrip latency in milliseconds.
 */
async function probeEndpoint(url: string, timeoutMs = 3000): Promise<ProbeResult> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      headers: { "Cache-Control": "no-cache" },
    }).catch(async () => {
      // Fallback to GET if HEAD method is blocked by edge WAF
      return fetch(url, {
        method: "GET",
        signal: controller.signal,
        headers: { "Cache-Control": "no-cache" },
      });
    });
    clearTimeout(timer);
    const latency = Math.max(1, Date.now() - start);
    return {
      latencyMs: latency,
      ok: res.ok || res.status === 401,
      statusText: `HTTP ${res.status}`,
      targetUrl: url,
    };
  } catch {
    const latency = Math.max(1, Date.now() - start);
    return {
      latencyMs: latency,
      ok: false,
      statusText: "Connection Timeout / Unreachable",
      targetUrl: url,
    };
  }
}

export async function getPublicSystemStatus(db?: DatabaseClient): Promise<PublicSystemStatusDto> {
  // 1. Authoritative D1 Database Client Resolution
  let client = db;
  if (!client) {
    try {
      const dbModule = await import("@vaahansafe/database");
      if (typeof dbModule.getAuthoritativeDatabaseClient === "function") {
        client = dbModule.getAuthoritativeDatabaseClient();
      }
    } catch {
      // Isolates if running in an environment without database access
    }
  }

  const repo = new StatusRepository(client);

  // 2. Query Authoritative Relational Records from Cloudflare D1
  const [baseServices, activeIncidents, activeMaintenance, databaseHeartbeat] = await Promise.all([
    repo.getPublicServices(),
    repo.getActiveIncidents(),
    repo.getUpcomingMaintenance(),
    getDatabaseHeartbeat(),
  ]);

  // 3. Concurrently Run Live Edge Probes for Real Telemetry
  const webUrl =
    process.env.PROD_WEB_URL ||
    (process.env.NEXT_PUBLIC_WEB_URL && !process.env.NEXT_PUBLIC_WEB_URL.includes("localhost")
      ? process.env.NEXT_PUBLIC_WEB_URL
      : "https://www.vaahansafe.com");
  const appUrl =
    process.env.PROD_APP_URL ||
    (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes("localhost")
      ? process.env.NEXT_PUBLIC_APP_URL
      : "https://app.vaahansafe.com");
  const activateUrl =
    process.env.PROD_ACTIVATE_URL ||
    (process.env.NEXT_PUBLIC_ACTIVATE_URL && !process.env.NEXT_PUBLIC_ACTIVATE_URL.includes("localhost")
      ? process.env.NEXT_PUBLIC_ACTIVATE_URL
      : "");
  const qrUrl =
    process.env.PROD_QR_URL ||
    (process.env.NEXT_PUBLIC_QR_URL && !process.env.NEXT_PUBLIC_QR_URL.includes("localhost")
      ? process.env.NEXT_PUBLIC_QR_URL
      : "");

  const probePromises = baseServices.map(async (service): Promise<{ slug: string; probe: ProbeResult | null }> => {
    let probe: ProbeResult | null = null;
    switch (service.slug) {
      case "website":
        probe = await probeEndpoint(webUrl);
        break;
      case "customer-app":
        probe = await probeEndpoint(`${appUrl}/api/auth/session`);
        break;
      case "payments":
        if (process.env.PROD_PAYMENTS_HEALTH_URL) probe = await probeEndpoint(process.env.PROD_PAYMENTS_HEALTH_URL);
        break;
      case "retail-activation":
        if (activateUrl) probe = await probeEndpoint(activateUrl);
        break;
      case "vehicle-qr-access":
        if (qrUrl) probe = await probeEndpoint(qrUrl);
        break;
      case "notifications":
      default:
        if (process.env.PROD_NOTIFICATIONS_HEALTH_URL) probe = await probeEndpoint(process.env.PROD_NOTIFICATIONS_HEALTH_URL);
        break;
    }
    return { slug: service.slug, probe };
  });

  const probeResults = await Promise.all(probePromises);
  const probeMap = new Map<string, ProbeResult | null>(
    probeResults.map((p) => [p.slug, p.probe])
  );

  const now = new Date();

  // 4. Enrich Services with Real Live Telemetry
  const enrichedServices: PublicStatusServiceDto[] = baseServices.map((service) => {
    const probe = probeMap.get(service.slug);
    let state = service.state;

    // If active incident explicitly affects this service, keep incident state
    const incidentAffects = activeIncidents.some((inc) =>
      inc.affectedServiceSlugs.includes(service.slug)
    );

    if (!incidentAffects) {
      if (!probe) state = "UNKNOWN";
      else if (!probe.ok) state = "DEGRADED";
      else if (state === "UNKNOWN") state = "OPERATIONAL";
    }

    return {
      ...service,
      state,
      latencyMs: probe?.latencyMs,
      lastProbeAt: probe ? now.toISOString() : undefined,
      targetUrl: probe?.targetUrl,
      probeStatus: probe?.statusText,
    };
  });

  const databaseService: PublicStatusServiceDto = {
    publicId: "vs_srv_supabase_database",
    slug: "supabase-database",
    name: "Supabase Database",
    description: "Primary relational database and scheduled Cloudflare heartbeat.",
    journeyStage: "ACCOUNT",
    state: databaseHeartbeat.status as ServiceState,
    displayOrder: enrichedServices.length + 1,
  };
  const overall = deriveOverallStatus([...enrichedServices, databaseService], false);

  return {
    overallState: overall.overallState,
    headline: overall.headline,
    description: overall.description,
    generatedAt: now.toISOString(),
    generatedAtFormatted: formatIstTimestamp(now),
    isStale: false,
    databaseHeartbeat,
    services: enrichedServices,
    activeIncidents,
    activeMaintenance,
    historySummary: {
      recordedDays: 30,
      resolvedIncidentCount30D: 0,
    },
  };
}
