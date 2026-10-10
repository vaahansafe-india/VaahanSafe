import { RetailerSkeleton } from "../../features/retailers/components/RetailerDetail";
export default function Loading() {
  return (
    <div className="dist-workspace">
      <header className="dist-header">
        <div>
          <p className="dist-eyebrow">Operations / Retail network</p>
          <h1>Retailers</h1>
        </div>
      </header>
      <RetailerSkeleton />
    </div>
  );
}
