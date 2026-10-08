import { notFound } from "next/navigation";
import { requireAdminPage } from "../../lib/session";
import { getAdminModule } from "../../lib/modules";
import { listAdminRecords } from "../../lib/operations";
import { OperationsWorkspace } from "../../components/OperationsWorkspace";
export const dynamic = "force-dynamic";
export default async function ModulePage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module } = await params;
  const m = getAdminModule(module);
  if (!m?.table) notFound();
  const identity = await requireAdminPage(module);
  let initial = null;
  let error = false;
  try {
    initial = await listAdminRecords(identity, module);
  } catch {
    error = true;
  }
  return (
    <OperationsWorkspace
      key={module}
      moduleKey={module}
      identity={identity}
      initial={initial}
      initialError={error}
    />
  );
}
