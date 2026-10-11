import { z } from "zod";
import { adminResponse, adminFailure } from "../../../../../../lib/api";
import {
  requireAdmin,
  assertSameOrigin,
  AdminError,
} from "../../../../../../lib/session";
import { inventoryRpc } from "../../../../../../features/inventory/server/read-inventory";
import { stockReleaseSchema } from "../../../../../../features/inventory/stock-release.schema";
import { canPrintInventory } from "../../../../../../features/inventory/inventory.permissions";
type Context = { params: Promise<{ id: string }> };
function jobId(id: string) {
  if (!z.string().uuid().safeParse(id).success)
    throw new AdminError(404, "NOT_FOUND", "This print job is unavailable.");
  return id;
}
export async function GET(_request: Request, { params }: Context) {
  try {
    return adminResponse(
      await inventoryRpc(
        await requireAdmin("inventory"),
        "admin_print_stock_release_status",
        { p_job: jobId((await params).id) },
      ),
    );
  } catch (e) {
    return adminFailure(e);
  }
}
export async function POST(request: Request, { params }: Context) {
  try {
    assertSameOrigin(request);
    const identity = await requireAdmin("inventory", { stepUp: true });
    if (!canPrintInventory(identity.role))
      throw new AdminError(
        403,
        "FORBIDDEN",
        "Your role cannot release printed stock.",
      );
    const text = await request.text();
    if (text.length > 4096)
      throw new AdminError(
        400,
        "INVALID_REQUEST",
        "Review the release and required reason.",
      );
    let body;
    try {
      body = stockReleaseSchema.safeParse(JSON.parse(text));
    } catch {
      body = null;
    }
    if (!body?.success)
      throw new AdminError(
        400,
        "INVALID_REQUEST",
        "Confirm the verified stickers and provide a reason between 10 and 500 characters.",
      );
    const release = await inventoryRpc(
      identity,
      "admin_release_verified_print_stock",
      {
        p_job: jobId((await params).id),
        p_reason: body.data.reason,
        p_request: body.data.requestId,
      },
    );
    return adminResponse({ id: release });
  } catch (e) {
    return adminFailure(e);
  }
}
