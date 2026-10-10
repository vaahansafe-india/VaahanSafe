import { notFound } from "next/navigation";
import { requireAdminPage, AdminError } from "../../../lib/session";
import { getDistributorDetail } from "../../../features/distributors/server/distributors";
import { DistributorDetailWorkspace } from "../../../features/distributors/components/DistributorDetail";
export const dynamic = "force-dynamic";
export default async function DistributorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const identity = await requireAdminPage("distributors"),
    { id } = await params;
  let initial = null;
  try {
    initial = await getDistributorDetail(identity, id);
  } catch (e) {
    if (e instanceof AdminError && e.status === 404) notFound();
  }
  return (
    <DistributorDetailWorkspace id={id} identity={identity} initial={initial} />
  );
}
