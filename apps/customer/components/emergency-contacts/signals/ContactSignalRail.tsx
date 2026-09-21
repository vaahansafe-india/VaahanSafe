"use client";

import React from "react";
import type { ContactSignalRailData } from "@/lib/contacts-types";
import { ContactSignal } from "./ContactSignal";

interface ContactSignalRailProps {
  signals: ContactSignalRailData;
  className?: string;
}

function formatDate(isoString: string | null): string {
  if (!isoString) return "Not updated";
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).toUpperCase();
  } catch {
    return "Recent";
  }
}

export function ContactSignalRail({ signals, className = "" }: ContactSignalRailProps) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-y-2 rounded-2xl border border-border/80 bg-card/60 px-2 py-2 shadow-2xs backdrop-blur-xs divide-y sm:divide-y-0 sm:divide-x divide-border/60 ${className}`}
    >
      <ContactSignal
        label="Total Contacts"
        value={signals.totalContacts}
        hint={signals.totalContacts === 1 ? "contact" : "contacts"}
        className="flex-1 min-w-[120px]"
      />

      <ContactSignal
        label="Public Safety View"
        value={
          <span className={signals.publiclyAvailable > 0 ? "text-[#5db8a6]" : "text-muted-foreground"}>
            {signals.publiclyAvailable}
          </span>
        }
        hint="enabled"
        className="flex-1 min-w-[130px]"
      />

      <ContactSignal
        label="Primary Contact"
        value={
          signals.primaryContactName ? (
            <span className="truncate max-w-[140px] text-[#cc785c]">
              {signals.primaryContactName}
            </span>
          ) : (
            <span className="text-muted-foreground font-normal text-xs">Unassigned</span>
          )
        }
        className="flex-1 min-w-[140px]"
      />

      <ContactSignal
        label="Vehicles Covered"
        value={`${signals.vehiclesCovered} / ${signals.totalVehicles}`}
        hint="active"
        className="flex-1 min-w-[120px]"
      />

      <ContactSignal
        label="Last Updated"
        value={formatDate(signals.lastUpdatedAt)}
        className="flex-1 min-w-[120px]"
      />
    </div>
  );
}
