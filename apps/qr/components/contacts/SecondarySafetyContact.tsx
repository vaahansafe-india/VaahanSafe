import React from "react";
import { ContactAction } from "./ContactAction";
import type { PublicEmergencyContact } from "@vaahansafe/qr-core";

export interface SecondarySafetyContactProps {
  contact: PublicEmergencyContact;
  index: number;
  publicId?: string;
}

export function SecondarySafetyContact({
  contact,
  index,
  publicId,
}: SecondarySafetyContactProps) {
  return (
    <div className="flex w-full flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="space-y-0.5 min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="block break-words text-base font-semibold text-foreground">
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

      <ContactAction
        phone={contact.phone}
        isPrimary={false}
        label="Call"
        allowCall={contact.allowCall}
        allowMessage={contact.allowMessage}
        publicId={publicId}
      />
    </div>
  );
}
