import { adminResponse, adminFailure } from "../../../../../lib/api";
import { requireAdmin } from "../../../../../lib/session";
import { replacementHistory } from "../../../../../features/replacements/server/replacements";
export async function GET(
  r: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const p = new URL(r.url).searchParams;
    return adminResponse(
      await replacementHistory(
        await requireAdmin("replacements"),
        (await params).id,
        p.get("section") || "timeline",
        p.get("cursor"),
      ),
    );
  } catch (e) {
    return adminFailure(e);
  }
}
