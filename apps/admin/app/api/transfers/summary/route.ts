import { adminResponse, adminFailure } from "../../../../lib/api";
import { requireAdmin } from "../../../../lib/session";
import { transferSummary } from "../../../../features/transfers/server/transfers";
export async function GET() {
  try {
    return adminResponse(
      await transferSummary(await requireAdmin("transfers")),
    );
  } catch (e) {
    return adminFailure(e);
  }
}
