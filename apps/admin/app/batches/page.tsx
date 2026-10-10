import { requireAdminPage } from "../../lib/session";
import { BatchesWorkspace } from "../../features/batches/components/BatchesWorkspace";
import {
  listBatches,
  getBatchesSummary,
} from "../../features/batches/server/read-batches";
import type { BatchFilters } from "../../features/batches/batches.types";

export const dynamic = "force-dynamic";

export default async function BatchesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const identity = await requireAdminPage("batches");
  const values = await searchParams;

  const parseArray = (key: string): string[] => {
    const raw = values[key];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") return [raw];
    return [];
  };

  const filters: BatchFilters = {
    q: typeof values.q === "string" ? values.q : "",
    statuses: parseArray("status"),
    channels: parseArray("channel"),
    print: (typeof values.print === "string" ? values.print : "any") as any,
    sort: (typeof values.sort === "string" ? values.sort : "newest") as any,
    from: typeof values.from === "string" ? values.from : "",
    to: typeof values.to === "string" ? values.to : "",
  };

  const [listRes, summaryRes] = await Promise.allSettled([
    listBatches(identity, filters),
    getBatchesSummary(identity),
  ]);

  const initialList = listRes.status === "fulfilled" ? listRes.value : null;
  const initialSummary =
    summaryRes.status === "fulfilled" ? summaryRes.value : null;

  return (
    <BatchesWorkspace
      identity={identity}
      initial={initialList}
      initialSummary={initialSummary}
      initialFilters={filters}
    />
  );
}
