import { requireAdminPage } from "../../lib/session";
import { InventoryWorkspace } from "../../features/inventory/components/InventoryWorkspace";
import { parseInventoryFilters } from "../../features/inventory/inventory.filters";
import {
  listInventory,
  inventoryFacets,
} from "../../features/inventory/server/read-inventory";
export const dynamic = "force-dynamic";
export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const identity = await requireAdminPage("inventory"),
    values = await searchParams,
    params = new URLSearchParams();
  for (const [k, v] of Object.entries(values))
    if (typeof v === "string") params.set(k, v);
  const filters = parseInventoryFilters(params),
    [list, facets] = await Promise.allSettled([
      listInventory(identity, filters),
      inventoryFacets(identity, filters),
    ]);
  return (
    <InventoryWorkspace
      identity={identity}
      initial={list.status === "fulfilled" ? list.value : null}
      initialFacets={facets.status === "fulfilled" ? facets.value : null}
      initialFilters={filters}
    />
  );
}
