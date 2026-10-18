import { adminResponse, adminFailure } from "../../../../lib/api";
import { requireAdmin, AdminError } from "../../../../lib/session";
import { reconciliationSnapshot } from "../../../../features/reconciliation/server/reconciliation";
export async function GET(r: Request) {
  try {
    const p = new URL(r.url).searchParams,
      b = p.getAll("batch");
    if (b.length > 20)
      throw new AdminError(400, "INVALID_SCOPE", "Choose up to 20 batches.");
    const i = await requireAdmin("reconciliation");
    if (!["SUPER_ADMIN", "OPS_ADMIN"].includes(i.role))
      throw new AdminError(403, "FORBIDDEN", "Your role cannot start a count.");
    return adminResponse(
      await reconciliationSnapshot(i, p.get("partner") || "central", b),
    );
  } catch (e) {
    return adminFailure(e);
  }
}
