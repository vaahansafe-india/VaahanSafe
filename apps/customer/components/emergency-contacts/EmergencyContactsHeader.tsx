"use client";

import React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

interface EmergencyContactsHeaderProps {
  onAddContact: () => void;
}

export function EmergencyContactsHeader({ onAddContact }: EmergencyContactsHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#cc785c]">
            Safety Network
          </div>
          <h1 className="mt-1 font-serif text-2xl sm:text-4xl font-medium tracking-tight text-foreground leading-tight">
            People who matter<br className="hidden sm:inline" /> when connection matters.
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground max-w-xl">
            Manage the contacts you choose to associate with your VaahanSafe safety identity.
          </p>
        </div>

        <button
          type="button"
          onClick={onAddContact}
          className="inline-flex h-9 sm:h-10 items-center justify-center gap-1.5 sm:gap-2 rounded-xl bg-[#cc785c] px-3 sm:px-4 font-mono text-[11px] sm:text-xs font-semibold uppercase tracking-[0.12em] sm:tracking-[0.14em] text-white shadow-xs transition-colors hover:bg-[#a9583e] active:scale-98 shrink-0"
        >
          <span className="text-sm sm:text-base font-bold leading-none">+</span>
          <span>Add Contact</span>
        </button>
      </div>

      {/* Authoritative Safety Boundary Banner */}
      <div className="flex items-start gap-2.5 sm:gap-3 rounded-2xl border border-[#cc785c]/30 bg-[#cc785c]/5 px-3.5 sm:px-4 py-3 text-xs leading-relaxed text-foreground">
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#cc785c]/15 text-[#cc785c] mt-0.5">
          <VaahanIcon name="shield" size={13} />
        </div>
        <div className="min-w-0">
          <strong className="font-mono uppercase tracking-wider text-[#cc785c]">
            Contact Option ≠ Emergency Dispatch:
          </strong>{" "}
          VaahanSafe connects your vehicle identity with your chosen contacts. In life-threatening emergencies, always dial official emergency services (112 / 108).
        </div>
      </div>
    </div>
  );
}
