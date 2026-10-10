import React from "react";
import { Badge } from "@vaahansafe/ui/components/badge";
import { ContactAction } from "./ContactAction";
import type { PublicEmergencyContact } from "@vaahansafe/qr-core";

export interface PrimarySafetyContactProps {
  contact: PublicEmergencyContact;
  publicId?: string;
}

export function PrimarySafetyContact({ contact, publicId }: PrimarySafetyContactProps) {
  return (
    <div className="w-full space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          First contact
        </span>
        <Badge
          variant="outline"
          className="font-mono text-[9px] uppercase tracking-wider text-emerald-700 dark:text-emerald-400 border-emerald-600/30 bg-emerald-500/5 px-2 py-0.5"
        >
          Priority 1
        </Badge>
      </div>

      <div>
        <h3 className="break-words font-serif text-2xl leading-tight text-foreground">
          {contact.name}
        </h3>
        <p className="text-xs text-muted-foreground capitalize mt-0.5">
          {contact.relationship}
        </p>
      </div>

      <ContactAction phone={contact.phone} isPrimary label="Call contact" allowCall={contact.allowCall} allowMessage={contact.allowMessage} publicId={publicId} />
    </div>
  );
}
