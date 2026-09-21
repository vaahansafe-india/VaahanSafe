"use client";

import React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import type { VehicleOption } from "@/lib/contacts-types";

interface ContactsEmptyStateProps {
  vehicles: VehicleOption[];
  onAddContact: () => void;
  className?: string;
}

export function ContactsEmptyState({
  vehicles,
  onAddContact,
  className = "",
}: ContactsEmptyStateProps) {
  const primaryVehicle = vehicles[0];

  return (
    <div
      className={`relative flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 bg-card p-8 sm:p-12 text-center shadow-2xs ${className}`}
    >
      {/* Abstract Structural Diagram */}
      <div className="relative flex flex-col items-center">
        {/* Vehicle Identity Node */}
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[#cc785c] bg-background text-[#cc785c] shadow-xs">
          <VaahanIcon name="vehicle" size={24} />
        </div>
        <span className="mt-1.5 font-mono text-xs font-bold text-foreground">
          {primaryVehicle ? primaryVehicle.maskedPlate : "Vehicle Identity Node"}
        </span>

        {/* Rail connector */}
        <div className="my-2 h-8 w-0.5 border-l-2 border-dashed border-border" />

        {/* Add Contact Target Node */}
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-dashed border-[#cc785c]/60 bg-[#cc785c]/10 text-[#cc785c]">
          <VaahanIcon name="user" size={20} />
        </div>
        <span className="mt-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#cc785c]">
          Safety Contact Point
        </span>
      </div>

      <div className="mt-6 max-w-md">
        <h3 className="font-serif text-2xl font-medium tracking-tight text-foreground">
          Build your safety network.
        </h3>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Add someone you want associated with your VaahanSafe safety identity. Configured contacts receive priority incident alerts, vehicle location, and secure relay pings upon vehicle scan.
        </p>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
        <button
          type="button"
          onClick={onAddContact}
          className="inline-flex items-center gap-2 rounded-xl bg-[#cc785c] px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-white shadow-xs transition-colors hover:bg-[#a9583e]"
        >
          <span className="text-sm font-bold">+</span>
          <span>Add First Contact</span>
        </button>
      </div>
    </div>
  );
}
