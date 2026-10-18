import { adminResponse, adminFailure } from "../../../../lib/api";
import {
  requireAdmin,
  assertSameOrigin,
  AdminError,
} from "../../../../lib/session";
import {
  replacementDetail,
  replacementCommand,
} from "../../../../features/replacements/server/replacements";
export async function GET(
  _r: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    return adminResponse(
      await replacementDetail(
        await requireAdmin("replacements"),
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
    if (Number(r.headers.get("content-length") || 0) > 5000)
      throw new AdminError(413, "TOO_LARGE", "Reduce the operational note.");
    return adminResponse({
      id: await replacementCommand(
        await requireAdmin("replacements", { stepUp: true }),
        (await params).id,
        await r.json(),
      ),
    });
  } catch (e) {
    return adminFailure(e);
  }
}
