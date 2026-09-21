import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedCustomer } from "@/lib/session";
import { getVehicleRegistry } from "@/lib/vehicle-service";
import { VehicleRegistry } from "@/components/vehicles/VehicleRegistry";

export const metadata: Metadata = {
  title: "Vehicles — VaahanSafe Vehicle Identity Registry",
  description:
    "Manage your registered vehicles, view active QR assignments, configure emergency projection, and audit safety relationships.",
};

export default async function CustomerVehiclesPage() {
  const auth = await getAuthenticatedCustomer();
  if (!auth) {
    redirect("/login");
  }

  // Authoritative server query directly from Cloudflare D1
  const registry = await getVehicleRegistry(auth.user.id);

  return (
    <div className="w-full max-w-7xl mx-auto py-2">
      <VehicleRegistry
        initialItems={registry.items}
        totalCount={registry.totalCount}
      />
    </div>
  );
}
