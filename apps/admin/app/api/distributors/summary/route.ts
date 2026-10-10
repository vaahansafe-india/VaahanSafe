import { adminResponse, adminFailure } from "../../../../lib/api";
import { requireAdmin } from "../../../../lib/session";
import { getDistributorSummary } from "../../../../features/distributors/server/distributors";
export async function GET() {
  try {
    return adminResponse(
      await getDistributorSummary(await requireAdmin("distributors")),
    );
  } catch (e) {
    return adminFailure(e);
  }
}
