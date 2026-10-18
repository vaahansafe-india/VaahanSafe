import "../../features/risk/risk.css";
import { requireAdminPage } from "../../lib/session";
import { parseRiskFilters } from "../../features/risk/risk.filters";
import { listRiskSignals, riskSummary } from "../../features/risk/server/risk";
import { RiskWorkspace } from "../../features/risk/components/RiskWorkspace";
export const dynamic = "force-dynamic";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const identity = await requireAdminPage("fraud"),
    p = new URLSearchParams();
  Object.entries(await searchParams).forEach(([k, v]) => {
    if (typeof v === "string") p.set(k, v);
  });
  const f = parseRiskFilters(p),
    workspace = ["cases", "patterns"].includes(p.get("workspace") || "")
      ? p.get("workspace")!
      : "signals";
  const [list, summary] = await Promise.allSettled([
    workspace === "signals"
      ? listRiskSignals(identity, f)
      : Promise.resolve(null),
    riskSummary(identity),
  ]);
  return (
    <RiskWorkspace
      identity={identity}
      initialFilters={f}
      initialWorkspace={workspace}
      initialView={p.get("view") === "rows" ? "rows" : "grid"}
      initial={list.status === "fulfilled" ? list.value : null}
      initialSummary={summary.status === "fulfilled" ? summary.value : null}
    />
  );
}
