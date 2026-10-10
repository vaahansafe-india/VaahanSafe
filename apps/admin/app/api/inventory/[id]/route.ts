import { requireAdmin } from "../../../../lib/session";
import { adminResponse, adminFailure } from "../../../../lib/api";
import { getInventoryDetail } from "../../../../features/inventory/server/read-inventory";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const identity = await requireAdmin("inventory");
    return adminResponse(await getInventoryDetail(identity, (await params).id));
  } catch (e) {
    return adminFailure(e);
  }
}
