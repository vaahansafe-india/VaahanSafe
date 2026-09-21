import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedCustomer } from "@/lib/session";
import { getDigitalQrData } from "@/lib/qr-service";
import { DigitalQrPassExperience } from "@/components/qr/digital/DigitalQrPassExperience";

export const metadata: Metadata = {
  title: "Digital QR Pass — VaahanSafe Automotive Safety",
  description:
    "Smartphone-accessible vehicle identity pass and printable emergency placard.",
};

interface DigitalQrPageProps {
  searchParams: Promise<{
    id?: string;
  }>;
}

export default async function DigitalQrPage({ searchParams }: DigitalQrPageProps) {
  const auth = await getAuthenticatedCustomer();

  if (!auth) {
    redirect("/login");
  }

  const { id } = await searchParams;
  const data = await getDigitalQrData(auth.user.id, id);

  return <DigitalQrPassExperience data={data} />;
}
