import { ActivationCeremony } from "@/components/ActivationCeremony";

interface ActivatePageProps {
  searchParams: Promise<{
    id?: string;
    publicId?: string;
  }>;
}

export default async function ActivatePage({ searchParams }: ActivatePageProps) {
  const { id, publicId } = await searchParams;
  const initialId = id || publicId || "";

  return <ActivationCeremony initialPublicId={initialId} />;
}
