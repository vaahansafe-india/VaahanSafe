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
  Checkbox,
} from "@vaahansafe/ui";
import type {
  ContactRoleType,
  VehicleOption,
  AddContactInput,
} from "@/lib/contacts-types";
import { ContactRoleSelector } from "../roles/ContactRoleSelector";
import { ContactRoleMark } from "../roles/ContactRoleMark";
import { ROLE_DEFINITIONS } from "../roles/ContactRoleIcon";
import { addSafetyContactAction } from "@/lib/contacts-actions";

interface AddContactSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicles: VehicleOption[];
  onSuccess: () => void;
}

export function AddContactSheet({
  open,
  onOpenChange,
  vehicles,
  onSuccess,
}: AddContactSheetProps) {
  const [step, setStep] = useState<"form" | "review">("form");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [role, setRole] = useState<ContactRoleType>("PARENT");
  const [relationshipLabel, setRelationshipLabel] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>(
    vehicles.map((v) => v.id)
  );
  const [isPrimary, setIsPrimary] = useState(false);
  const [isPubliclyAvailable, setIsPubliclyAvailable] = useState(true);

  // Reset when opened
  React.useEffect(() => {
    if (open) {
      setStep("form");
      setName("");
      setRole("PARENT");
      setRelationshipLabel("");
      setPhone("");
      setSelectedVehicleIds(vehicles.map((v) => v.id));
      setIsPrimary(false);
      setIsPubliclyAvailable(true);
    }
  }, [open, vehicles]);

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

  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter the contact's full name.");
      return;
    }
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (selectedVehicleIds.length === 0) {
      toast.error("Please select at least one vehicle.");
      return;
    }
    setStep("review");
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const input: AddContactInput = {
        name: name.trim(),
        relationshipLabel: displayLabel,
        role,
        phone: phone.trim(),
        vehicleIds: selectedVehicleIds,
        isPrimary,
        isPubliclyAvailable,
      };

      const res = await addSafetyContactAction(input);
      if (res.success) {
        toast.success("Contact added to your safety network.");
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(res.error || "We couldn't add this contact. Please try again.");
      }
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
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
        {/* Sticky Header */}
        <div className="p-6 pr-16 border-b border-border/70 bg-card/60">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#cc785c]">
            {step === "form" ? "Step 01 of 02" : "Step 02 of 02"} &bull; Safety Identity
          </div>
          <SheetHeader className="mt-1 text-left">
            <SheetTitle className="font-serif text-2xl font-medium text-foreground">
              {step === "form" ? "Add Safety Contact" : "Review Safety Contact"}
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              {step === "form"
                ? "Add someone you want associated with your VaahanSafe safety identity."
                : "Confirm the contact role, vehicle permissions, and public visibility controls."}
            </SheetDescription>
          </SheetHeader>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {step === "form" ? (
            <form id="add-contact-form" onSubmit={handleProceedToReview} className="space-y-6">
              {/* 01 PERSON */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="contact-name" className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    01 &bull; Full Name
                  </label>
                  <span className="text-[11px] text-muted-foreground">Required</span>
                </div>
                <input
                  id="contact-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Anita Reddy"
                  className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#cc785c] focus:outline-none focus:ring-1 focus:ring-[#cc785c]"
                />
              </div>

              {/* 02 RELATIONSHIP */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    02 &bull; Relationship Role
                  </label>
                  <span className="text-[11px] text-muted-foreground">Role Identity</span>
                </div>

                <ContactRoleSelector
                  selectedRole={role}
                  onSelectRole={setRole}
                />

                <div className="pt-1">
                  <label htmlFor="custom-label" className="text-[11px] text-muted-foreground">
                    Specific Relationship Label (Optional)
                  </label>
                  <input
                    id="custom-label"
                    type="text"
                    value={relationshipLabel}
                    onChange={(e) => setRelationshipLabel(e.target.value)}
                    placeholder={activeRoleDef.label}
                    className="mt-1 h-9 w-full rounded-xl border border-input bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-[#cc785c] focus:outline-none"
                  />
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Custom label displayed alongside the role icon (e.g. &ldquo;Mother&rdquo;, &ldquo;Family Physician&rdquo;).
                  </p>
                </div>
              </div>

              {/* 03 CONTACT */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="contact-phone" className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    03 &bull; Mobile Phone Number
                  </label>
                  <span className="text-[11px] text-muted-foreground">For SMS / WhatsApp Alerts</span>
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3 font-mono text-xs font-semibold text-muted-foreground">
                    +91
                  </span>
                  <input
                    id="contact-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="98765 43210"
                    className="h-11 w-full rounded-xl border border-input bg-background pl-12 pr-3.5 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-[#cc785c] focus:outline-none focus:ring-1 focus:ring-[#cc785c]"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Phone numbers are stored securely in your account. Raw numbers are never published directly on public scans.
                </p>
              </div>

              {/* 04 VEHICLE ACCESS */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    04 &bull; Vehicle Association
                  </label>
                  <span className="text-[11px] text-muted-foreground">Select vehicles</span>
                </div>

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

              {/* 05 PUBLIC SAFETY VIEW & PRIORITY CONTROLS */}
              <div className="space-y-3 pt-2">
                <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  05 &bull; Public Safety View &amp; Priority
                </div>

                {/* Primary Contact Toggle */}
                <div className="flex items-center justify-between rounded-2xl border border-border/80 bg-card p-3.5">
                  <div className="space-y-0.5 pr-4">
                    <div className="text-xs font-semibold text-foreground">
                      Set as Primary Safety Contact
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Primary contact receives highest priority notifications when passerby alerts occur.
                    </div>
                  </div>
                  <Switch checked={isPrimary} onCheckedChange={setIsPrimary} />
                </div>

                {/* Public Safety View Toggle */}
                <div className="flex items-center justify-between rounded-2xl border border-border/80 bg-card p-3.5">
                  <div className="space-y-0.5 pr-4">
                    <div className="text-xs font-semibold text-foreground">
                      Available Through Public Safety View
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      When enabled, this contact is available via mediated relay when someone scans your vehicle QR sticker.
                    </div>
                  </div>
                  <Switch
                    checked={isPubliclyAvailable}
                    onCheckedChange={setIsPubliclyAvailable}
                  />
                </div>

                {/* Privacy Preview Card */}
                <div className="rounded-2xl border border-[#5db8a6]/30 bg-[#5db8a6]/5 p-3.5 text-xs">
                  <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#5db8a6] mb-2">
                    What a Scanner May See
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background p-2.5">
                    <div className="flex items-center gap-2.5">
                      <ContactRoleMark role={role} size="sm" />
                      <div>
                        <div className="font-medium text-foreground">{name || "Contact Name"}</div>
                        <div className="font-mono text-[10px] text-muted-foreground">
                          {displayLabel} &bull; Relay Call Option
                        </div>
                      </div>
                    </div>
                    <span className="rounded-md bg-[#5db8a6]/20 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#5db8a6]">
                      {isPubliclyAvailable ? "Relay Active" : "Hidden"}
                    </span>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            /* 06 REVIEW STEP */
            <div className="space-y-5">
              <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-border/60">
                  <ContactRoleMark role={role} size="lg" isPrimary={isPrimary} />
                  <div>
                    <h3 className="font-serif text-lg font-medium text-foreground">
                      {name}
                    </h3>
                    <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                      <span>{displayLabel}</span>
                      <span>&bull;</span>
                      <span>+91 {phone}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="font-mono text-[10px] uppercase text-muted-foreground">
                      Priority Level
                    </span>
                    <div className="font-medium text-foreground mt-0.5">
                      {isPrimary ? "Primary (Priority 01)" : "Secondary (Priority 02)"}
                    </div>
                  </div>
                  <div>
                    <span className="font-mono text-[10px] uppercase text-muted-foreground">
                      Public Visibility
                    </span>
                    <div className="font-medium mt-0.5 text-[#5db8a6]">
                      {isPubliclyAvailable ? "Enabled (Mediated Relay)" : "Private (Hidden)"}
                    </div>
                  </div>
                </div>

                <div>
                  <span className="font-mono text-[10px] uppercase text-muted-foreground">
                    Associated Vehicles ({selectedVehicleIds.length})
                  </span>
                  <div className="mt-1 space-y-1">
                    {vehicles
                      .filter((v) => selectedVehicleIds.includes(v.id))
                      .map((v) => (
                        <div
                          key={v.id}
                          className="flex items-center justify-between rounded-lg bg-muted/30 px-2.5 py-1.5 font-mono text-xs"
                        >
                          <span className="font-semibold text-foreground">{v.maskedPlate}</span>
                          <span className="text-muted-foreground">{v.makeModel}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border/60 bg-muted/20 p-3 text-xs leading-relaxed text-muted-foreground">
                By adding this contact, you authorize VaahanSafe to send critical incident notifications and passerby scan alerts regarding your associated vehicles.
              </div>
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="p-4 sm:p-6 border-t border-border/70 bg-card/60 flex items-center justify-between gap-3">
          {step === "form" ? (
            <>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-xl border border-input px-4 py-2.5 font-mono text-xs font-medium text-foreground hover:bg-muted/40 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="add-contact-form"
                className="inline-flex items-center gap-2 rounded-xl bg-[#cc785c] px-5 py-2.5 font-mono text-xs font-semibold text-white hover:bg-[#a9583e] transition-colors shadow-xs"
              >
                <span>Review Contact</span>
                <VaahanIcon name="arrow-right" size={12} />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep("form")}
                disabled={isSubmitting}
                className="rounded-xl border border-input px-4 py-2.5 font-mono text-xs font-medium text-foreground hover:bg-muted/40 transition-colors disabled:opacity-50"
              >
                &larr; Back to Edit
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-xl bg-[#cc785c] px-6 py-2.5 font-mono text-xs font-semibold text-white hover:bg-[#a9583e] transition-colors shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <VaahanIcon name="loading" size={14} className="animate-spin" />
                    <span>Adding to Network...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm &amp; Add Contact</span>
                    <VaahanIcon name="check" size={14} />
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
