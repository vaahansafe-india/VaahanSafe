import React from "react";
import { Badge } from "@vaahansafe/ui/components";
import { ContactAction } from "./ContactAction";
import type { PublicEmergencyContact } from "@vaahansafe/qr-core";

export interface PrimarySafetyContactProps {
  contact: PublicEmergencyContact;
}

export function PrimarySafetyContact({ contact }: PrimarySafetyContactProps) {
  return (
    <div className="w-full p-4 rounded-xl bg-card border border-border/80 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Primary Emergency Contact
        </span>
        <Badge
          variant="outline"
          className="font-mono text-[9px] uppercase tracking-wider text-emerald-700 dark:text-emerald-400 border-emerald-600/30 bg-emerald-500/5 px-2 py-0.5"
        >
          Priority 1
        </Badge>
      </div>

      <div>
        <h3 className="text-base font-semibold text-foreground tracking-tight">
          {contact.name}
        </h3>
        <p className="text-xs text-muted-foreground capitalize mt-0.5">
          {contact.relationship}
        </p>
      </div>

      <ContactAction phone={contact.phone} isPrimary label="Call Primary Contact" />
    </div>
  );
}
