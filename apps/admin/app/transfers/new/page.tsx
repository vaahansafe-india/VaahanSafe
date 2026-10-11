import { redirect } from "next/navigation";
import { requireAdminPage } from "../../../lib/session";
import { TransferCreate } from "../../../features/transfers/components/TransferCreate";
export const dynamic = "force-dynamic";
export default async function NewTransferPage() {
  const identity = await requireAdminPage("transfers");
  if (!["SUPER_ADMIN", "OPS_ADMIN"].includes(identity.role))
    redirect("/access-denied");
  return <TransferCreate identity={identity} />;
}
