import { requireAdminPage } from "../../../../lib/session";
import { PrintJobPage } from "../../../../features/inventory/components/PrintDialog";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage("inventory");
  return <PrintJobPage id={(await params).id} />;
}
