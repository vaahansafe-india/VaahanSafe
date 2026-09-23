"use client";

import React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import type { SafetyContactItem, VehicleOption } from "@/lib/contacts-types";
import { ContactRoleMark } from "../roles/ContactRoleMark";

interface PrimaryContactPanelProps {
  primaryContact: SafetyContactItem | null;
  vehicles: VehicleOption[];
  onManageContact: (contact: SafetyContactItem) => void;
  onPreviewPublicView: () => void;
  onAddContact: () => void;
  className?: string;
}

export function PrimaryContactPanel({
  primaryContact,
  vehicles,
  onManageContact,
  onPreviewPublicView,
  onAddContact,
  className = "",
}: PrimaryContactPanelProps) {
  return (
    <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 ${className}`}>
      {/* 1. Primary Contact Card */}
      <div className="flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-5 shadow-2xs">
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#cc785c] truncate">
              Primary Safety Contact
            </span>
            <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-[#cc785c]/10 px-2 py-0.5 font-mono text-[9px] font-bold text-[#cc785c]">
              Priority 01
            </span>
          </div>

          {primaryContact ? (
            <div className="mt-4 flex items-start gap-3.5 sm:gap-4">
              <ContactRoleMark
                role={primaryContact.role}
                size="lg"
                isPrimary={true}
                className="shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-serif text-lg sm:text-2xl font-medium text-foreground leading-snug break-words">
                  {primaryContact.name}
                </h3>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                  <span className="font-mono font-semibold text-muted-foreground uppercase whitespace-nowrap">
                    {primaryContact.relationshipLabel}
                  </span>
                  <span className="text-muted-foreground/40">&bull;</span>
                  <span className="font-mono text-muted-foreground whitespace-nowrap font-medium">
                    {primaryContact.maskedPhone}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {primaryContact.isPubliclyAvailable ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#5db8a6]/15 px-2.5 py-0.5 font-mono text-[10px] font-medium text-[#5db8a6] whitespace-nowrap">
                      <VaahanIcon name="check" size={10} />
                      Available in Safety View
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground whitespace-nowrap">
                      Private (Not exposed on QR scan)
                    </span>
                  )}

                  <span className="font-mono text-[10px] text-muted-foreground whitespace-nowrap">
                    Linked to {primaryContact.associatedVehicles.length}{" "}
                    {primaryContact.associatedVehicles.length === 1 ? "vehicle" : "vehicles"}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex flex-col items-center justify-center py-4 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/30 text-muted-foreground">
                <VaahanIcon name="user" size={18} />
              </div>
              <div className="mt-2 text-xs font-medium text-foreground">
                No Primary Contact Designated
              </div>
              <p className="mt-0.5 max-w-[260px] text-[11px] text-muted-foreground">
                Assign a primary contact who should receive high-priority emergency notifications first.
              </p>
            </div>
          )}
        </div>

        <div className="mt-5 pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] text-muted-foreground whitespace-nowrap">
            Contact Option ≠ Emergency Dispatch
          </span>
          {primaryContact ? (
            <button
              type="button"
              onClick={() => onManageContact(primaryContact)}
              className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-[#cc785c] hover:underline whitespace-nowrap shrink-0"
            >
              <span>Manage Contact</span>
              <VaahanIcon name="arrow-right" size={11} />
            </button>
          ) : (
            <button
              type="button"
              onClick={onAddContact}
              className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-[#cc785c] hover:underline whitespace-nowrap shrink-0"
            >
              <span>+ Add Primary Contact</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Public Safety View Architecture & Preview Card */}
      <div className="flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-5 shadow-2xs">
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#5db8a6] truncate">
              Public Safety Experience
            </span>
            <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-[#5db8a6]/10 px-2 py-0.5 font-mono text-[9px] font-semibold text-[#5db8a6]">
              Mediated Privacy
            </span>
          </div>

          <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
            Contacts enabled for Public Safety View are accessible when someone scans your vehicle QR sticker. Raw phone numbers remain protected via secure relay.
          </p>

          <div className="mt-3 flex flex-wrap sm:flex-nowrap items-center justify-between gap-1 rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-xs font-mono">
            <span className="text-muted-foreground whitespace-nowrap text-[11px]">Account Storage</span>
            <span className="text-muted-foreground text-[10px] font-bold shrink-0">&rarr;</span>
            <span className="text-muted-foreground whitespace-nowrap text-[11px]">Owner Controls</span>
            <span className="text-muted-foreground text-[10px] font-bold shrink-0">&rarr;</span>
            <span className="text-[#5db8a6] font-semibold whitespace-nowrap text-[11px]">QR Relay View</span>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-[11px] text-muted-foreground whitespace-nowrap">
            {vehicles.length} {vehicles.length === 1 ? "Vehicle Registered" : "Vehicles Registered"}
          </span>
          <button
            type="button"
            onClick={onPreviewPublicView}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 font-mono text-xs font-semibold text-foreground transition-colors hover:border-[#5db8a6] hover:text-[#5db8a6] whitespace-nowrap shrink-0"
          >
            <VaahanIcon name="eye" size={12} />
            <span>Preview Public View</span>
          </button>
        </div>
      </div>
    </div>
  );
}
