import { requireAdminPage } from "../../../lib/session";
import { ReconciliationDetailView } from "../../../features/reconciliation/components/ReconciliationDetail";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const identity = await requireAdminPage("reconciliation");
  return (
    <ReconciliationDetailView identity={identity} id={(await params).id} />
  );
}
