import { requireAdminPage } from "../../lib/session";
import { parseReplacementFilters } from "../../features/replacements/replacement.filters";
import {
  listReplacements,
  replacementSummary,
} from "../../features/replacements/server/replacements";
import { ReplacementWorkspace } from "../../features/replacements/components/ReplacementWorkspace";
export const dynamic = "force-dynamic";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const identity = await requireAdminPage("replacements"),
    p = new URLSearchParams();
  Object.entries(await searchParams).forEach(([k, v]) => {
    if (typeof v === "string") p.set(k, v);
  });
  const f = parseReplacementFilters(p),
    [list, summary] = await Promise.allSettled([
      listReplacements(identity, f),
      replacementSummary(identity),
    ]);
  return (
    <ReplacementWorkspace
      identity={identity}
      initialFilters={f}
      initial={list.status === "fulfilled" ? list.value : null}
      initialSummary={summary.status === "fulfilled" ? summary.value : null}
    />
  );
}
