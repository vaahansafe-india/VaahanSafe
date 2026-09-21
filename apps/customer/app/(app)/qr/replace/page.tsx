import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedCustomer } from "@/lib/session";
import { getReplaceQrData } from "@/lib/qr-service";
import { QrReplacementExperience } from "@/components/qr/replace/QrReplacementExperience";

export const metadata: Metadata = {
  title: "Replace QR Sticker — VaahanSafe Automotive Safety",
  description:
    "Request a replacement for a faded, damaged, or lost vehicle QR sticker.",
};

interface ReplaceQrPageProps {
  searchParams: Promise<{
    id?: string;
  }>;
}

export default async function ReplaceQrPage({ searchParams }: ReplaceQrPageProps) {
  const auth = await getAuthenticatedCustomer();

  if (!auth) {
    redirect("/login");
  }

  const { id } = await searchParams;
  const data = await getReplaceQrData(auth.user.id);

  return <QrReplacementExperience data={data} preselectedStickerId={id} />;
}
