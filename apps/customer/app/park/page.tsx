import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedCustomer } from "@/lib/session";
import { ParkWorkspace } from "@/features/park/ParkWorkspace";
import "@/features/park/park.css";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "My parking notebook — Park by VaahanSafe",
  robots: { index: false, follow: false },
};
export default async function ParkPage() {
  const auth = await getAuthenticatedCustomer();
  if (!auth) redirect("/login?returnUrl=%2Fpark");
  return <ParkWorkspace phoneVerified={auth.phoneVerified} />;
}
