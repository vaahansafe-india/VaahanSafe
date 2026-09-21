import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedCustomer } from "@/lib/session";
import { getQrCodesRegistry } from "@/lib/qr-service";
import { QrRegistryExperience } from "@/components/qr/registry/QrRegistryExperience";

export const metadata: Metadata = {
  title: "QR Codes Registry — VaahanSafe Automotive Safety",
  description:
    "View and inspect all active QR codes linked to your vehicle safety identities.",
};

export default async function QrCodesListPage() {
  const auth = await getAuthenticatedCustomer();

  if (!auth) {
    redirect("/login");
  }

  const data = await getQrCodesRegistry(auth.user.id);

  return <QrRegistryExperience initialItems={data.items} />;
}
