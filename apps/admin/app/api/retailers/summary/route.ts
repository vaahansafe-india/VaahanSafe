import { adminResponse, adminFailure } from "../../../../lib/api";
import { requireAdmin } from "../../../../lib/session";
import { getRetailerSummary } from "../../../../features/retailers/server/retailers";
export async function GET() {
  try {
    return adminResponse(
      await getRetailerSummary(await requireAdmin("retailers")),
    );
  } catch (e) {
    return adminFailure(e);
  }
}
