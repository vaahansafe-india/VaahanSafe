import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedCustomer } from "@/lib/session";
import { getQrOverview } from "@/lib/qr-service";
import { QrOverviewController } from "@/components/qr/overview/QrOverviewController";

export const metadata: Metadata = {
  title: "My QR Hub — VaahanSafe QR Identity Center",
  description:
    "Authoritative vehicle QR safety identity, physical UV sticker tracking, digital pass, and lifecycle services.",
};

export default async function MyQrPage() {
  const auth = await getAuthenticatedCustomer();

  if (!auth) {
    redirect("/login");
  }

  const overview = await getQrOverview(auth.user.id);

  return <QrOverviewController overview={overview} />;
}
