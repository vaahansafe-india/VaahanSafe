import { ActivationCeremony } from "@/components/ActivationCeremony";

interface SlugPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ActivateSlugPage({ params }: SlugPageProps) {
  const { id } = await params;

  return <ActivationCeremony initialPublicId={id || ""} />;
}
