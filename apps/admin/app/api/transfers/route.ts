import { adminResponse, adminFailure } from "../../../lib/api";
import {
  requireAdmin,
  assertSameOrigin,
  AdminError,
} from "../../../lib/session";
import { parseTransferFilters } from "../../../features/transfers/transfer.filters";
import {
  listTransfers,
  transferCommand,
} from "../../../features/transfers/server/transfers";
export async function GET(r: Request) {
  try {
    const i = await requireAdmin("transfers"),
      p = new URL(r.url).searchParams;
    return adminResponse(
      await listTransfers(i, parseTransferFilters(p), p.get("cursor")),
    );
  } catch (e) {
    return adminFailure(e);
  }
}
export async function POST(r: Request) {
  try {
    assertSameOrigin(r);
    if (Number(r.headers.get("content-length") || 0) > 1000000)
      throw new AdminError(
        413,
        "TOO_LARGE",
        "Reduce the number of identities in this request.",
      );
    const i = await requireAdmin("transfers", { stepUp: true });
    return adminResponse(
      { id: await transferCommand(i, null, await r.json()) },
      201,
    );
  } catch (e) {
    return adminFailure(e);
  }
}
