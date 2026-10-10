import { requireAdminPage } from "../../lib/session";
import { parseDistributorFilters } from "../../features/distributors/distributor.filters";
import {
  listDistributors,
  getDistributorSummary,
} from "../../features/distributors/server/distributors";
import { DistributorWorkspace } from "../../features/distributors/components/DistributorWorkspace";
export const dynamic = "force-dynamic";
export default async function DistributorsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const identity = await requireAdminPage("distributors"),
    values = await searchParams,
    p = new URLSearchParams();
  Object.entries(values).forEach(([k, v]) => {
    if (typeof v === "string") p.set(k, v);
  });
  const filters = parseDistributorFilters(p),
    [list, summary] = await Promise.allSettled([
      listDistributors(identity, filters),
      getDistributorSummary(identity),
    ]);
  return (
    <DistributorWorkspace
      identity={identity}
      initial={list.status === "fulfilled" ? list.value : null}
      initialSummary={summary.status === "fulfilled" ? summary.value : null}
      initialFilters={filters}
    />
  );
}
