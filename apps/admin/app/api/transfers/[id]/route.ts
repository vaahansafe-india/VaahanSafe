import { adminResponse, adminFailure } from "../../../../lib/api";
import {
  requireAdmin,
  assertSameOrigin,
  AdminError,
} from "../../../../lib/session";
import {
  transferDetail,
  transferCommand,
} from "../../../../features/transfers/server/transfers";
export async function GET(
  _r: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    return adminResponse(
      await transferDetail(await requireAdmin("transfers"), (await params).id),
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
    if (Number(r.headers.get("content-length") || 0) > 1000000)
      throw new AdminError(
        413,
        "TOO_LARGE",
        "Reduce this receipt to fewer identities.",
      );
    return adminResponse({
      id: await transferCommand(
        await requireAdmin("transfers", { stepUp: true }),
        (await params).id,
        await r.json(),
      ),
    });
  } catch (e) {
    return adminFailure(e);
  }
}
