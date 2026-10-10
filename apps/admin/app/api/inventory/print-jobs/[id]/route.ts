import {
  requireAdmin,
  assertSameOrigin,
  AdminError,
} from "../../../../../lib/session";
import { adminResponse, adminFailure } from "../../../../../lib/api";
import {
  generatePrintArtifact,
  finishPrintJob,
  printJobMetadata,
} from "../../../../../features/inventory/server/print-jobs";
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, { params }: Context) {
  try {
    return adminResponse(
      await printJobMetadata(
        await requireAdmin("inventory", { stepUp: true }),
        (await params).id,
      ),
    );
  } catch (e) {
    return adminFailure(e);
  }
}
export async function POST(request: Request, { params }: Context) {
  try {
    assertSameOrigin(request);
    const identity = await requireAdmin("inventory", { stepUp: true }),
      { id } = await params,
      body = await request.json();
    if (body.action === "GENERATE")
      return adminResponse(await generatePrintArtifact(identity, id));
    if (
      !["COMPLETE", "CANCEL"].includes(body.action) ||
      body.confirmed !== true
    )
      throw new AdminError(
        400,
        "CONFIRMATION_REQUIRED",
        "Review and confirm this print operation.",
      );
    return adminResponse(
      await finishPrintJob(identity, id, body.action, body.reason),
    );
  } catch (e) {
    return adminFailure(e);
  }
}
