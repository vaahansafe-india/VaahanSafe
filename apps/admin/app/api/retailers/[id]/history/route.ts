import { adminResponse, adminFailure } from "../../../../../lib/api";
import { requireAdmin } from "../../../../../lib/session";
import { retailerHistory } from "../../../../../features/retailers/server/retailers";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const p = new URL(request.url).searchParams;
    return adminResponse(
      await retailerHistory(
        await requireAdmin("retailers"),
        (await params).id,
        p.get("section") || "activity",
        p.get("cursor"),
      ),
    );
  } catch (e) {
    return adminFailure(e);
  }
}
