import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedCustomer } from "@/lib/session";
import { getScanHistoryOverview } from "@/lib/scan-history-service";
import { ScanHistoryController } from "@/components/scan-history/ScanHistoryController";
import { ScanHistoryErrorState } from "@/components/scan-history/states/ScanHistoryErrorState";
import type { ScanPeriodFilter } from "@/lib/scan-history-types";

export const metadata: Metadata = {
  title: "Scan Intelligence & Security Logs — VaahanSafe",
  description:
    "Review verified passerby encounters, emergency contact relays, and public safety view resolutions connected to your vehicle passes.",
};

interface ScanHistoryPageProps {
  searchParams: Promise<{
    period?: string;
    vehicle?: string;
    qr?: string;
    type?: string;
    device?: string;
    search?: string;
  }>;
}

export default async function ScanHistoryPage({ searchParams }: ScanHistoryPageProps) {
  const auth = await getAuthenticatedCustomer();
  if (!auth) {
    redirect("/login?returnUrl=%2Fscan-history");
  }

  const params = await searchParams;

  try {
    const data = await getScanHistoryOverview(auth.user.id, {
      period: (params.period as ScanPeriodFilter) || "30D",
      vehicleId: params.vehicle || "all",
      qrPublicId: params.qr || "all",
      eventType: (params.type as any) || "all",
      deviceCategory: (params.device as any) || "all",
      search: params.search || "",
    });

    return <ScanHistoryController initialData={data} />;
  } catch (err) {
    console.error("[VaahanSafe Scan History Page] Operational query error:", err);
    return <ScanHistoryErrorState />;
  }
}
