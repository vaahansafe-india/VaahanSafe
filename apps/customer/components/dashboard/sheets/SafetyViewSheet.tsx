"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { VaahanIcon } from "@vaahansafe/icons";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  Checkbox,
} from "@vaahansafe/ui";
import type { DashboardEmergencyProfile, DashboardVehicle } from "@/lib/dashboard-types";

interface SafetyViewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: DashboardVehicle | null;
  profile: DashboardEmergencyProfile;
  onSaved?: (updated: Partial<DashboardEmergencyProfile>) => void;
}

export function SafetyViewSheet({
  open,
  onOpenChange,
  vehicle,
  profile,
  onSaved,
}: SafetyViewSheetProps) {
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);
  const [feedback, setFeedback] = React.useState<string | null>(null);

  // Form state initialized from authoritative domain profile
  const [showOwnerName, setShowOwnerName] = React.useState(profile.showOwnerName);
  const [showBloodGroup, setShowBloodGroup] = React.useState(profile.showBloodGroup);
  const [showMedicalNotes, setShowMedicalNotes] = React.useState(profile.showMedicalNotes);
  const [showVehicleDetails, setShowVehicleDetails] = React.useState(profile.showVehicleDetails);
  const [bloodGroup, setBloodGroup] = React.useState(profile.bloodGroup || "");
  const [medicalNotes, setMedicalNotes] = React.useState(profile.medicalNotes || "");

  // Sync state if profile updates
  React.useEffect(() => {
    setShowOwnerName(profile.showOwnerName);
    setShowBloodGroup(profile.showBloodGroup);
    setShowMedicalNotes(profile.showMedicalNotes);
    setShowVehicleDetails(profile.showVehicleDetails);
    setBloodGroup(profile.bloodGroup || "");
    setMedicalNotes(profile.medicalNotes || "");
  }, [profile]);

  if (!vehicle) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    const payload = {
      vehicleId: vehicle.id,
      showOwnerName,
      showBloodGroup,
      showMedicalNotes,
      showVehicleDetails,
      bloodGroup: bloodGroup.trim(),
      medicalNotes: medicalNotes.trim(),
    };

    try {
      const res = await fetch("/api/dashboard/safety-view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to save settings");
      }

      setFeedback("Safety projection settings saved successfully.");
      if (onSaved) {
        onSaved({
          showOwnerName,
          showBloodGroup,
          showMedicalNotes,
          showVehicleDetails,
          bloodGroup: bloodGroup.trim(),
          medicalNotes: medicalNotes.trim(),
        });
      }
      router.refresh();

      setTimeout(() => {
        setFeedback(null);
        onOpenChange(false);
      }, 1200);
    } catch {
      setFeedback("We couldn't save those changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto bg-card p-4 sm:p-6">
        <SheetHeader className="border-b border-border pb-4 pr-12 text-left">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#5db8a6]">
            PUBLIC SAFETY VIEW PROJECTION
          </div>
          <SheetTitle className="font-serif text-2xl font-medium text-foreground">
            Configure Safety Exposure
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Decide exactly what first responders and passerby scanners can view when your QR sticker is resolved.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSave} className="mt-6 space-y-6">
          {feedback && (
            <div
              className={`rounded-xl p-3 text-xs font-medium ${
                feedback.includes("success")
                  ? "bg-[#5db8a6]/10 text-[#5db8a6] border border-[#5db8a6]/30"
                  : "bg-[#c64545]/10 text-[#c64545] border border-[#c64545]/30"
              }`}
            >
              {feedback}
            </div>
          )}

          {/* Privacy Toggles Matrix */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                VISIBILITY TOGGLES
              </div>
              <span className="font-mono text-[10px] text-muted-foreground">
                {[showVehicleDetails, showBloodGroup, showMedicalNotes, showOwnerName].filter(Boolean).length} of 4 Public
              </span>
            </div>

            {/* Vehicle Details Toggle */}
            <label
              htmlFor="toggle-vehicle-details"
              className={`group flex items-center justify-between gap-3.5 rounded-2xl border p-3.5 sm:p-4 cursor-pointer select-none transition-all duration-200 ${
                showVehicleDetails
                  ? "border-[#cc785c]/35 bg-[#cc785c]/[0.025] shadow-xs"
                  : "border-border/80 bg-card hover:border-border hover:bg-muted/15"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                    showVehicleDetails
                      ? "bg-[#cc785c]/10 text-[#cc785c]"
                      : "bg-muted/40 text-muted-foreground group-hover:text-foreground"
                  }`}
                >
                  <VaahanIcon name="vehicle" size={18} />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      Show Vehicle Details
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border transition-colors ${
                        showVehicleDetails
                          ? "text-[#5db8a6] bg-[#5db8a6]/10 border-[#5db8a6]/25"
                          : "text-muted-foreground bg-muted/40 border-border"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          showVehicleDetails ? "bg-[#5db8a6]" : "bg-muted-foreground/40"
                        }`}
                      />
                      {showVehicleDetails ? "Public" : "Hidden"}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                    Display make, model and plate ({vehicle.registrationNumber}) on QR resolve
                  </div>
                </div>
              </div>
              <div className="shrink-0 pl-2">
                <Checkbox
                  id="toggle-vehicle-details"
                  checked={showVehicleDetails}
                  onCheckedChange={(checked) => setShowVehicleDetails(Boolean(checked))}
                />
              </div>
            </label>

            {/* Blood Group Toggle */}
            <label
              htmlFor="toggle-blood-group"
              className={`group flex items-center justify-between gap-3.5 rounded-2xl border p-3.5 sm:p-4 cursor-pointer select-none transition-all duration-200 ${
                showBloodGroup
                  ? "border-[#cc785c]/35 bg-[#cc785c]/[0.025] shadow-xs"
                  : "border-border/80 bg-card hover:border-border hover:bg-muted/15"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                    showBloodGroup
                      ? "bg-[#cc785c]/10 text-[#cc785c]"
                      : "bg-muted/40 text-muted-foreground group-hover:text-foreground"
                  }`}
                >
                  <VaahanIcon name="shield" size={18} />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      Show Blood Group
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border transition-colors ${
                        showBloodGroup
                          ? "text-[#5db8a6] bg-[#5db8a6]/10 border-[#5db8a6]/25"
                          : "text-muted-foreground bg-muted/40 border-border"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          showBloodGroup ? "bg-[#5db8a6]" : "bg-muted-foreground/40"
                        }`}
                      />
                      {showBloodGroup ? "Public" : "Hidden"}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                    Expose blood type to emergency medical personnel
                  </div>
                </div>
              </div>
              <div className="shrink-0 pl-2">
                <Checkbox
                  id="toggle-blood-group"
                  checked={showBloodGroup}
                  onCheckedChange={(checked) => setShowBloodGroup(Boolean(checked))}
                />
              </div>
            </label>

            {/* Medical Notes Toggle */}
            <label
              htmlFor="toggle-medical-notes"
              className={`group flex items-center justify-between gap-3.5 rounded-2xl border p-3.5 sm:p-4 cursor-pointer select-none transition-all duration-200 ${
                showMedicalNotes
                  ? "border-[#cc785c]/35 bg-[#cc785c]/[0.025] shadow-xs"
                  : "border-border/80 bg-card hover:border-border hover:bg-muted/15"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                    showMedicalNotes
                      ? "bg-[#cc785c]/10 text-[#cc785c]"
                      : "bg-muted/40 text-muted-foreground group-hover:text-foreground"
                  }`}
                >
                  <VaahanIcon name="emergency" size={18} />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      Show Medical & Allergy Notes
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border transition-colors ${
                        showMedicalNotes
                          ? "text-[#5db8a6] bg-[#5db8a6]/10 border-[#5db8a6]/25"
                          : "text-muted-foreground bg-muted/40 border-border"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          showMedicalNotes ? "bg-[#5db8a6]" : "bg-muted-foreground/40"
                        }`}
                      />
                      {showMedicalNotes ? "Public" : "Hidden"}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                    Reveal critical health instructions during golden-hour care
                  </div>
                </div>
              </div>
              <div className="shrink-0 pl-2">
                <Checkbox
                  id="toggle-medical-notes"
                  checked={showMedicalNotes}
                  onCheckedChange={(checked) => setShowMedicalNotes(Boolean(checked))}
                />
              </div>
            </label>

            {/* Owner Name Toggle */}
            <label
              htmlFor="toggle-owner-name"
              className={`group flex items-center justify-between gap-3.5 rounded-2xl border p-3.5 sm:p-4 cursor-pointer select-none transition-all duration-200 ${
                showOwnerName
                  ? "border-[#cc785c]/35 bg-[#cc785c]/[0.025] shadow-xs"
                  : "border-border/80 bg-card hover:border-border hover:bg-muted/15"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                    showOwnerName
                      ? "bg-[#cc785c]/10 text-[#cc785c]"
                      : "bg-muted/40 text-muted-foreground group-hover:text-foreground"
                  }`}
                >
                  <VaahanIcon name="user" size={18} />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      Show Owner Name
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border transition-colors ${
                        showOwnerName
                          ? "text-[#5db8a6] bg-[#5db8a6]/10 border-[#5db8a6]/25"
                          : "text-muted-foreground bg-muted/40 border-border"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          showOwnerName ? "bg-[#5db8a6]" : "bg-muted-foreground/40"
                        }`}
                      />
                      {showOwnerName ? "Public" : "Hidden"}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                    Display registered name publicly or remain anonymous
                  </div>
                </div>
              </div>
              <div className="shrink-0 pl-2">
                <Checkbox
                  id="toggle-owner-name"
                  checked={showOwnerName}
                  onCheckedChange={(checked) => setShowOwnerName(Boolean(checked))}
                />
              </div>
            </label>
          </div>

          {/* Medical Data Inputs */}
          <div className="space-y-4 border-t border-border pt-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              HEALTH & EMERGENCY SPECIFICATION
            </div>

            <div>
              <label className="block font-mono text-xs font-semibold text-foreground">
                Driver / Rider Blood Group
              </label>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {bloodGroups.map((bg) => (
                  <button
                    key={bg}
                    type="button"
                    onClick={() => setBloodGroup(bloodGroup === bg ? "" : bg)}
                    className={`rounded-xl py-2 font-mono text-xs font-bold transition-all duration-150 ${
                      bloodGroup === bg
                        ? "bg-[#cc785c] text-white shadow-sm shadow-[#cc785c]/25 ring-2 ring-[#cc785c]/20"
                        : "border border-border bg-muted/20 text-foreground hover:border-[#cc785c]/50 hover:bg-muted/40"
                    }`}
                  >
                    {bg}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-mono text-xs font-semibold text-foreground">
                Emergency Medical & Rescue Notes
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Diabetic, allergic to penicillin, wears spectacles..."
                value={medicalNotes}
                onChange={(e) => setMedicalNotes(e.target.value)}
                className="mt-2 w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground transition-all duration-150 focus:border-[#cc785c] focus:ring-2 focus:ring-[#cc785c]/20 focus:outline-none"
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-xl border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-[#cc785c] px-5 py-2 font-mono text-xs font-semibold text-white transition-all hover:bg-[#a9583e] disabled:opacity-50"
            >
              <VaahanIcon name="shield" size={14} />
              <span>{saving ? "Saving Changes..." : "Save Public View"}</span>
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
