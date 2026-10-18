import { adminResponse, adminFailure } from "../../../../../lib/api";
import { requireAdmin } from "../../../../../lib/session";
import { reconciliationHistory } from "../../../../../features/reconciliation/server/reconciliation";
export async function GET(
  r: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const p = new URL(r.url).searchParams;
    return adminResponse(
      await reconciliationHistory(
        await requireAdmin("reconciliation"),
        (await params).id,
        p.get("section") || "timeline",
        p.get("cursor"),
        p.get("q") || "",
      ),
    );
  } catch (e) {
    return adminFailure(e);
  }
}
