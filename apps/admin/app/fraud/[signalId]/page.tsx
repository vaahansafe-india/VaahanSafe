import "../../../features/risk/risk.css";
import { requireAdminPage } from "../../../lib/session";
import { riskSignalDetail } from "../../../features/risk/server/risk";
import { RiskSignalDetail } from "../../../features/risk/components/RiskDetail";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ signalId: string }>;
}) {
  const identity = await requireAdminPage("fraud"),
    { signalId } = await params;
  let detail = null;
  try {
    detail = await riskSignalDetail(identity, signalId);
  } catch {}
  return (
    <RiskSignalDetail identity={identity} id={signalId} initial={detail} />
  );
}
