import { requireAdminPage } from "../../lib/session";
import { parseReconciliationFilters } from "../../features/reconciliation/reconciliation.filters";
import {
  listReconciliations,
  reconciliationSummary,
} from "../../features/reconciliation/server/reconciliation";
import { ReconciliationWorkspace } from "../../features/reconciliation/components/ReconciliationWorkspace";
export const dynamic = "force-dynamic";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const identity = await requireAdminPage("reconciliation"),
    p = new URLSearchParams();
  Object.entries(await searchParams).forEach(([k, v]) => {
    if (typeof v === "string") p.set(k, v);
  });
  const filters = parseReconciliationFilters(p),
    [list, summary] = await Promise.allSettled([
      listReconciliations(identity, filters),
      reconciliationSummary(identity),
    ]);
  return (
    <ReconciliationWorkspace
      identity={identity}
      initialFilters={filters}
      initial={list.status === "fulfilled" ? list.value : null}
      initialSummary={summary.status === "fulfilled" ? summary.value : null}
    />
  );
}
