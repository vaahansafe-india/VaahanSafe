import { requireAdmin, assertSameOrigin } from "../../../../lib/session";
import { adminResponse, adminFailure } from "../../../../lib/api";
import { createPrintJob } from "../../../../features/inventory/server/print-jobs";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const identity = await requireAdmin("inventory", { stepUp: true });
    return adminResponse(
      await createPrintJob(identity, await request.json()),
      201,
    );
  } catch (e) {
    return adminFailure(e);
  }
}
