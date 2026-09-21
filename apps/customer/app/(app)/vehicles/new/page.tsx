import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedCustomer } from "@/lib/session";
import { AddVehicleForm } from "@/components/vehicles/forms/AddVehicleForm";

export const metadata: Metadata = {
  title: "Add Vehicle — VaahanSafe Vehicle Identity Registry",
  description:
    "Register a new vehicle to associate with your VaahanSafe cryptographic identity network.",
};

export default async function NewVehiclePage() {
  const auth = await getAuthenticatedCustomer();
  if (!auth) {
    redirect("/login");
  }

  return (
    <div className="w-full py-4">
      <AddVehicleForm />
    </div>
  );
}
