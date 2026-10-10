import { requireAdminPage } from "../../lib/session";
import { parseRetailerFilters } from "../../features/retailers/retailer.filters";
import {
  listRetailers,
  getRetailerSummary,
} from "../../features/retailers/server/retailers";
import { RetailerWorkspace } from "../../features/retailers/components/RetailerWorkspace";
export const dynamic = "force-dynamic";
export default async function RetailersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const identity = await requireAdminPage("retailers"),
    values = await searchParams,
    p = new URLSearchParams();
  Object.entries(values).forEach(([k, v]) => {
    if (typeof v === "string") p.set(k, v);
  });
  const filters = parseRetailerFilters(p),
    [list, summary] = await Promise.allSettled([
      listRetailers(identity, filters),
      getRetailerSummary(identity),
    ]);
  return (
    <RetailerWorkspace
      identity={identity}
      initial={list.status === "fulfilled" ? list.value : null}
      initialSummary={summary.status === "fulfilled" ? summary.value : null}
      initialFilters={filters}
    />
  );
}
