import { NextResponse } from "next/server";
import { getAuthenticatedCustomer } from "@/lib/session";
import { getAuthoritativeDatabaseClient } from "@vaahansafe/database";
import { getScanReportObjectStore } from "@vaahansafe/storage";

export const dynamic = "force-dynamic";
const privateHeaders = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
};
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ reportId: string; index: string }> },
) {
  try {
    const auth = await getAuthenticatedCustomer();
    if (!auth || !auth.phoneVerified)
      return NextResponse.json(
        { error: "Please sign in with your verified account." },
        { status: 401, headers: privateHeaders },
      );
    const { reportId, index } = await params;
    if (!/^report_[a-f0-9-]{36}$/.test(reportId) || !/^[0-2]$/.test(index))
      return new NextResponse(null, { status: 404, headers: privateHeaders });
    const record = await getAuthoritativeDatabaseClient().queryFirst<{
      photos: { key: string; mimeType: string }[];
    }>(
      "SELECT photos FROM qr_scan_reports WHERE id = ? AND owner_user_id = ?::uuid AND status = 'READY' AND expires_at > clock_timestamp()",
      [reportId, auth.user.id],
    );
    const photo = record?.photos?.[Number(index)];
    if (!photo || !photo.key.startsWith(`scan-reports/${reportId}/`))
      return new NextResponse(null, { status: 404, headers: privateHeaders });
    const object = await getScanReportObjectStore().get(photo.key);
    if (!object)
      return new NextResponse(null, { status: 404, headers: privateHeaders });
    return new NextResponse(object.data, {
      headers: {
        "Content-Type": photo.mimeType,
        ...privateHeaders,
        "Content-Disposition": "inline",
      },
    });
  } catch {
    console.warn("[ScanReportPhoto] Private photo unavailable");
    return NextResponse.json(
      { error: "We couldn’t load this photo. Please try again." },
      { status: 503, headers: privateHeaders },
    );
  }
}
