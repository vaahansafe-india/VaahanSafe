import { requireAdminPage } from "../../../lib/session";
import { getInventoryDetail } from "../../../features/inventory/server/read-inventory";
import { InventoryDetailPage } from "../../../features/inventory/components/InventoryDetail";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const identity = await requireAdminPage("inventory"),
    { id } = await params;
  let initial = null;
  try {
    initial = await getInventoryDetail(identity, id);
  } catch {
    /* The client reports the recoverable detail error locally. */
  }
  return <InventoryDetailPage id={id} initial={initial} />;
}
