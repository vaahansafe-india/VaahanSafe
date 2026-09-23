"use client";

import * as React from "react";
import { Button } from "@vaahansafe/ui";
import { SettingsSection } from "../primitives/SettingsSection";
import { SettingRow } from "../primitives/SettingRow";
import { DataExportDialog } from "../dialogs/DataExportDialog";
import { DeleteAccountAlert } from "../alerts/DeleteAccountAlert";
import type { SettingsData } from "@/lib/settings-types";

interface DataPrivacySettingsProps {
  data: SettingsData;
}

export function DataPrivacySettings({ data }: DataPrivacySettingsProps) {
  const [isExportDialogOpen, setIsExportDialogOpen] = React.useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);

  const hasVehicles = data.vehicles.length > 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-medium tracking-tight text-foreground">
          Data & Privacy
        </h1>
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
          Manage your personal data records, export machine-readable archives, and review data retention policies.
        </p>
      </div>

      {/* Export Section */}
      <SettingsSection
        title="Data Portability"
        description="Request an official export of your registered vehicles, safety records, and audit events."
      >
        <SettingRow
          title="Download Your Account Data"
          description="Generates a structured JSON archive of your personal records and transaction logs."
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsExportDialogOpen(true)}
            className="text-xs h-8 border-border hover:border-[#cc785c]"
          >
            Request Export &rarr;
          </Button>
        </SettingRow>

        <SettingRow
          title="Data Retention Architecture"
          description="In compliance with Indian Digital Personal Data Protection (DPDP) Act rules, emergency logs are retained to safeguard vehicle owners in hit-and-run incidents."
        >
          <span className="font-mono text-[11px] text-muted-foreground">
            Encrypted D1 Relational Vault
          </span>
        </SettingRow>
      </SettingsSection>

      {/* Danger Zone */}
      <section className="space-y-3 pt-6 border-t border-destructive/20">
        <div className="pb-2">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-destructive">
            Danger Zone
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
            Irreversible actions regarding your account and vehicle safety profiles.
          </p>
        </div>

        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 overflow-hidden">
          <SettingRow
            title="Permanently Close Account"
            description="Revokes all active sessions and removes access to customer control centers. Invoices and orders are retained for legal audit compliance."
            isDestructive
          >
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setIsDeleteAlertOpen(true)}
              className="text-xs h-8"
            >
              Close Account &rarr;
            </Button>
          </SettingRow>
        </div>
      </section>

      {/* Dialogs */}
      <DataExportDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
      />

      <DeleteAccountAlert
        open={isDeleteAlertOpen}
        onOpenChange={setIsDeleteAlertOpen}
        hasActiveVehicles={hasVehicles}
      />
    </div>
  );
}
