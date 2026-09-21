import React from "react";
import { ContactAction } from "./ContactAction";
import type { PublicEmergencyContact } from "@vaahansafe/qr-core";

export interface SecondarySafetyContactProps {
  contact: PublicEmergencyContact;
  index: number;
}

export function SecondarySafetyContact({ contact, index }: SecondarySafetyContactProps) {
  return (
    <div className="w-full p-3.5 rounded-xl bg-card border border-border/70 flex items-center justify-between gap-3 shadow-xs">
      <div className="space-y-0.5 min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-foreground truncate block">
            {contact.name}
          </span>
          <span className="font-mono text-[9px] text-muted-foreground uppercase">
            Contact #{index + 2}
          </span>
        </div>
        <p className="text-xs text-muted-foreground capitalize truncate">
          {contact.relationship}
        </p>
      </div>

      <ContactAction phone={contact.phone} isPrimary={false} label="Call" />
    </div>
  );
}
