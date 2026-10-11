import { requireAdminPage } from "../../../lib/session";
import { transferDetail } from "../../../features/transfers/server/transfers";
import { TransferDetail } from "../../../features/transfers/components/TransferDetail";
export const dynamic = "force-dynamic";
export default async function TransferPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const identity = await requireAdminPage("transfers"),
    { id } = await params;
  let initial = null;
  try {
    initial = await transferDetail(identity, id);
  } catch {
    /* Client provides a recoverable, isolated detail error. */
  }
  return <TransferDetail identity={identity} id={id} initial={initial} />;
}
