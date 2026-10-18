import { adminResponse, adminFailure } from "../../../lib/api";
import {
  requireAdmin,
  assertSameOrigin,
  AdminError,
} from "../../../lib/session";
import { parseReconciliationFilters } from "../../../features/reconciliation/reconciliation.filters";
import {
  listReconciliations,
  reconciliationCommand,
} from "../../../features/reconciliation/server/reconciliation";
export async function GET(r: Request) {
  try {
    const p = new URL(r.url).searchParams;
    return adminResponse(
      await listReconciliations(
        await requireAdmin("reconciliation"),
        parseReconciliationFilters(p),
        p.get("cursor"),
      ),
    );
  } catch (e) {
    return adminFailure(e);
  }
}
export async function POST(r: Request) {
  try {
    assertSameOrigin(r);
    if (Number(r.headers.get("content-length") || 0) > 500000)
      throw new AdminError(413, "TOO_LARGE", "Reduce this request.");
    return adminResponse(
      {
        id: await reconciliationCommand(
          await requireAdmin("reconciliation", { stepUp: true }),
          null,
          await r.json(),
        ),
      },
      201,
    );
  } catch (e) {
    return adminFailure(e);
  }
}
