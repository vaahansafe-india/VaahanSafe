import { adminResponse, adminFailure } from "../../../lib/api";
import { requireAdmin } from "../../../lib/session";
import { parseReplacementFilters } from "../../../features/replacements/replacement.filters";
import { listReplacements } from "../../../features/replacements/server/replacements";
export async function GET(r: Request) {
  try {
    const p = new URL(r.url).searchParams;
    return adminResponse(
      await listReplacements(
        await requireAdmin("replacements"),
        parseReplacementFilters(p),
        p.get("cursor"),
      ),
    );
  } catch (e) {
    return adminFailure(e);
  }
}
