"use client";

import * as React from "react";
import { SettingsSection } from "../primitives/SettingsSection";
import { SettingRow } from "../primitives/SettingRow";
import { SettingStatus } from "../primitives/SettingStatus";
import type { SettingsData } from "@/lib/settings-types";

interface AccountSettingsProps {
  data: SettingsData;
}

export function AccountSettings({ data }: AccountSettingsProps) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-medium tracking-tight text-foreground">
          Account
        </h1>
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
          Manage your VaahanSafe customer identity, regional preferences, and account metadata.
        </p>
      </div>

      <SettingsSection
        title="Account Identity"
        description="Authoritative identity references for customer support and billing."
      >
        <SettingRow
          title="Account Reference"
          description="Safe customer identifier used when communicating with VaahanSafe support."
          status={<SettingStatus status="ACTIVE" />}
        >
          <span className="font-mono text-xs font-semibold text-foreground tracking-wider bg-muted/50 px-2 py-1 rounded border border-border">
            {data.user.safeAccountId}
          </span>
        </SettingRow>

        <SettingRow
          title="Member Since"
          description="The date your primary vehicle safety profile was established."
        >
          <span className="font-mono text-xs text-muted-foreground">
            {data.user.memberSince}
          </span>
        </SettingRow>

        <SettingRow
          title="Timezone & Region"
          description="Used for emergency scan timestamps, courier delivery tracking, and invoice records."
        >
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-foreground">
              Asia/Kolkata (IST &bull; UTC+05:30)
            </span>
          </div>
        </SettingRow>

        <SettingRow
          title="Jurisdiction & Compliance"
          description="All relational data and identity records are hosted on Cloudflare edge locations within India."
        >
          <span className="font-mono text-[11px] text-muted-foreground">
            India (DPDP Compliant)
          </span>
        </SettingRow>
      </SettingsSection>
    </div>
  );
}
