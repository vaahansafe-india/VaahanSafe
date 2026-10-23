import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAuthenticatedCustomer } from "@/lib/session";
import { getParkingStop } from "@/features/park/server";
import { ParkError, parkingDirectionsUrl } from "@/features/park/model";
import { ParkMap } from "@/features/park/ParkMap";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Your parking map — Park by VaahanSafe",
};
export default async function ParkingMapPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const auth = await getAuthenticatedCustomer();
  if (!auth)
    redirect(`/login?returnUrl=${encodeURIComponent(`/park/map/${id}`)}`);
  if (!auth.phoneVerified) redirect("/onboarding/phone");
  let stop;
  try {
    stop = await getParkingStop(id);
  } catch (error) {
    if (error instanceof ParkError && error.code === "UNAUTHORIZED")
      redirect(`/login?returnUrl=${encodeURIComponent(`/park/map/${id}`)}`);
    if (error instanceof ParkError && error.code === "PHONE_REQUIRED")
      redirect("/onboarding/phone");
    if (
      error instanceof ParkError &&
      ["INVALID_INPUT", "NOT_FOUND"].includes(error.code)
    )
      notFound();
    console.warn("[Park] Map page unavailable");
    return (
      <main className="park-workspace park-map-page-error">
        <span className="park-eyebrow">PARK / YOUR SAVED PLACES</span>
        <h1>Your place is still yours.</h1>
        <p>We couldn’t open this parking record right now. Please try again.</p>
        <a className="park-button" href={`/park/map/${encodeURIComponent(id)}`}>
          Try again
        </a>
        <Link href="/park">Back to notebook</Link>
      </main>
    );
  }
  const { session, vehicle } = stop;
  return (
    <main className="park-workspace park-atlas-page">
      <ParkMap
        id={session.id}
        place={session.place_name}
        accuracy={session.accuracy_m}
        floor={session.floor_label}
        bay={session.bay_label}
        directionsUrl={parkingDirectionsUrl(
          session.latitude,
          session.longitude,
        )}
        fullPage
        session={session}
        vehicle={vehicle.registration_number}
      />
    </main>
  );
}
