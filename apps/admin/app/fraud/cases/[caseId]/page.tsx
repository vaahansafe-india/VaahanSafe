import "../../../../features/risk/risk.css";
import { requireAdminPage } from "../../../../lib/session";
import { riskCaseDetail } from "../../../../features/risk/server/risk";
import { RiskCaseWorkspace } from "../../../../features/risk/components/RiskDetail";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const identity = await requireAdminPage("fraud"),
    { caseId } = await params;
  let detail = null;
  try {
    detail = await riskCaseDetail(identity, caseId);
  } catch {}
  return <RiskCaseWorkspace identity={identity} id={caseId} initial={detail} />;
}
