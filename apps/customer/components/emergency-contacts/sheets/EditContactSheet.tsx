"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { VaahanIcon } from "@vaahansafe/icons";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  Switch,
  Checkbox,
} from "@vaahansafe/ui";
import type {
  SafetyContactItem,
  VehicleOption,
  UpdateContactInput,
  ContactRoleType,
} from "@/lib/contacts-types";
import { ContactRoleSelector } from "../roles/ContactRoleSelector";
import { ROLE_DEFINITIONS } from "../roles/ContactRoleIcon";
import { updateSafetyContactAction } from "@/lib/contacts-actions";

interface EditContactSheetProps {
  contact: SafetyContactItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicles: VehicleOption[];
  onSuccess: () => void;
}

export function EditContactSheet({
  contact,
  open,
  onOpenChange,
  vehicles,
  onSuccess,
}: EditContactSheetProps) {
  const [name, setName] = useState("");
  const [role, setRole] = useState<ContactRoleType>("PARENT");
  const [relationshipLabel, setRelationshipLabel] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>([]);
  const [isPrimary, setIsPrimary] = useState(false);
  const [isPubliclyAvailable, setIsPubliclyAvailable] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (contact && open) {
      setName(contact.name);
      setRole(contact.role);
      setRelationshipLabel(contact.relationshipLabel);
      setPhone(contact.phone);
      setSelectedVehicleIds(contact.associatedVehicles.map((v) => v.vehicleId));
      setIsPrimary(contact.isPrimary);
      setIsPubliclyAvailable(contact.isPubliclyAvailable);
    }
  }, [contact, open]);

  if (!contact) return null;

  const activeRoleDef = ROLE_DEFINITIONS.find((r) => r.type === role) ?? ROLE_DEFINITIONS[0]!;
  const displayLabel = relationshipLabel.trim() || activeRoleDef.label;

  const handleToggleVehicle = (vehicleId: string) => {
    if (selectedVehicleIds.includes(vehicleId)) {
      if (selectedVehicleIds.length === 1) {
        toast.error("At least one vehicle must remain selected.");
        return;
      }
      setSelectedVehicleIds(selectedVehicleIds.filter((id) => id !== vehicleId));
    } else {
      setSelectedVehicleIds([...selectedVehicleIds, vehicleId]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Contact name cannot be empty.");
      return;
    }
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (selectedVehicleIds.length === 0) {
      toast.error("At least one vehicle must be selected.");
      return;
    }

    setIsSubmitting(true);
    try {
      const input: UpdateContactInput = {
        contactId: contact.id,
        name: name.trim(),
        relationshipLabel: displayLabel,
        role,
        phone: phone.trim(),
        vehicleIds: selectedVehicleIds,
        isPrimary,
        isPubliclyAvailable,
      };

      const res = await updateSafetyContactAction(input);
      if (res.success) {
        toast.success("Contact details updated successfully.");
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(res.error || "Failed to update contact.");
      }
    } catch {
      toast.error("An unexpected error occurred while saving.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl p-0 flex flex-col justify-between bg-background border-l border-border"
      >
        <div className="p-6 pr-16 border-b border-border/70 bg-card/60">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#cc785c]">
            Edit Mode &bull; Safety Network
          </div>
          <SheetHeader className="mt-1 text-left">
            <SheetTitle className="font-serif text-2xl font-medium text-foreground">
              Edit Safety Contact
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Update relationship role, contact number, or vehicle associations.
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <form id="edit-contact-form" onSubmit={handleSave} className="space-y-6">
            {/* Full Name */}
            <div className="space-y-2">
              <label htmlFor="edit-name" className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Full Name
              </label>
              <input
                id="edit-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground focus:border-[#cc785c] focus:outline-none focus:ring-1 focus:ring-[#cc785c]"
              />
            </div>

            {/* Relationship Role */}
            <div className="space-y-2">
              <label className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Role Identity
              </label>
              <ContactRoleSelector
                selectedRole={role}
                onSelectRole={setRole}
              />
              <div className="pt-1">
                <label htmlFor="edit-custom-label" className="text-[11px] text-muted-foreground">
                  Custom Relationship Label
                </label>
                <input
                  id="edit-custom-label"
                  type="text"
                  value={relationshipLabel}
                  onChange={(e) => setRelationshipLabel(e.target.value)}
                  className="mt-1 h-9 w-full rounded-xl border border-input bg-background px-3 text-xs text-foreground focus:border-[#cc785c] focus:outline-none"
                />
              </div>
            </div>

            {/* Mobile Phone */}
            <div className="space-y-2">
              <label htmlFor="edit-phone" className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Mobile Number
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 font-mono text-xs font-semibold text-muted-foreground">
                  +91
                </span>
                <input
                  id="edit-phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-11 w-full rounded-xl border border-input bg-background pl-12 pr-3.5 font-mono text-sm text-foreground focus:border-[#cc785c] focus:outline-none focus:ring-1 focus:ring-[#cc785c]"
                />
              </div>
            </div>

            {/* Vehicle Association */}
            <div className="space-y-2">
              <label className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Vehicle Association
              </label>
              <div className="space-y-2 rounded-2xl border border-border/80 bg-muted/20 p-3">
                {vehicles.map((v) => {
                  const isChecked = selectedVehicleIds.includes(v.id);
                  return (
                    <label
                      key={v.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-colors ${
                        isChecked
                          ? "border-[#cc785c]/40 bg-background"
                          : "border-border/40 hover:bg-background/60"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => handleToggleVehicle(v.id)}
                        />
                        <div>
                          <div className="font-mono text-xs font-bold text-foreground">
                            {v.maskedPlate}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {v.makeModel}
                          </div>
                        </div>
                      </div>
                      <VaahanIcon name="vehicle" size={14} className="text-muted-foreground" />
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Public Safety View & Priority */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between rounded-2xl border border-border/80 bg-card p-3.5">
                <div className="space-y-0.5 pr-4">
                  <div className="text-xs font-semibold text-foreground">
                    Designate as Primary Contact
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Prioritizes this contact across all linked vehicles.
                  </div>
                </div>
                <Switch checked={isPrimary} onCheckedChange={setIsPrimary} />
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-border/80 bg-card p-3.5">
                <div className="space-y-0.5 pr-4">
                  <div className="text-xs font-semibold text-foreground">
                    Available in Public Safety QR View
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Allows passerby scan users to reach this contact via mediated relay.
                  </div>
                </div>
                <Switch
                  checked={isPubliclyAvailable}
                  onCheckedChange={setIsPubliclyAvailable}
                />
              </div>
            </div>
          </form>
        </div>

        <div className="p-4 sm:p-6 border-t border-border/70 bg-card/60 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="rounded-xl border border-input px-4 py-2.5 font-mono text-xs font-medium text-foreground hover:bg-muted/40 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-contact-form"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-xl bg-[#cc785c] px-6 py-2.5 font-mono text-xs font-semibold text-white hover:bg-[#a9583e] transition-colors shadow-xs disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <VaahanIcon name="loading" size={14} className="animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <span>Save Changes</span>
                <VaahanIcon name="check" size={14} />
              </>
            )}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
