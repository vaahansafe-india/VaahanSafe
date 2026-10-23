import Link from "next/link";
export default function ParkingMapNotFound() {
  return (
    <main className="park-workspace park-map-page-error">
      <span className="park-eyebrow">PARK / YOUR SAVED PLACES</span>
      <h1>This place isn’t available.</h1>
      <p>
        It may have been removed, or it isn’t part of your parking notebook.
      </p>
      <Link href="/park" className="park-button">
        Back to notebook
      </Link>
    </main>
  );
}
