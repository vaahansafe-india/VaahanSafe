"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  useTheme,
} from "@vaahansafe/ui";
import { VaahanIcon } from "@vaahansafe/icons";
import type { PrivacyVehicleProfile } from "@/lib/settings-types";

interface PublicSafetyPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: PrivacyVehicleProfile | null;
  settings: {
    showOwnerName: boolean;
    showBloodGroup: boolean;
    showMedicalNotes: boolean;
    showVehicleDetails: boolean;
    displayName: string | null;
    bloodGroup: string | null;
    medicalNotes: string | null;
  };
}

export function PublicSafetyPreviewDialog({
  open,
  onOpenChange,
  profile,
  settings,
}: PublicSafetyPreviewDialogProps) {
  const { resolvedTheme } = useTheme();
  const [previewTheme, setPreviewTheme] = React.useState<"light" | "dark">("light");

  // Sync preview theme with active app theme when dialog opens
  React.useEffect(() => {
    if (open) {
      setPreviewTheme(resolvedTheme === "dark" ? "dark" : "light");
    }
  }, [open, resolvedTheme]);

  const regNumber = profile?.registrationNumber || "KA 01 AB 1234";
  const makeModel = `${profile?.make || "Vehicle"} ${profile?.model || ""}`.trim();
  const ownerName = settings.displayName || profile?.displayName || "Vehicle Owner";
  const bloodGroup = settings.bloodGroup || profile?.bloodGroup || "O+";
  const medicalNotes =
    settings.medicalNotes || profile?.medicalNotes || "No specific allergies reported.";

  const isDarkPreview = previewTheme === "dark";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden border border-border bg-card shadow-2xl rounded-2xl">
        {/* Dialog Header — Adapts to App Theme */}
        <div className="bg-card p-5 sm:p-6 text-card-foreground border-b border-border pr-12">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 font-semibold">
                Live Public Projection
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[9px] text-muted-foreground border border-border/60">
                {profile?.publicId ? `ID: ${profile.publicId}` : "VS-RESOLVER"}
              </span>
            </div>

            {/* Interactive Theme Mode Toggle for Preview */}
            <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/60 p-0.5">
              <button
                type="button"
                onClick={() => setPreviewTheme("light")}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-mono font-medium transition-all ${
                  previewTheme === "light"
                    ? "bg-card text-foreground shadow-xs border border-border/50"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Preview in daylight (light) theme"
              >
                <VaahanIcon name="sun" size={12} className="text-amber-500" />
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewTheme("dark")}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-mono font-medium transition-all ${
                  previewTheme === "dark"
                    ? "bg-card text-foreground shadow-xs border border-border/50"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Preview in night (dark) theme"
              >
                <VaahanIcon name="moon" size={12} className="text-indigo-400" />
                <span>Dark</span>
              </button>
            </div>
          </div>

          <DialogHeader className="mt-3 text-left">
            <DialogTitle className="font-serif text-xl text-foreground font-medium">
              Public Safety Experience
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed mt-1">
              This preview reflects your active privacy settings. Responders and passersby scanning your vehicle QR sticker will see this exact screen.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Mockup Container — Adapts smoothly between Light and Dark preview */}
        <div
          className={`p-5 sm:p-6 space-y-4 max-h-[60vh] overflow-y-auto transition-colors duration-200 ${
            isDarkPreview ? "bg-zinc-950 text-zinc-100" : "bg-slate-100/90 text-zinc-900"
          }`}
        >
          {/* Vehicle Identity Card */}
          <div
            className={`rounded-2xl border p-4 space-y-3 shadow-xs transition-colors ${
              isDarkPreview
                ? "border-zinc-800 bg-zinc-900/90"
                : "border-slate-200/90 bg-white"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    isDarkPreview ? "bg-[#cc785c]/20 text-[#cc785c]" : "bg-[#cc785c]/10 text-[#cc785c]"
                  }`}
                >
                  <VaahanIcon name="car" size={18} />
                </div>
                <div>
                  <div
                    className={`font-mono text-sm font-bold tracking-wider ${
                      isDarkPreview ? "text-zinc-100" : "text-zinc-900"
                    }`}
                  >
                    {settings.showVehicleDetails ? regNumber : "•••• •• ••••"}
                  </div>
                  <div
                    className={`text-xs ${
                      isDarkPreview ? "text-zinc-400" : "text-zinc-500"
                    }`}
                  >
                    {settings.showVehicleDetails ? makeModel : "Vehicle Details Hidden"}
                  </div>
                </div>
              </div>

              <span
                className={`rounded-full px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider border ${
                  isDarkPreview
                    ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                    : "bg-emerald-50 border-emerald-200 text-emerald-700"
                }`}
              >
                ACTIVE SAFETY QR
              </span>
            </div>
          </div>

          {/* Identity & Medical Grid */}
          <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-2.5 sm:gap-3">
            {/* Owner Card */}
            <div
              className={`rounded-xl border p-3.5 space-y-1 shadow-2xs transition-colors ${
                isDarkPreview
                  ? "border-zinc-800 bg-zinc-900/80"
                  : "border-slate-200/90 bg-white"
              }`}
            >
              <div
                className={`font-mono text-[10px] uppercase tracking-wider font-semibold ${
                  isDarkPreview ? "text-zinc-500" : "text-slate-500"
                }`}
              >
                Vehicle Owner
              </div>
              {settings.showOwnerName ? (
                <div
                  className={`text-xs font-semibold truncate ${
                    isDarkPreview ? "text-zinc-200" : "text-zinc-800"
                  }`}
                >
                  {ownerName}
                </div>
              ) : (
                <div
                  className={`flex items-center gap-1 text-xs italic ${
                    isDarkPreview ? "text-zinc-500" : "text-slate-400"
                  }`}
                >
                  <VaahanIcon name="eye-off" size={12} />
                  <span>Hidden by owner</span>
                </div>
              )}
            </div>

            {/* Blood Group */}
            <div
              className={`rounded-xl border p-3.5 space-y-1 shadow-2xs transition-colors ${
                isDarkPreview
                  ? "border-zinc-800 bg-zinc-900/80"
                  : "border-slate-200/90 bg-white"
              }`}
            >
              <div
                className={`font-mono text-[10px] uppercase tracking-wider font-semibold ${
                  isDarkPreview ? "text-zinc-500" : "text-slate-500"
                }`}
              >
                Blood Group
              </div>
              {settings.showBloodGroup ? (
                <div
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-mono font-bold border ${
                    isDarkPreview
                      ? "bg-red-500/10 border-red-500/25 text-red-400"
                      : "bg-rose-50 border-rose-200 text-rose-700"
                  }`}
                >
                  {bloodGroup}
                </div>
              ) : (
                <div
                  className={`flex items-center gap-1 text-xs italic ${
                    isDarkPreview ? "text-zinc-500" : "text-slate-400"
                  }`}
                >
                  <VaahanIcon name="eye-off" size={12} />
                  <span>Hidden</span>
                </div>
              )}
            </div>
          </div>

          {/* Medical Notes */}
          {settings.showMedicalNotes && (
            <div
              className={`rounded-xl border p-3.5 space-y-1.5 shadow-2xs transition-colors ${
                isDarkPreview
                  ? "border-zinc-800 bg-zinc-900/80"
                  : "border-slate-200/90 bg-white"
              }`}
            >
              <div
                className={`font-mono text-[10px] uppercase tracking-wider font-semibold flex items-center gap-1.5 ${
                  isDarkPreview ? "text-zinc-500" : "text-slate-500"
                }`}
              >
                <VaahanIcon name="activity" size={12} className="text-[#cc785c]" />
                Emergency Medical Information
              </div>
              <p
                className={`text-xs leading-relaxed ${
                  isDarkPreview ? "text-zinc-300" : "text-zinc-700"
                }`}
              >
                {medicalNotes}
              </p>
            </div>
          )}

          {/* Action Simulation Buttons */}
          <div className="space-y-2 pt-1">
            <div
              className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 font-mono text-xs font-semibold transition-all cursor-default select-none shadow-xs ${
                isDarkPreview
                  ? "bg-emerald-600/20 hover:bg-emerald-600/25 border border-emerald-500/35 text-emerald-300"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/15"
              }`}
            >
              <VaahanIcon name="phone" size={14} />
              Call Emergency Contact (Masked VoIP)
            </div>

            <div
              className={`w-full flex items-center justify-center gap-2 rounded-xl py-2 px-4 font-mono text-xs font-medium transition-all cursor-default select-none border ${
                isDarkPreview
                  ? "bg-zinc-800/80 hover:bg-zinc-800 border-zinc-700 text-zinc-300"
                  : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-2xs"
              }`}
            >
              <VaahanIcon name="notification" size={14} />
              Send Passerby Alert (Wrong Parking / Tow)
            </div>
          </div>

          <p
            className={`text-[11px] text-center leading-relaxed px-2 transition-colors ${
              isDarkPreview ? "text-zinc-400" : "text-slate-500"
            }`}
          >
            Your home address and personal email are{" "}
            <span
              className={`font-semibold ${
                isDarkPreview ? "text-zinc-200" : "text-slate-800"
              }`}
            >
              never
            </span>{" "}
            revealed in the public emergency projection.
          </p>
        </div>

        {/* Dialog Footer */}
        <DialogFooter className="p-4 bg-card border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-[11px] text-muted-foreground font-mono">
            Mode:{" "}
            <span className="font-semibold text-foreground">
              {isDarkPreview ? "Nighttime (Dark)" : "Daylight (Light)"}
            </span>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto bg-[#cc785c] hover:bg-[#b8674d] text-white"
          >
            Close Preview
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
