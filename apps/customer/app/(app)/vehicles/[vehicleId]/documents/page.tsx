import { DocumentVault } from "@/features/document-vault/DocumentVault";
import { customer, listDocuments } from "@/features/document-vault/server";
export const dynamic = "force-dynamic";
export default async function VehicleDocuments({
  params,
}: {
  params: Promise<{ vehicleId: string }>;
}) {
  await customer();
  const { vehicleId } = await params;
  return (
    <DocumentVault
      vehicleId={vehicleId}
      initialData={await listDocuments(
        new URLSearchParams({ vehicle: vehicleId }),
      )}
    />
  );
}
