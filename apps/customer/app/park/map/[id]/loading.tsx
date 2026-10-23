import { VaahanIcon } from "@vaahansafe/icons";
export default function ParkingMapLoading() {
  return (
    <main className="park-workspace park-map-page-error" role="status">
      <VaahanIcon name="compass" size={36} />
      <span className="park-eyebrow">PARK / YOUR SAVED PLACES</span>
      <h1>Opening your place.</h1>
      <p>Your map and the little details, together.</p>
    </main>
  );
}
