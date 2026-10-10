import {
  requireAdmin,
  assertSameOrigin,
  AdminError,
} from "../../../../lib/session";
import { adminResponse, adminFailure } from "../../../../lib/api";
import { inventoryRpc } from "../../../../features/inventory/server/read-inventory";
import { parseInventoryFilters } from "../../../../features/inventory/inventory.filters";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const identity = await requireAdmin("inventory");
    const body = await request.json();
    if (typeof body.filters !== "string" || body.filters.length > 2000)
      throw new AdminError(
        400,
        "INVALID_FILTERS",
        "Review the inventory filters.",
      );
    return adminResponse(
      await inventoryRpc(identity, "admin_inventory_select_all", {
        p_filters: parseInventoryFilters(new URLSearchParams(body.filters)),
      }),
    );
  } catch (e) {
    return adminFailure(e);
  }
}
