import { adminResponse, adminFailure } from "../../../../../lib/api";
import { requireAdmin } from "../../../../../lib/session";
import { distributorHistory } from "../../../../../features/distributors/server/history";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const p = new URL(request.url).searchParams;
    return adminResponse(
      await distributorHistory(
        await requireAdmin("distributors"),
        (await params).id,
        p.get("section") || "",
        p.get("cursor"),
      ),
    );
  } catch (e) {
    return adminFailure(e);
  }
}
