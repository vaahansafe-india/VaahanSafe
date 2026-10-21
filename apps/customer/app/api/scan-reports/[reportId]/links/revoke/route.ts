import { NextResponse } from "next/server";
import { getAuthenticatedCustomer } from "@/lib/session";
import { getAuthoritativeDatabaseClient } from "@vaahansafe/database";
export const dynamic = "force-dynamic";
const headers = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};
export async function POST(
  request: Request,
  { params }: { params: Promise<{ reportId: string }> },
) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return NextResponse.json(
      { error: "Please use your VaahanSafe account to manage report links." },
      { status: 403, headers },
    );
  try {
    const auth = await getAuthenticatedCustomer();
    if (!auth || !auth.phoneVerified)
      return NextResponse.json(
        { error: "Please sign in again." },
        { status: 401, headers },
      );
    const { reportId } = await params;
    if (!/^report_[a-f0-9-]{36}$/.test(reportId))
      return NextResponse.json(
        { error: "Report unavailable." },
        { status: 404, headers },
      );
    const db = getAuthoritativeDatabaseClient();
    const report = await db.queryFirst<{ revoked: boolean }>(
      "SELECT public.revoke_qr_report_view_links(?, ?::uuid) AS revoked",
      [reportId, auth.user.id],
    );
    if (!report?.revoked)
      return NextResponse.json(
        { error: "Report unavailable." },
        { status: 404, headers },
      );
    return NextResponse.json({ revoked: true }, { headers });
  } catch {
    console.warn("[ReportViewer] Link revocation unavailable");
    return NextResponse.json(
      { error: "We couldn’t revoke these links right now. Please try again." },
      { status: 503, headers },
    );
  }
}
