"use client";
import type { DashboardVehicle, DashboardQrSticker } from "@/lib/dashboard-types";

export function VehicleSummary({ vehicle, qrSticker, onManageIdentity, onViewQr }: {
  vehicle: DashboardVehicle; qrSticker: DashboardQrSticker | null; onManageIdentity: () => void; onViewQr: () => void;
}) {
  return <section className="paper-section">
    <div className="flex flex-wrap items-start justify-between gap-5">
      <div>
        <p className="paper-label">Your vehicle</p>
        <h2 className="mt-3 break-all font-mono text-3xl sm:text-4xl">{vehicle.registrationNumber}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{[vehicle.make, vehicle.model].filter(Boolean).join(" ") || "Vehicle details not added"}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={onManageIdentity} className="paper-action">Manage vehicle</button>
        <button onClick={onViewQr} className="paper-action paper-action-primary">{qrSticker ? "View QR details" : "Set up QR"} →</button>
      </div>
    </div>
    <dl className="mt-6 grid grid-cols-2 gap-5 border-t border-border pt-5 sm:grid-cols-3">
      <div><dt className="paper-label">Vehicle type</dt><dd className="mt-2 text-sm capitalize">{vehicle.type.toLowerCase()}</dd></div>
      <div><dt className="paper-label">Vehicle status</dt><dd className="mt-2 text-sm capitalize">{vehicle.status.toLowerCase().replaceAll("_", " ")}</dd></div>
      <div><dt className="paper-label">QR status</dt><dd className="mt-2 text-sm capitalize">{qrSticker ? qrSticker.status.toLowerCase().replaceAll("_", " ") : "Not connected"}</dd></div>
    </dl>
  </section>;
}
