import { adminResponse, adminFailure } from "../../../../lib/api";
import { requireAdmin } from "../../../../lib/session";
import { reconciliationSummary } from "../../../../features/reconciliation/server/reconciliation";
export async function GET() {
  try {
    return adminResponse(
      await reconciliationSummary(await requireAdmin("reconciliation")),
    );
  } catch (e) {
    return adminFailure(e);
  }
}
