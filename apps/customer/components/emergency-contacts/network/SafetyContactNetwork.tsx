"use client";

import React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import type { SafetyContactItem, VehicleOption } from "@/lib/contacts-types";
import { ContactRoleMark } from "../roles/ContactRoleMark";

interface SafetyContactNetworkProps {
  contacts: SafetyContactItem[];
  vehicles: VehicleOption[];
  onSelectContact: (contact: SafetyContactItem) => void;
  onAddContact: () => void;
  className?: string;
}

interface NodePosition {
  x: number; // percentage from center (0 to 100)
  y: number; // percentage from center (0 to 100)
  labelAlign: "top" | "bottom" | "left" | "right";
}

/**
 * Deterministic node positions for up to 6 contacts around center (50%, 50%)
 */
function getNodePositions(count: number): NodePosition[] {
  if (count === 1) {
    return [{ x: 50, y: 16, labelAlign: "top" }];
  }
  if (count === 2) {
    return [
      { x: 18, y: 50, labelAlign: "left" },
      { x: 82, y: 50, labelAlign: "right" },
    ];
  }
  if (count === 3) {
    return [
      { x: 50, y: 16, labelAlign: "top" },
      { x: 20, y: 76, labelAlign: "bottom" },
      { x: 80, y: 76, labelAlign: "bottom" },
    ];
  }
  if (count === 4) {
    return [
      { x: 50, y: 16, labelAlign: "top" },
      { x: 84, y: 50, labelAlign: "right" },
      { x: 50, y: 84, labelAlign: "bottom" },
      { x: 16, y: 50, labelAlign: "left" },
    ];
  }
  if (count === 5) {
    return [
      { x: 50, y: 15, labelAlign: "top" },
      { x: 85, y: 40, labelAlign: "right" },
      { x: 72, y: 84, labelAlign: "bottom" },
      { x: 28, y: 84, labelAlign: "bottom" },
      { x: 15, y: 40, labelAlign: "left" },
    ];
  }
  // 6+ contacts
  return [
    { x: 50, y: 14, labelAlign: "top" },
    { x: 84, y: 32, labelAlign: "right" },
    { x: 84, y: 68, labelAlign: "right" },
    { x: 50, y: 86, labelAlign: "bottom" },
    { x: 16, y: 68, labelAlign: "left" },
    { x: 16, y: 32, labelAlign: "left" },
  ];
}

export function SafetyContactNetwork({
  contacts,
  vehicles,
  onSelectContact,
  onAddContact,
  className = "",
}: SafetyContactNetworkProps) {
  const displayContacts = contacts.slice(0, 6);
  const positions = getNodePositions(displayContacts.length);
  const primaryVehicle = vehicles[0];

  if (contacts.length === 0) {
    return (
      <div
        className={`relative flex h-[340px] w-full flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 bg-[#f5f0e8]/40 p-6 text-center dark:bg-[#181715]/40 ${className}`}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card text-[#cc785c] shadow-xs">
          <VaahanIcon name="vehicle" size={24} />
        </div>
        <div className="mt-3 font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
          {primaryVehicle ? primaryVehicle.maskedPlate : "Vehicle Safety Node"}
        </div>
        <p className="mt-1 max-w-[240px] text-xs text-muted-foreground">
          No contacts associated yet. Add your first safety contact to form your network.
        </p>
        <button
          type="button"
          onClick={onAddContact}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#cc785c] px-3.5 py-2 font-mono text-xs font-medium text-white transition-colors hover:bg-[#a9583e]"
        >
          <span>+ Add First Contact</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className={`relative h-[340px] w-full overflow-hidden rounded-3xl border border-border/70 bg-card/60 p-4 shadow-2xs backdrop-blur-xs ${className}`}
    >
      {/* Background SVG connecting rails */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full stroke-border text-border"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="networkCenterGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#cc785c" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#cc785c" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx="50%" cy="50%" r="130" fill="url(#networkCenterGlow)" />
        <circle cx="50%" cy="50%" r="90" fill="none" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
        <circle cx="50%" cy="50%" r="135" fill="none" strokeWidth="1" strokeDasharray="2 4" opacity="0.25" />

        {displayContacts.map((contact, idx) => {
          const pos = positions[idx];
          if (!pos) return null;
          return (
            <line
              key={contact.id}
              x1="50%"
              y1="50%"
              x2={`${pos.x}%`}
              y2={`${pos.y}%`}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray={contact.isPrimary ? "none" : "3 3"}
              className={contact.isPrimary ? "stroke-[#cc785c]/60" : "stroke-border"}
            />
          );
        })}
      </svg>

      {/* Center: Vehicle Safety Node */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#cc785c] bg-background text-[#cc785c] shadow-md ring-4 ring-[#cc785c]/15">
          <VaahanIcon name="vehicle" size={22} />
        </div>
        <div className="mt-1.5 flex flex-col items-center text-center">
          <span className="font-mono text-[11px] font-bold text-foreground">
            {primaryVehicle ? primaryVehicle.maskedPlate : "VAAHAN"}
          </span>
          <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
            Identity Center
          </span>
        </div>
      </div>

      {/* Radiating Contact Nodes */}
      {displayContacts.map((contact, idx) => {
        const pos = positions[idx];
        if (!pos) return null;

        return (
          <div
            key={contact.id}
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
            }}
            className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
          >
            <button
              type="button"
              onClick={() => onSelectContact(contact)}
              className="group flex flex-col items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#cc785c] rounded-2xl p-1 transition-transform hover:scale-105 active:scale-95"
            >
              <ContactRoleMark
                role={contact.role}
                size="md"
                isPrimary={contact.isPrimary}
              />
              <div className="mt-1 flex flex-col items-center text-center max-w-[84px]">
                <span className="truncate text-xs font-semibold text-foreground group-hover:text-[#cc785c] transition-colors">
                  {contact.name}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                  {contact.relationshipLabel}
                </span>
                {contact.isPrimary && (
                  <span className="mt-0.5 rounded-full bg-[#cc785c]/15 px-1.5 py-0.2 font-mono text-[8px] font-bold text-[#cc785c]">
                    PRIMARY
                  </span>
                )}
              </div>
            </button>
          </div>
        );
      })}

      {/* Overflow badge if more than 6 contacts */}
      {contacts.length > 6 && (
        <div className="absolute bottom-3 right-3 z-10 rounded-full border border-border bg-background/90 px-2 py-0.5 font-mono text-[10px] text-muted-foreground backdrop-blur-xs">
          +{contacts.length - 6} more in registry
        </div>
      )}
    </div>
  );
}
