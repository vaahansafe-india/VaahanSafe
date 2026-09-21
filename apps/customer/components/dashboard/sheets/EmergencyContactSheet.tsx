"use client";

import * as React from "react";
import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@vaahansafe/ui";
import type { DashboardEmergencyContact, DashboardVehicle } from "@/lib/dashboard-types";

interface EmergencyContactSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contacts: DashboardEmergencyContact[];
  vehicle: DashboardVehicle | null;
}

export function EmergencyContactSheet({
  open,
  onOpenChange,
  contacts,
  vehicle,
}: EmergencyContactSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-card p-4 sm:p-6">
        <SheetHeader className="border-b border-border pb-4 pr-12 text-left">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#5db8a6]">
            EMERGENCY RESPONDERS
          </div>
          <SheetTitle className="font-serif text-2xl font-medium text-foreground">
            Emergency Contacts
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Verified contacts notified via SMS and WhatsApp when {vehicle?.registrationNumber} QR is scanned in an emergency.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {contacts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#e8a55a]/40 bg-[#e8a55a]/5 p-6 text-center space-y-3">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8a55a]/20 text-[#e8a55a]">
                <VaahanIcon name="phone" size={20} />
              </div>
              <div>
                <h4 className="font-mono text-xs font-bold uppercase text-foreground">
                  No Contacts Configured
                </h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Your safety identity cannot dispatch emergency alerts until you add at least one priority contact.
                </p>
              </div>
              <Link
                href="/emergency-contacts"
                onClick={() => onOpenChange(false)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#cc785c] px-4 py-2 font-mono text-xs font-semibold text-white"
              >
                <span>Add First Contact →</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                CONFIGURED ALERT RECIPIENTS ({contacts.length})
              </div>

              <div className="divide-y divide-border rounded-xl border border-border bg-card">
                {contacts.map((c, idx) => (
                  <div key={c.id} className="p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-foreground">
                          {c.name}
                        </span>
                        {c.isPriority && (
                          <span className="rounded bg-[#5db8a6]/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#5db8a6]">
                            PRIORITY 1
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[10px] text-muted-foreground uppercase">
                        {c.relationship}
                      </span>
                    </div>

                    <div className="flex items-center justify-between font-mono text-xs text-muted-foreground">
                      <span>{c.phone}</span>
                      <span className="text-[10px] text-[#5db8a6]">
                        {c.allowCall && c.allowMessage ? "CALL & SMS" : c.allowCall ? "CALL ONLY" : "SMS ONLY"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 pt-4 border-t border-border">
            <Link
              href="/emergency-contacts"
              onClick={() => onOpenChange(false)}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#cc785c] py-2.5 text-xs font-semibold text-white hover:bg-[#a9583e]"
            >
              <VaahanIcon name="phone" size={13} />
              <span>Manage Emergency Contacts</span>
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
