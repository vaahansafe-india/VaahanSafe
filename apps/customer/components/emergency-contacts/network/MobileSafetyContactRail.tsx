"use client";

import React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import type { SafetyContactItem, VehicleOption } from "@/lib/contacts-types";
import { ContactRoleMark } from "../roles/ContactRoleMark";

interface MobileSafetyContactRailProps {
  contacts: SafetyContactItem[];
  vehicles: VehicleOption[];
  onSelectContact: (contact: SafetyContactItem) => void;
  onAddContact: () => void;
  className?: string;
}

export function MobileSafetyContactRail({
  contacts,
  vehicles,
  onSelectContact,
  onAddContact,
  className = "",
}: MobileSafetyContactRailProps) {
  const primaryVehicle = vehicles[0];

  return (
    <div
      className={`rounded-2xl border border-border/80 bg-card p-4 shadow-2xs ${className}`}
    >
      <div className="flex items-center justify-between pb-3 border-b border-border/60 mb-3">
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#cc785c]">
          Safety Contact Network
        </div>
        <button
          type="button"
          onClick={onAddContact}
          className="font-mono text-[11px] font-semibold text-[#cc785c] hover:underline"
        >
          + Add
        </button>
      </div>

      <div className="relative pl-7 space-y-4">
        {/* Continuous vertical connector line */}
        <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-border" />

        {/* Vehicle Identity Root Node */}
        <div className="relative flex items-center gap-3">
          <div className="absolute -left-7 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#cc785c] bg-background text-[#cc785c] shadow-xs ring-2 ring-[#cc785c]/20">
            <VaahanIcon name="vehicle" size={12} />
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-xs font-bold text-foreground">
              {primaryVehicle ? primaryVehicle.maskedPlate : "Vehicle Node"}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {primaryVehicle ? primaryVehicle.makeModel : "Registered Safety Identity"}
            </span>
          </div>
        </div>

        {/* Contact Nodes */}
        {contacts.length === 0 ? (
          <div className="py-2 text-xs text-muted-foreground">
            No contacts configured yet. Tap + Add to begin.
          </div>
        ) : (
          contacts.map((contact, idx) => {
            const indexNumber = String(idx + 1).padStart(2, "0");
            return (
              <div key={contact.id} className="relative flex items-center gap-3">
                <div className="absolute -left-7 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card">
                  <span className="font-mono text-[9px] font-bold text-muted-foreground">
                    {indexNumber}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectContact(contact)}
                  className="flex flex-1 items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-2.5 text-left transition-colors hover:border-[#cc785c]/40 hover:bg-muted/40"
                >
                  <div className="flex items-center gap-2.5">
                    <ContactRoleMark
                      role={contact.role}
                      size="sm"
                      isPrimary={contact.isPrimary}
                    />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-foreground">
                          {contact.name}
                        </span>
                        {contact.isPrimary && (
                          <span className="rounded bg-[#cc785c]/15 px-1.5 py-0.2 font-mono text-[8px] font-bold text-[#cc785c]">
                            PRIMARY
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {contact.relationshipLabel} &bull; {contact.maskedPhone}
                      </span>
                    </div>
                  </div>

                  <VaahanIcon
                    name="chevron-right"
                    size={14}
                    className="text-muted-foreground shrink-0"
                  />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
