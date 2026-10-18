import { redirect } from "next/navigation";
import { requireAdminPage } from "../../../lib/session";
import { ReconciliationCreate } from "../../../features/reconciliation/components/ReconciliationCreate";
export const dynamic = "force-dynamic";
export default async function Page() {
  const identity = await requireAdminPage("reconciliation");
  if (!["SUPER_ADMIN", "OPS_ADMIN"].includes(identity.role))
    redirect("/access-denied");
  return <ReconciliationCreate identity={identity} />;
}
