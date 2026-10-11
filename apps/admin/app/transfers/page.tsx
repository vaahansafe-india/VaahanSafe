import { requireAdminPage } from "../../lib/session";
import { parseTransferFilters } from "../../features/transfers/transfer.filters";
import {
  listTransfers,
  transferSummary,
} from "../../features/transfers/server/transfers";
import { TransferWorkspace } from "../../features/transfers/components/TransferWorkspace";
export const dynamic = "force-dynamic";
export default async function TransfersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const identity = await requireAdminPage("transfers"),
    p = new URLSearchParams();
  Object.entries(await searchParams).forEach(([k, v]) => {
    if (typeof v === "string") p.set(k, v);
  });
  const filters = parseTransferFilters(p),
    [list, summary] = await Promise.allSettled([
      listTransfers(identity, filters),
      transferSummary(identity),
    ]);
  return (
    <TransferWorkspace
      identity={identity}
      initial={list.status === "fulfilled" ? list.value : null}
      initialSummary={summary.status === "fulfilled" ? summary.value : null}
      initialFilters={filters}
    />
  );
}
