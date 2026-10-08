import { NextResponse } from "next/server";
import { AdminError } from "./session";
export function adminResponse(data: unknown, status = 200) {
  return NextResponse.json(
    { success: true, data },
    { status, headers: { "Cache-Control": "private, no-store" } },
  );
}
export function adminFailure(error: unknown, requestId = crypto.randomUUID()) {
  const known = error instanceof AdminError;
  console.error("[admin] request failed", {
    requestId,
    code: known ? error.code : "SERVICE_UNAVAILABLE",
    type: error instanceof Error ? error.name : "UnknownError",
  });
  return NextResponse.json(
    {
      success: false,
      error: {
        code: known ? error.code : "SERVICE_UNAVAILABLE",
        message: known
          ? error.message
          : "We couldn't complete this action right now. Please try again.",
        requestId,
      },
    },
    {
      status: known ? error.status : 503,
      headers: { "Cache-Control": "private, no-store" },
    },
  );
}
