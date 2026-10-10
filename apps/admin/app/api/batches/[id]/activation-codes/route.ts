import { adminResponse, adminFailure } from "../../../../../lib/api";
import {
  requireAdmin,
  assertSameOrigin,
  AdminError,
} from "../../../../../lib/session";
import { provisionOfflineActivationCodes } from "../../../../../lib/offline-activation-codes";

export const runtime = "nodejs";
export const maxDuration = 300;
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    const identity = await requireAdmin("batches");
    if (!["SUPER_ADMIN", "OPS_ADMIN"].includes(identity.role))
      throw new AdminError(
        403,
        "FORBIDDEN",
        "Your role cannot configure activation codes.",
      );
    const { id } = await params;
    if (!/^batch_[a-zA-Z0-9_-]{1,100}$/.test(id))
      throw new AdminError(
        400,
        "INVALID_BATCH",
        "Choose a valid offline batch.",
      );
    return adminResponse(await provisionOfflineActivationCodes(identity, id));
  } catch (error) {
    return adminFailure(error);
  }
}
