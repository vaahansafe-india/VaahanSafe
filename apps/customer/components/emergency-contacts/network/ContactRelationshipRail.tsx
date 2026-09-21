"use client";

import React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

interface ContactRelationshipRailProps {
  ownerName?: string;
  vehiclePlate?: string;
  contactName: string;
  isPubliclyAvailable: boolean;
  className?: string;
}

/**
 * Visual vertical relationship rail demonstrating the authoritative safety pipeline:
 * OWNER ● ─── VEHICLE ● ─── CONTACT ● ─── PUBLIC SAFETY VIEW (● or ○)
 */
export function ContactRelationshipRail({
  ownerName = "Account Owner",
  vehiclePlate = "Connected Vehicles",
  contactName,
  isPubliclyAvailable,
  className = "",
}: ContactRelationshipRailProps) {
  return (
    <div className={`rounded-2xl border border-border/70 bg-card p-4 text-xs ${className}`}>
      <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#cc785c] mb-3">
        Safety Architecture Pipeline
      </div>

      <div className="relative pl-6 space-y-4">
        {/* Continuous connector line */}
        <div className="absolute left-2.5 top-2.5 bottom-2.5 w-0.5 bg-border/80" />

        {/* 1. Owner Node */}
        <div className="relative flex items-center gap-3">
          <div className="absolute -left-6 flex h-5 w-5 items-center justify-center rounded-full border border-[#cc785c] bg-[#cc785c] text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              01 Private Account
            </div>
            <div className="font-medium text-foreground">{ownerName}</div>
          </div>
        </div>

        {/* 2. Vehicle Node */}
        <div className="relative flex items-center gap-3">
          <div className="absolute -left-6 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-background text-foreground">
            <VaahanIcon name="vehicle" size={11} className="text-[#cc785c]" />
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              02 Vehicle Identity
            </div>
            <div className="font-mono font-medium text-foreground">{vehiclePlate}</div>
          </div>
        </div>

        {/* 3. Contact Node */}
        <div className="relative flex items-center gap-3">
          <div className="absolute -left-6 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-background text-foreground">
            <VaahanIcon name="user" size={11} className="text-foreground" />
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              03 Safety Contact
            </div>
            <div className="font-medium text-foreground">{contactName}</div>
          </div>
        </div>

        {/* 4. Public Safety View Node */}
        <div className="relative flex items-center gap-3">
          <div
            className={`absolute -left-6 flex h-5 w-5 items-center justify-center rounded-full border transition-colors ${
              isPubliclyAvailable
                ? "border-[#5db8a6] bg-[#5db8a6] text-white"
                : "border-border bg-muted/40 text-muted-foreground"
            }`}
          >
            {isPubliclyAvailable ? (
              <VaahanIcon name="check" size={10} className="text-white" />
            ) : (
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
            )}
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              04 Public Safety View
            </div>
            <div
              className={`text-xs font-medium ${
                isPubliclyAvailable ? "text-[#5db8a6]" : "text-muted-foreground"
              }`}
            >
              {isPubliclyAvailable
                ? "Available via QR Scan (Mediated Relay)"
                : "Restricted (Private to Owner Account)"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
