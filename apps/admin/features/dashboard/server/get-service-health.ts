import "server-only";
import { getSupabaseAdminClient } from "@vaahansafe/database";
import { getAuthoritativeObjectStore } from "@vaahansafe/storage";
import { getOtpDeliveryAvailability } from "@vaahansafe/notifications";
import type { DashboardServiceItem } from "../types";

export interface ServiceHealthResult {
  services: DashboardServiceItem[];
  systemStatus: "operational" | "degraded" | "attention";
}

function isRazorpayConfigured(): boolean {
  if (
    Boolean(
      process.env.RAZORPAY_KEY_ID ||
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
        process.env.RAZORPAY_KEY_SECRET,
    )
  ) {
    return true;
  }
  try {
    const fs = require("node:fs");
    const path = require("node:path");
    const candidates = [
      path.resolve(process.cwd(), ".env.local"),
      path.resolve(process.cwd(), ".env"),
      path.resolve(process.cwd(), "../../.env"),
      path.resolve(process.cwd(), "../.env"),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        const text = fs.readFileSync(p, "utf-8");
        const match = text.match(/^[ \t]*RAZORPAY_KEY_ID=[ \t]*([^\r\n#]+)/m);
        if (match && match[1].trim()) {
          process.env.RAZORPAY_KEY_ID = match[1].trim();
          return true;
        }
      }
    }
  } catch {
    // ignore
  }
  return false;
}

export async function getDashboardServiceHealth(): Promise<ServiceHealthResult> {
  const dbStart = Date.now();
  let dbLatency: number | null = null;

  const [dbResult, r2Result] = await Promise.allSettled([
    (async () => {
      const { error } = await getSupabaseAdminClient()
        .from("admin_users")
        .select("id")
        .limit(1)
        .abortSignal(AbortSignal.timeout(4000));
      if (error) throw error;
      dbLatency = Date.now() - dbStart;
    })(),
    (async () => {
      await Promise.race([
        getAuthoritativeObjectStore("PUBLIC").head("admin/health-probe"),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("R2 check timeout")), 4000),
        ),
      ]);
    })(),
  ]);

  const supabaseHealthy = dbResult.status === "fulfilled";
  const r2Healthy = r2Result.status === "fulfilled";

  const isAuthConfigured = Boolean(
    (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.SUPABASE_SECRET_KEY),
  );

  const isMsg91Configured = Object.values(
    getOtpDeliveryAvailability(),
  ).some(Boolean);

  const isPaymentsConfigured = isRazorpayConfigured();

  const services: DashboardServiceItem[] = [
    {
      name: "Supabase database",
      status: supabaseHealthy ? "healthy" : "unavailable",
      latencyMs: supabaseHealthy ? dbLatency : null,
      detail: supabaseHealthy
        ? `${dbLatency ?? 24} ms`
        : "Database connection failed",
      actionHref: "/settings",
      actionLabel: supabaseHealthy ? undefined : "Check →",
    },
    {
      name: "Cloudflare R2",
      status: r2Healthy ? "healthy" : "unavailable",
      detail: r2Healthy ? "Object store online" : "Probe unreachable",
      actionHref: "/gallery",
      actionLabel: r2Healthy ? undefined : "Inspect →",
    },
    {
      name: "Administrative access",
      status: isAuthConfigured ? "configured" : "unconfigured",
      detail: "Role enforced · session protected",
    },
    {
      name: "MSG91 OTP & Alerts",
      status: isMsg91Configured ? "configured" : "unconfigured",
      detail: isMsg91Configured ? "SMS & WhatsApp ready" : "Not configured",
    },
    {
      name: "Razorpay Payments",
      status: isPaymentsConfigured ? "configured" : "unconfigured",
      detail: isPaymentsConfigured ? "Payment gateway active" : "Not configured",
    },
  ];

  let systemStatus: "operational" | "degraded" | "attention" = "operational";
  if (!supabaseHealthy) {
    systemStatus = "attention";
  } else if (!r2Healthy) {
    systemStatus = "degraded";
  }

  return { services, systemStatus };
}
