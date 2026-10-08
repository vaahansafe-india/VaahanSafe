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
    const identity = await requireAdmin("inventory");
    if (!["SUPER_ADMIN", "OPS_ADMIN"].includes(identity.role))
      throw new AdminError(
        403,
        "FORBIDDEN",
        "Your role cannot change inventory.",
      );
    const body = await request.json();
    if (
      !Array.isArray(body.ids) ||
      body.ids.length < 1 ||
      body.ids.length > 100 ||
      body.ids.some(
        (id: unknown) => typeof id !== "string" || !/^[\w-]{1,100}$/.test(id),
      )
    )
      throw new AdminError(
        400,
        "INVALID_SELECTION",
        "Select between 1 and 100 QR records.",
      );
    const { data, error } = await getSupabaseAdminClient().rpc(
      "admin_inventory_preview",
      {
        p_session: identity.sessionId,
        p_ids: [...new Set(body.ids)],
        p_request: crypto.randomUUID(),
      },
    );
    if (error)
      throw new AdminError(
        409,
        "PREVIEW_UNAVAILABLE",
        "We couldn't prepare this preview. Refresh the records and try again.",
      );
    return adminResponse(data);
  } catch (error) {
    return adminFailure(error);
  }
}
