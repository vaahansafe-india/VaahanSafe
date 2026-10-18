import Link from "next/link";
import { notFound } from "next/navigation";
import { VaahanIcon } from "@vaahansafe/icons";
import { requireAdminPage } from "../../../lib/session";
import { getBatchDetail } from "../../../features/batches/server/read-batches";
import { BatchDetailWorkspace } from "../../../features/batches/components/BatchDetailWorkspace";

export const dynamic = "force-dynamic";

export default async function BatchDetailPage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const identity = await requireAdminPage("batches");
  const { batchId } = await params;

  let detail = null;
  try {
    detail = await getBatchDetail(identity, batchId);
  } catch {
    notFound();
  }

  return (
    <div className="batches-workspace batches-full-detail">
      <Link href="/batches" className="batches-back-link">
        <VaahanIcon name="arrow-left" size={13} className="shrink-0" />
        <span>Batches</span>
      </Link>
      <BatchDetailWorkspace identity={identity} detail={detail} />
    </div>
  );
}
