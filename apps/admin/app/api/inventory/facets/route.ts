import { requireAdmin } from "../../../../lib/session";
import { adminResponse, adminFailure } from "../../../../lib/api";
import { parseInventoryFilters } from "../../../../features/inventory/inventory.filters";
import { inventoryFacets } from "../../../../features/inventory/server/read-inventory";
export async function GET(request: Request) {
  try {
    const identity = await requireAdmin("inventory");
    return adminResponse(
      await inventoryFacets(
        identity,
        parseInventoryFilters(new URL(request.url).searchParams),
      ),
    );
  } catch (e) {
    return adminFailure(e);
  }
}
