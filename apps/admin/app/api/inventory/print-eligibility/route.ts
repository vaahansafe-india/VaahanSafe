import { requireAdmin, assertSameOrigin } from "../../../../lib/session";
import { adminResponse, adminFailure } from "../../../../lib/api";
import { printEligibility } from "../../../../features/inventory/server/read-inventory";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const identity = await requireAdmin("inventory");
    return adminResponse(
      await printEligibility(identity, (await request.json()).selection),
    );
  } catch (e) {
    return adminFailure(e);
  }
}
