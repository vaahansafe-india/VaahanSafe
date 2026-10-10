import { NextRequest, NextResponse } from "next/server";
import { getAnalytics, AnalyticsError } from "@/features/analytics/server";
import { AnalyticsInputError } from "@/features/analytics/filters";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ section: string }> },
) {
  const headers = {
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  };
  try {
    return NextResponse.json(
      await getAnalytics((await params).section, req.nextUrl.searchParams),
      { headers },
    );
  } catch (error) {
    const status =
      error instanceof AnalyticsError
        ? error.status
        : error instanceof AnalyticsInputError
          ? 400
          : 503;
    if (status === 503)
      console.error("[customer-analytics] Aggregation unavailable");
    return NextResponse.json(
      {
        error:
          status === 429
            ? "Please wait a minute before refreshing again."
            : error instanceof AnalyticsInputError
              ? error.message
              : "We couldn’t load this activity right now. Please try again.",
      },
      { status, headers },
    );
  }
}
