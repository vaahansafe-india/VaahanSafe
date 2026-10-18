import { adminResponse, adminFailure } from "../../../../lib/api";
import {
  requireAdmin,
  assertSameOrigin,
  AdminError,
} from "../../../../lib/session";
import {
  reconciliationDetail,
  reconciliationCommand,
} from "../../../../features/reconciliation/server/reconciliation";
export async function GET(
  _r: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    return adminResponse(
      await reconciliationDetail(
        await requireAdmin("reconciliation"),
        (await params).id,
      ),
    );
  } catch (e) {
    return adminFailure(e);
  }
}
export async function POST(
  r: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(r);
    if (Number(r.headers.get("content-length") || 0) > 500000)
      throw new AdminError(
        413,
        "TOO_LARGE",
        "Reduce this adjustment to fewer identities.",
      );
    return adminResponse({
      id: await reconciliationCommand(
        await requireAdmin("reconciliation", { stepUp: true }),
        (await params).id,
        await r.json(),
      ),
    });
  } catch (e) {
    return adminFailure(e);
  }
}
