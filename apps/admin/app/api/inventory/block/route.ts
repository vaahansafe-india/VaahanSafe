import { getSupabaseAdminClient } from "@vaahansafe/database";
import {
  requireAdmin,
  assertSameOrigin,
  AdminError,
} from "../../../../lib/session";
import { adminResponse, adminFailure } from "../../../../lib/api";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const identity = await requireAdmin("inventory", { stepUp: true });
    if (!["SUPER_ADMIN", "OPS_ADMIN"].includes(identity.role))
      throw new AdminError(
        403,
        "FORBIDDEN",
        "Your role cannot change inventory.",
      );
    const body = await request.json();
    if (
      body.confirmed !== true ||
      typeof body.reason !== "string" ||
      body.reason.trim().length < 10 ||
      body.reason.length > 500
    )
      throw new AdminError(
        400,
        "REASON_REQUIRED",
        "Confirm the block and provide an operational reason.",
      );
    const { data, error } = await getSupabaseAdminClient().rpc(
      "admin_block_inventory",
      {
        p_session: identity.sessionId,
        p_preview: body.previewId,
        p_reason: body.reason.trim(),
        p_request: crypto.randomUUID(),
      },
    );
    if (error)
      throw new AdminError(
        409,
        "INVENTORY_CHANGED",
        "We couldn't apply that preview. Refresh the inventory and review it again.",
      );
    return adminResponse({ affected: data });
  } catch (error) {
    return adminFailure(error);
  }
}
