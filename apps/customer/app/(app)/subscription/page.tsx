import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedCustomer } from "@/lib/session";
import { getSubscriptionServiceOverview } from "@/lib/subscription-service";
import { SubscriptionController } from "@/components/subscription/SubscriptionController";
import { SubscriptionErrorState } from "@/components/subscription/states/SubscriptionErrorState";

export const metadata: Metadata = {
  title: "Service & Coverage Center — VaahanSafe",
  description:
    "See the services connected to your vehicle identities, manage your plan, and understand what is currently enabled.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{
    vehicle?: string;
  }>;
}

export default async function SubscriptionPage({ searchParams }: PageProps) {
  const auth = await getAuthenticatedCustomer();

  if (!auth) {
    redirect("/login");
  }

  const resolvedParams = await searchParams;
  const scopedVehicleId = resolvedParams.vehicle;

  try {
    const data = await getSubscriptionServiceOverview(
      auth.user.id,
      {
        name: auth.user.name,
        email: auth.user.email,
        phone: auth.user.phone,
      },
      scopedVehicleId
    );

    return <SubscriptionController initialData={data} />;
  } catch (err) {
    console.error("[VaahanSafe Subscription Center] Operational query error:", err);
    return <SubscriptionErrorState />;
  }
}
