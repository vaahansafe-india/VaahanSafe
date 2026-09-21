import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { VaahanIcon } from "@vaahansafe/icons";
import { getAuthenticatedCustomer } from "@/lib/session";
import { getVehicleDossier } from "@/lib/vehicle-service";
import { VehicleDossier } from "@/components/vehicles/detail/VehicleDossier";

interface VehicleDetailPageProps {
  params: Promise<{
    vehicleId: string;
  }>;
}

export async function generateMetadata({
  params,
}: VehicleDetailPageProps): Promise<Metadata> {
  const { vehicleId } = await params;
  return {
    title: `Vehicle Dossier (${vehicleId}) — VaahanSafe`,
    description:
      "Manage authoritative vehicle specifications, cryptographic QR lifeline relationships, and emergency contact visibility.",
  };
}

export default async function VehicleDetailPage({
  params,
}: VehicleDetailPageProps) {
  const auth = await getAuthenticatedCustomer();
  if (!auth) {
    redirect("/login");
  }

  const { vehicleId } = await params;

  // Authoritative D1 query scoped strictly by authorized ownership
  const vehicle = await getVehicleDossier(auth.user.id, vehicleId);

  if (!vehicle) {
    return (
      <div className="mx-auto max-w-xl py-12 text-center space-y-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <VaahanIcon name="vehicle" size={28} />
        </div>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-destructive">
            ASSET NOT FOUND
          </div>
          <h1 className="mt-1 font-serif text-2xl font-medium text-foreground">
            Vehicle not accessible
          </h1>
          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
            The requested vehicle identifier does not exist or you do not have permission to view its identity record.
          </p>
        </div>
        <div>
          <Link
            href="/vehicles"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-foreground text-background px-5 font-mono text-xs font-semibold uppercase tracking-wider hover:bg-[#cc785c] hover:text-white transition-colors"
          >
            <VaahanIcon name="arrow-left" size={13} />
            <span>Return to Registry</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-2">
      <VehicleDossier vehicle={vehicle} />
    </div>
  );
}
