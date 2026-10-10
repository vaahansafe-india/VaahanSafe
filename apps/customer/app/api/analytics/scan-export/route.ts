import { NextRequest, NextResponse } from "next/server";
import { getAnalytics, AnalyticsError } from "@/features/analytics/server";
import {
  parseFilters,
  granularity,
  AnalyticsInputError,
} from "@/features/analytics/filters";
import { getAuthenticatedCustomer } from "@/lib/session";
import { getAuthoritativeDatabaseClient } from "@vaahansafe/database";
import { buildAnalyticsSql } from "@/features/analytics/sql";
import { storageCsv } from "@/features/analytics/csv";
import { outcomeLabel } from "@/features/analytics/scan-model";
import type { AnalyticsData } from "@/features/analytics/types";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function GET(req: NextRequest) {
  const headers = {
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  };
  try {
    const params = new URLSearchParams(req.nextUrl.searchParams),
      type = params.get("type") || "summary";
    if (!["summary", "history"].includes(type))
      throw new AnalyticsInputError("Choose a supported scan report.");
    params.delete("cursor");
    params.set("compare", "true");
    const result = await getAnalytics("scan-summary", params),
      data = result.data as AnalyticsData["scan-summary"];
    let csv: string;
    if (type === "summary")
      csv = storageCsv(
        ["Metric", "Value", "Definition"],
        [
          [
            "Total scans",
            data.total,
            "One persisted scan event is one observation",
          ],
          [
            "Active safety view",
            data.successful,
            "Active profile returned by resolver; does not prove it was viewed",
          ],
          [
            "Activation required",
            data.partial,
            "Recorded inactive resolver outcome",
          ],
          [
            "Non-active resolutions",
            data.unsuccessful,
            "All outcomes other than active; includes activation required",
          ],
          [
            "Previous total",
            data.previousTotal,
            "Previous period of equal length with the same filters",
          ],
          ["Unique scanners", null, "Not recorded reliably"],
          ["Response duration", null, "Not recorded"],
        ],
      );
    else {
      const auth = await getAuthenticatedCustomer();
      if (
        !auth?.phoneVerified ||
        `${auth.user.id}:${auth.session.id}` !== result.scope
      )
        throw new AnalyticsError(401);
      const f = parseFilters(params),
        q = buildAnalyticsSql(
          "scan-export",
          auth.user.id,
          auth.session.id,
          f,
          granularity(f),
        );
      const records = await getAuthoritativeDatabaseClient().queryFirst<{
        data: AnalyticsData["scan-export"];
      }>(q.sql, q.params);
      if (!records) throw new AnalyticsError(401);
      if (records.data.events.length > 1000)
        throw new AnalyticsInputError(
          "This report has more than 1,000 scans. Narrow the date range or select a vehicle or QR identity.",
        );
      csv = storageCsv(
        [
          "Recorded at (UTC)",
          "QR identity",
          "Vehicle",
          "Masked registration",
          "Coarse state / region",
          "Coarse city",
          "Resolver outcome",
          "Browser family",
        ],
        records.data.events.map((r) => [
          r.timestamp,
          r.qrLabel,
          r.vehicleName,
          r.vehicleLabel,
          r.state,
          r.city,
          outcomeLabel(r.result),
          r.device,
        ]),
      );
    }
    return new NextResponse(csv, {
      headers: {
        ...headers,
        "X-VaahanSafe-Scope": result.scope,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="vaahansafe-scans-${type}.csv"`,
      },
    });
  } catch (e) {
    const status =
      e instanceof AnalyticsError
        ? e.status
        : e instanceof AnalyticsInputError
          ? 400
          : 503;
    if (status === 503) console.error("[customer-scans] Report unavailable");
    return NextResponse.json(
      {
        error:
          e instanceof AnalyticsInputError
            ? e.message
            : status === 429
              ? "Please wait a minute before exporting again."
              : "We couldn’t export these scans right now. Please try again.",
      },
      { status, headers },
    );
  }
}
