import { requireAdmin } from "../../../lib/session";
import { adminResponse, adminFailure } from "../../../lib/api";
import { parseInventoryFilters } from "../../../features/inventory/inventory.filters";
import { listInventory } from "../../../features/inventory/server/read-inventory";
export async function GET(request: Request) {
  try {
    const identity = await requireAdmin("inventory");
    const p = new URL(request.url).searchParams;
    return adminResponse(
      await listInventory(identity, parseInventoryFilters(p), p.get("cursor")),
    );
  } catch (e) {
    return adminFailure(e);
  }
}
