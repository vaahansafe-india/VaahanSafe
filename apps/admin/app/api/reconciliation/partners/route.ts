import { adminResponse, adminFailure } from "../../../../lib/api";
import { requireAdmin } from "../../../../lib/session";
import { reconciliationPartners } from "../../../../features/reconciliation/server/reconciliation";
export async function GET(r: Request) {
  try {
    const p = new URL(r.url).searchParams;
    return adminResponse(
      await reconciliationPartners(
        await requireAdmin("reconciliation"),
        p.get("q") || "",
        p.get("kind") || "",
      ),
    );
  } catch (e) {
    return adminFailure(e);
  }
}
