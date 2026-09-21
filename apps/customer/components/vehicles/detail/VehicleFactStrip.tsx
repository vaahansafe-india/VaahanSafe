"use client";

import * as React from "react";
import type { VehicleDossierData } from "@/lib/vehicle-types";

interface VehicleFactStripProps {
  vehicle: VehicleDossierData;
}

export function VehicleFactStrip({ vehicle }: VehicleFactStripProps) {
  const facts = [
    {
      label: "VEHICLE TYPE",
      value: vehicle.type,
      sub: vehicle.year ? `Model ${vehicle.year}` : undefined,
    },
    {
      label: "RTO REGISTRATION",
      value: vehicle.registrationNumber,
      sub: "Normalized & Verified",
      isMono: true,
    },
    {
      label: "VAAHANSAFE ID",
      value: vehicle.identityId,
      sub: "Verified Identity Record",
      isMono: true,
      color: "text-[#5db8a6]",
    },
    {
      label: "QR LIFELINE",
      value: vehicle.qr.replacementPending
        ? `REPLACING (${vehicle.qr.replacementStatus || "PENDING"})`
        : vehicle.qr.status === "ACTIVATED"
        ? "ACTIVE"
        : vehicle.qr.status,
      sub: vehicle.qr.publicId ? `Code: VS-${vehicle.qr.publicId}` : "Unlinked Sticker",
      isMono: true,
      color: vehicle.qr.replacementPending
        ? "text-[#cc785c]"
        : vehicle.qr.status === "ACTIVE" || vehicle.qr.status === "ACTIVATED"
        ? "text-[#5db8a6]"
        : "text-[#e8a55a]",
    },
    {
      label: "SAFETY PROJECTION",
      value: vehicle.safety.status === "CONFIGURED" ? "CONFIGURED" : "NEEDS SETUP",
      sub: vehicle.safety.showOwnerName ? "Owner Name Visible" : "Masked Identity",
      color: vehicle.safety.status === "CONFIGURED" ? "text-[#5db8a6]" : "text-[#e8a55a]",
    },
    {
      label: "EMERGENCY RELAY",
      value: `${vehicle.contacts.count} CONTACT${vehicle.contacts.count === 1 ? "" : "S"}`,
      sub: vehicle.contacts.primaryName ? `Primary: ${vehicle.contacts.primaryName}` : "No Contacts Configured",
      color: vehicle.contacts.count > 0 ? "text-[#5db8a6]" : "text-destructive",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 rounded-2xl border border-border bg-card p-4 shadow-2xs">
      {facts.map((fact) => (
        <div key={fact.label} className="space-y-1 p-2 border-r last:border-r-0 border-border/50">
          <div className="font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground">
            {fact.label}
          </div>
          <div
            className={`font-semibold text-xs truncate ${
              fact.isMono ? "font-mono" : ""
            } ${fact.color || "text-foreground"}`}
          >
            {fact.value}
          </div>
          {fact.sub && (
            <div className="text-[10px] text-muted-foreground truncate font-mono">
              {fact.sub}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
