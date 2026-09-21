import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedCustomer } from "@/lib/session";
import { getActivateQrData } from "@/lib/qr-service";
import { RetailScratchActivation } from "@/components/qr/activate/RetailScratchActivation";

export const metadata: Metadata = {
  title: "Activate Retail QR — VaahanSafe Automotive Safety",
  description:
    "Link a retail scratch card or dealer sticker pack to your vehicle safety identity.",
};

export default async function ActivateQrPage() {
  const auth = await getAuthenticatedCustomer();

  if (!auth) {
    redirect("/login");
  }

  const data = await getActivateQrData(auth.user.id);

  return <RetailScratchActivation data={data} />;
}
