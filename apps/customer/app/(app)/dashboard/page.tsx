import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedCustomer } from "@/lib/session";
import { getDashboardOverview } from "@/lib/dashboard-service";
import { DashboardController } from "@/components/dashboard/DashboardController";
import { DashboardErrorState } from "@/components/dashboard/states/DashboardErrorState";
import type { DashboardFilterState } from "@/lib/dashboard-types";

export const metadata: Metadata = {
  title: "Vehicle Identity Command Surface — VaahanSafe",
  description:
    "Authoritative vehicle identity, active QR safety stickers, emergency response network, and real-time scan intelligence.",
};
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{
    vehicle?: string;
    range?: string;
    qr?: string;
    type?: string;
  }>;
}

export default async function CustomerDashboardPage({ searchParams }: PageProps) {
  const auth = await getAuthenticatedCustomer();

  if (!auth) {
    redirect("/login");
  }

  const resolvedParams = await searchParams;
  const vehicleId = resolvedParams.vehicle;
  const range = (resolvedParams.range as DashboardFilterState["range"]) || "30d";
  const qrId = resolvedParams.qr;
  const eventType = resolvedParams.type;

  try {
    const data = await getDashboardOverview(
      {
        id: auth.user.id,
        name: auth.user.name,
        phone: auth.user.phone,
        email: auth.user.email,
      },
      vehicleId,
      {
        range,
        qrId,
        eventType,
      }
    );

    return <DashboardController initialData={data} />;
  } catch (err) {
    console.error("[VaahanSafe Customer Dashboard] Operational query error:", err);
    return <DashboardErrorState />;
  }
}
