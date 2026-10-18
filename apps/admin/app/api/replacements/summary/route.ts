import { adminResponse, adminFailure } from "../../../../lib/api";
import { requireAdmin } from "../../../../lib/session";
import { replacementSummary } from "../../../../features/replacements/server/replacements";
export async function GET() {
  try {
    return adminResponse(
      await replacementSummary(await requireAdmin("replacements")),
    );
  } catch (e) {
    return adminFailure(e);
  }
}
