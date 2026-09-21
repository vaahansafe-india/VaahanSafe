import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedCustomer } from "@/lib/session";
import { getBuyQrData } from "@/lib/qr-service";
import { BuyQrExperience } from "@/components/qr/buy/BuyQrExperience";

export const metadata: Metadata = {
  title: "Buy QR Safety Kit — VaahanSafe Automotive Hardware",
  description:
    "Order genuine VaahanSafe physical QR stickers with industrial UV lamination and tamper protection.",
};

export default async function BuyQrPage() {
  const auth = await getAuthenticatedCustomer();

  if (!auth) {
    redirect("/login");
  }

  const data = await getBuyQrData(auth.user.id);

  return <BuyQrExperience data={data} />;
}
