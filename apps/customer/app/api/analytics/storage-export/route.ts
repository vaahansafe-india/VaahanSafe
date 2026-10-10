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
    if (!["summary", "documents", "activity"].includes(type))
      throw new AnalyticsInputError("Choose a supported report.");
    let csv: string;
    let reportScope: string;
    if (type === "activity") {
      params.set("event", "DOCUMENT");
      params.delete("cursor");
      const result = await getAnalytics("activity", params);
      reportScope = result.scope;
      const events = (result.data as AnalyticsData["activity"]).events;
      csv = storageCsv(
        ["Document", "Action", "Recorded at (UTC)", "Scope"],
        events.map((row) => [
          row.reference,
          row.title,
          row.timestamp,
          "Latest 25 matching events",
        ]),
      );
    } else {
      // The existing service validates the verified session, scope and filters,
      // applies the shared request limit, and independently authorizes vehicles.
      const result = await getAnalytics("documents", params);
      reportScope = result.scope;
      const data = result.data as AnalyticsData["documents"];
      if (type === "summary")
        csv = storageCsv(
          ["Metric", "Value", "Definition"],
          [
            ["Documents", data.total, "Current finalized documents"],
            [
              "Original bytes",
              data.bytes,
              "READY originals and retained versions; non-deleted documents",
            ],
            [
              "Current original bytes",
              data.versions.currentBytes,
              "Finalized current originals",
            ],
            [
              "Previous version bytes",
              data.versions.previousBytes,
              "Retained finalized previous versions",
            ],
            [
              "Account reservation bytes",
              data.reservedBytes,
              "Account-wide; includes thumbnails and pending cleanup",
            ],
            [
              "Vault policy limit bytes",
              data.quotaBytes,
              "Enforced vault policy",
            ],
            ...data.byVehicle.map((row) => [
              `Vehicle ${row.label}`,
              row.bytes,
              `${row.documents} documents`,
            ]),
          ],
        );
      else {
        const auth = await getAuthenticatedCustomer();
        if (
          !auth?.phoneVerified ||
          `${auth.user.id}:${auth.session.id}` !== reportScope
        )
          throw new AnalyticsError(401);
        const filters = parseFilters(params),
          q = buildAnalyticsSql(
            "storage-export",
            auth.user.id,
            auth.session.id,
            filters,
            granularity(filters),
          );
        const exported = await getAuthoritativeDatabaseClient().queryFirst<{
          data: AnalyticsData["storage-export"];
        }>(q.sql, q.params);
        if (!exported) throw new AnalyticsError(401);
        if (exported.data.documents.length > 1000)
          throw new AnalyticsInputError(
            "This report has more than 1,000 documents. Apply a vehicle or category filter and try again.",
          );
        csv = storageCsv(
          [
            "Document",
            "Vehicle",
            "Category",
            "Original type",
            "Retained original bytes",
            "Versions",
            "Created at (UTC)",
          ],
          exported.data.documents.map((row) => [
            row.title,
            row.vehicleLabel,
            row.category,
            row.mime,
            row.bytes,
            row.versions,
            row.createdAt,
          ]),
        );
      }
    }
    return new NextResponse(csv, {
      headers: {
        ...headers,
        "X-VaahanSafe-Scope": reportScope,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="vaahansafe-storage-${type}.csv"`,
      },
    });
  } catch (error) {
    const status =
      error instanceof AnalyticsError
        ? error.status
        : error instanceof AnalyticsInputError
          ? 400
          : 503;
    if (status === 503) console.error("[customer-storage] Report unavailable");
    return NextResponse.json(
      {
        error:
          error instanceof AnalyticsInputError
            ? error.message
            : status === 429
              ? "Please wait a minute before exporting again."
              : "We couldn’t export this report right now. Please try again.",
      },
      { status, headers },
    );
  }
}
