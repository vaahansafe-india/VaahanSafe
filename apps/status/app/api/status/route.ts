import { NextResponse } from "next/server";
import { getPublicSystemStatus } from "@vaahansafe/status-core";

export async function GET() {
  try {
    const status = await getPublicSystemStatus();

    return NextResponse.json(status, {
      headers: {
        "Cache-Control": "public, max-age=30, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        overallState: "UNKNOWN",
        headline: "Current service condition could not be confirmed.",
        description: "Status reporting telemetry is temporarily unavailable.",
        generatedAt: new Date().toISOString(),
        isStale: true,
        services: [],
      },
      { status: 500 }
    );
  }
}
