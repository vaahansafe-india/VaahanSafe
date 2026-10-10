import { getSupabaseAdminClient } from "@vaahansafe/database";
import {
  requireAdmin,
  assertSameOrigin,
  AdminError,
} from "../../../lib/session";
import { adminResponse, adminFailure } from "../../../lib/api";
import { canExport } from "../../../lib/exports";
import { parseInventoryFilters } from "../../../features/inventory/inventory.filters";
import { parseDistributorFilters } from "../../../features/distributors/distributor.filters";
import { parseRetailerFilters } from "../../../features/retailers/retailer.filters";
import { retailerRpc } from "../../../features/retailers/server/retailers";
import {
  distributorRpc,
  assertDistributorExportAvailable,
} from "../../../features/distributors/server/distributors";
import {
  inventoryRpc,
  validateSelection,
} from "../../../features/inventory/server/read-inventory";
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
    if (body.moduleKey === "distributors" || body.moduleKey === "retailers") {
      await assertDistributorExportAvailable(body.moduleKey);
      if (
        body.ids !== null &&
        body.ids !== undefined &&
        (!Array.isArray(body.ids) ||
          body.ids.length < 1 ||
          body.ids.length > 100 ||
          body.ids.some(
            (id: unknown) =>
              typeof id !== "string" || !/^[A-Za-z0-9_-]{1,100}$/.test(id),
          ))
      )
        throw new AdminError(
          400,
          "INVALID_SELECTION",
          "Select between 1 and 100 partners.",
        );
      return adminResponse(
        {
          id: await (
            body.moduleKey === "retailers" ? retailerRpc : distributorRpc
          )(
            identity,
            body.moduleKey === "retailers"
              ? "admin_request_retailer_export"
              : "admin_request_distributor_export",
            {
              p_filters: (body.moduleKey === "retailers"
                ? parseRetailerFilters
                : parseDistributorFilters)(
                new URLSearchParams(
                  typeof body.filters === "string" ? body.filters : "",
                ),
              ),
              p_ids: body.ids ? [...new Set(body.ids)] : null,
              p_request: crypto.randomUUID(),
            },
          ),
          status: "QUEUED",
        },
        202,
      );
    }
    if (body.moduleKey === "inventory")
      return adminResponse(
        {
          id: await inventoryRpc(identity, "admin_request_inventory_export", {
            p_filters: parseInventoryFilters(
              new URLSearchParams(
                typeof body.filters === "string" ? body.filters : "",
              ),
            ),
            p_selection: body.selection
              ? validateSelection(body.selection)
              : null,
            p_request: crypto.randomUUID(),
          }),
          status: "QUEUED",
        },
        202,
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
