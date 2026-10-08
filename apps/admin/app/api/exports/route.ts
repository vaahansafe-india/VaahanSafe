import { getSupabaseAdminClient } from "@vaahansafe/database";
import {
  requireAdmin,
  assertSameOrigin,
  AdminError,
} from "../../../lib/session";
import { adminResponse, adminFailure } from "../../../lib/api";
import { canExport } from "../../../lib/exports";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const identity = await requireAdmin();
    const body = await request.json();
    if (!canExport(identity.role, body.moduleKey))
      throw new AdminError(
        403,
        "FORBIDDEN",
        "Your role cannot export these records.",
      );
    if (process.env.ADMIN_EXPORT_WORKER_ENABLED !== "true")
      throw new AdminError(
        503,
        "EXPORT_UNAVAILABLE",
        "Report generation is temporarily unavailable. Please try again later.",
      );
    const { data, error } = await getSupabaseAdminClient().rpc(
      "admin_request_export",
      {
        p_session: identity.sessionId,
        p_module: body.moduleKey,
        p_request: crypto.randomUUID(),
      },
    );
    if (error) throw error;
    return adminResponse({ id: data, status: "QUEUED" }, 202);
  } catch (error) {
    return adminFailure(error);
  }
}
