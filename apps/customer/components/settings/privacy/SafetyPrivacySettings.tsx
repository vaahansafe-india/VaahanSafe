"use client";

import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { Button, Switch } from "@vaahansafe/ui";
import { SettingsSection } from "../primitives/SettingsSection";
import { SettingRow } from "../primitives/SettingRow";
import { SettingStatus } from "../primitives/SettingStatus";
import { PublicSafetyPreviewDialog } from "../dialogs/PublicSafetyPreviewDialog";
import { updatePrivacySettingsAction } from "@/lib/settings-actions";
import type { SettingsData, PrivacyVehicleProfile } from "@/lib/settings-types";
import { toast } from "sonner";

interface SafetyPrivacySettingsProps {
  data: SettingsData;
}

export function SafetyPrivacySettings({ data }: SafetyPrivacySettingsProps) {
  const profile = data.privacy;
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);

  const [settings, setSettings] = React.useState({
    showOwnerName: profile?.showOwnerName ?? true,
    showBloodGroup: profile?.showBloodGroup ?? true,
    showMedicalNotes: profile?.showMedicalNotes ?? false,
    showVehicleDetails: profile?.showVehicleDetails ?? true,
    displayName: profile?.displayName ?? data.user.name,
    bloodGroup: profile?.bloodGroup ?? "O+",
    medicalNotes: profile?.medicalNotes ?? "No active medical allergies reported.",
  });

  const handleToggle = async (key: keyof typeof settings, currentValue: boolean) => {
    if (!profile) return;
    const nextValue = !currentValue;

    // Optimistic UI
    setSettings((prev) => ({ ...prev, [key]: nextValue }));

    const res = await updatePrivacySettingsAction(profile.vehicleId, {
      [key]: nextValue,
    });

    if (res.success) {
      toast.success("Privacy preference updated.");
    } else {
      setSettings((prev) => ({ ...prev, [key]: currentValue }));
      toast.error(res.error || "We couldn't update this privacy setting.");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-medium tracking-tight text-foreground">
          Safety & Privacy
        </h1>
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
          Control what first responders and passerby scanners can view when scanning your vehicle QR sticker.
        </p>
      </div>

      {/* Signature Rail: PRIVATE ACCOUNT → OWNER CONTROLS → PUBLIC SAFETY PROJECTION */}
      <div className="rounded-xl border border-border/80 bg-gradient-to-r from-card via-muted/20 to-card p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#cc785c] font-semibold">
              Security Architecture
            </span>
            <div className="flex items-center gap-2 text-xs font-medium text-foreground flex-wrap">
              <span className="rounded bg-muted px-2 py-1 font-mono text-[11px] border border-border/60">
                PRIVATE ACCOUNT
              </span>
              <span className="text-muted-foreground">&rarr;</span>
              <span className="rounded bg-[#cc785c]/10 text-[#cc785c] px-2 py-1 font-mono text-[11px] border border-[#cc785c]/25">
                OWNER CONTROLS
              </span>
              <span className="text-muted-foreground">&rarr;</span>
              <span className="rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-1 font-mono text-[11px] border border-emerald-500/20">
                PUBLIC SAFETY VIEW
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed max-w-xl">
              By default, your private home address and email are never exposed. You explicitly choose which safety details appear on your vehicle&apos;s public QR page.
            </p>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={() => setIsPreviewOpen(true)}
            className="bg-[#cc785c] hover:bg-[#b8674d] text-white shrink-0 self-start sm:self-center gap-2"
          >
            <VaahanIcon name="eye" size={14} />
            Preview Public View
          </Button>
        </div>
      </div>

      {profile ? (
        <SettingsSection
          title={`Active Vehicle: ${profile.registrationNumber}`}
          description={`${profile.make} ${profile.model} · Real-time Cloudflare D1 Projection`}
        >
          {/* Owner Name Toggle */}
          <SettingRow
            title="Owner Display Name"
            description={
              settings.showOwnerName ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  PUBLIC &bull; Visible in the safety projection ({settings.displayName})
                </span>
              ) : (
                <span className="text-muted-foreground">
                  PRIVATE &bull; Masked as &quot;Verified Owner&quot; to protect identity
                </span>
              )
            }
            status={
              <SettingStatus
                status={settings.showOwnerName ? "PUBLIC" : "PRIVATE"}
              />
            }
          >
            <Switch
              checked={settings.showOwnerName}
              onCheckedChange={() =>
                handleToggle("showOwnerName", settings.showOwnerName)
              }
              aria-label="Toggle owner name visibility"
            />
          </SettingRow>

          {/* Blood Group Toggle */}
          <SettingRow
            title="Emergency Blood Group"
            description={
              settings.showBloodGroup ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  PUBLIC &bull; Displayed for immediate trauma care ({settings.bloodGroup})
                </span>
              ) : (
                <span className="text-muted-foreground">
                  PRIVATE &bull; Not included in the public projection
                </span>
              )
            }
            status={
              <SettingStatus
                status={settings.showBloodGroup ? "PUBLIC" : "PRIVATE"}
              />
            }
          >
            <Switch
              checked={settings.showBloodGroup}
              onCheckedChange={() =>
                handleToggle("showBloodGroup", settings.showBloodGroup)
              }
              aria-label="Toggle blood group visibility"
            />
          </SettingRow>

          {/* Medical Notes Toggle */}
          <SettingRow
            title="Medical Notes & Critical Allergies"
            description={
              settings.showMedicalNotes ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  PUBLIC &bull; Critical medical conditions visible to paramedics
                </span>
              ) : (
                <span className="text-muted-foreground">
                  PRIVATE &bull; Kept hidden from the public scan screen
                </span>
              )
            }
            status={
              <SettingStatus
                status={settings.showMedicalNotes ? "PUBLIC" : "PRIVATE"}
              />
            }
          >
            <Switch
              checked={settings.showMedicalNotes}
              onCheckedChange={() =>
                handleToggle("showMedicalNotes", settings.showMedicalNotes)
              }
              aria-label="Toggle medical notes visibility"
            />
          </SettingRow>

          {/* Vehicle Details Toggle */}
          <SettingRow
            title="Vehicle Make, Model & Color"
            description={
              settings.showVehicleDetails ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  PUBLIC &bull; Helps responders confirm they are assisting the correct vehicle
                </span>
              ) : (
                <span className="text-muted-foreground">
                  PRIVATE &bull; Vehicle metadata masked on scan
                </span>
              )
            }
            status={
              <SettingStatus
                status={settings.showVehicleDetails ? "PUBLIC" : "PRIVATE"}
              />
            }
          >
            <Switch
              checked={settings.showVehicleDetails}
              onCheckedChange={() =>
                handleToggle("showVehicleDetails", settings.showVehicleDetails)
              }
              aria-label="Toggle vehicle details visibility"
            />
          </SettingRow>
        </SettingsSection>
      ) : (
        <div className="rounded-xl border border-border p-6 text-center text-xs text-muted-foreground">
          No active vehicles registered. Add a vehicle in your fleet to configure public safety projection privacy.
        </div>
      )}

      {/* Invariant Note */}
      <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-[11px] text-muted-foreground leading-relaxed">
        <span className="font-medium text-foreground">Zero-Exposure Guarantee: </span>
        Personal phone numbers of your emergency contacts are connected via masked VoIP call proxying or encrypted WhatsApp alerts. Scanners never see raw contact numbers.
      </div>

      {/* Live Preview Dialog */}
      <PublicSafetyPreviewDialog
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        profile={profile}
        settings={settings}
      />
    </div>
  );
}
