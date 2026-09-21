"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { VaahanIcon } from "@vaahansafe/icons";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  Switch,
} from "@vaahansafe/ui";
import type { SafetyContactItem, VehicleOption } from "@/lib/contacts-types";
import { ContactRoleMark } from "../roles/ContactRoleMark";
import { ContactRelationshipRail } from "../network/ContactRelationshipRail";
import { toggleContactVisibilityAction } from "@/lib/contacts-actions";

interface ContactDetailsSheetProps {
  contact: SafetyContactItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicles: VehicleOption[];
  onEdit: (contact: SafetyContactItem) => void;
  onSetPrimary: (contact: SafetyContactItem) => void;
  onRemove: (contact: SafetyContactItem) => void;
  onSuccess: () => void;
}

export function ContactDetailsSheet({
  contact,
  open,
  onOpenChange,
  vehicles,
  onEdit,
  onSetPrimary,
  onRemove,
  onSuccess,
}: ContactDetailsSheetProps) {
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);

  if (!contact) return null;

  const handleToggleVisibility = async (newVal: boolean) => {
    setIsUpdatingVisibility(true);
    try {
      const res = await toggleContactVisibilityAction(contact.id, newVal);
      if (res.success) {
        toast.success(
          newVal
            ? "Contact is now available through public safety view."
            : "Contact hidden from public safety view."
        );
        onSuccess();
      } else {
        toast.error(res.error || "We couldn't update safety-view preference.");
      }
    } catch {
      toast.error("Failed to update visibility preference.");
    } finally {
      setIsUpdatingVisibility(false);
    }
  };

  const primaryVehicle = vehicles[0];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl p-0 flex flex-col justify-between bg-background border-l border-border"
      >
        {/* Sticky Header */}
        <div className="p-6 pr-16 border-b border-border/70 bg-card/60">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#cc785c]">
              Contact Identity Record
            </span>
            {contact.isPrimary && (
              <span className="rounded-full bg-[#cc785c]/15 px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#cc785c]">
                PRIMARY CONTACT
              </span>
            )}
          </div>

          <div className="mt-4 flex items-center gap-4">
            <ContactRoleMark role={contact.role} size="lg" isPrimary={contact.isPrimary} />
            <div className="min-w-0 flex-1">
              <SheetHeader className="text-left p-0 space-y-0.5">
                <SheetTitle className="font-serif text-2xl font-medium text-foreground truncate">
                  {contact.name}
                </SheetTitle>
                <SheetDescription className="font-mono text-xs text-muted-foreground uppercase">
                  {contact.relationshipLabel} &bull; {contact.maskedPhone}
                </SheetDescription>
              </SheetHeader>
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. Visual Relationship Rail */}
          <ContactRelationshipRail
            contactName={contact.name}
            vehiclePlate={
              contact.associatedVehicles.length > 0
                ? contact.associatedVehicles.map((v) => v.maskedPlate).join(", ")
                : primaryVehicle
                ? primaryVehicle.maskedPlate
                : "Active Vehicles"
            }
            isPubliclyAvailable={contact.isPubliclyAvailable}
          />

          {/* 2. Public Safety View Toggle */}
          <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Privacy Control
                </span>
                <h4 className="text-xs font-semibold text-foreground">
                  Expose via Public Safety QR View
                </h4>
              </div>
              <Switch
                checked={contact.isPubliclyAvailable}
                disabled={isUpdatingVisibility}
                onCheckedChange={handleToggleVisibility}
              />
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              When enabled, people scanning your vehicle QR can initiate a privacy-protected relay call to this contact. Your real phone number remains masked.
            </p>
          </div>

          {/* 3. Associated Vehicles */}
          <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Associated Vehicles ({contact.associatedVehicles.length})
              </span>
              <span className="font-mono text-[10px] text-[#cc785c]">Active Coverage</span>
            </div>

            <div className="space-y-2">
              {contact.associatedVehicles.map((veh) => (
                <div
                  key={veh.vehicleId}
                  className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background text-[#cc785c] border border-border/60">
                      <VaahanIcon name="vehicle" size={14} />
                    </div>
                    <div>
                      <div className="font-mono text-xs font-bold text-foreground">
                        {veh.maskedPlate}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {veh.makeModel}
                      </div>
                    </div>
                  </div>

                  <span className="font-mono text-[10px] text-muted-foreground">
                    Priority 0{veh.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Capabilities / Notification Permissions */}
          <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-2">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Emergency Notification Channels
            </span>

            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              <div className="flex items-center gap-2 rounded-xl bg-muted/20 p-2.5">
                <VaahanIcon name="check" size={13} className="text-[#5db8a6]" />
                <span className="font-mono text-[11px] text-foreground">SMS Incident Alerts</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-muted/20 p-2.5">
                <VaahanIcon name="check" size={13} className="text-[#5db8a6]" />
                <span className="font-mono text-[11px] text-foreground">WhatsApp Incident Ping</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Actions Footer */}
        <div className="p-4 sm:p-6 border-t border-border/70 bg-card/60 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                onEdit(contact);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3.5 py-2 font-mono text-xs font-semibold text-foreground hover:border-[#cc785c] hover:text-[#cc785c] transition-colors"
            >
              <VaahanIcon name="settings" size={13} />
              <span>Edit Details</span>
            </button>

            {!contact.isPrimary && (
              <button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  onSetPrimary(contact);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#cc785c]/40 bg-[#cc785c]/10 px-3.5 py-2 font-mono text-xs font-semibold text-[#cc785c] hover:bg-[#cc785c]/20 transition-colors"
              >
                <VaahanIcon name="shield" size={13} />
                <span>Set as Primary</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              onOpenChange(false);
              onRemove(contact);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#c64545]/30 bg-[#c64545]/10 px-3.5 py-2 font-mono text-xs font-semibold text-[#c64545] hover:bg-[#c64545]/20 transition-colors"
          >
            <VaahanIcon name="close" size={13} />
            <span>Remove</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
