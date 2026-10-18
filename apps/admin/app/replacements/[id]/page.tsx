import { requireAdminPage } from "../../../lib/session";
import { replacementDetail } from "../../../features/replacements/server/replacements";
import { ReplacementDetailView } from "../../../features/replacements/components/ReplacementDetail";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const identity = await requireAdminPage("replacements"),
    { id } = await params;
  let initial = null;
  try {
    initial = await replacementDetail(identity, id);
  } catch {}
  return (
    <ReplacementDetailView identity={identity} id={id} initial={initial} />
  );
}
