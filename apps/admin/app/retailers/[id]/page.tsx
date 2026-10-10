import { requireAdminPage } from "../../../lib/session";
import { getRetailerDetail } from "../../../features/retailers/server/retailers";
import { RetailerDetail } from "../../../features/retailers/components/RetailerDetail";
export const dynamic = "force-dynamic";
export default async function RetailerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const identity = await requireAdminPage("retailers");
  return (
    <RetailerDetail
      identity={identity}
      initial={await getRetailerDetail(identity, (await params).id)}
    />
  );
}
