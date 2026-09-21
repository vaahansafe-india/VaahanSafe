"use client";

import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { Button } from "@vaahansafe/ui";
import { SettingsSection } from "../primitives/SettingsSection";
import { SettingRow } from "../primitives/SettingRow";
import { SettingStatus } from "../primitives/SettingStatus";
import type { SettingsData } from "@/lib/settings-types";
import Link from "next/link";

interface VehiclePreferencesProps {
  data: SettingsData;
}

export function VehiclePreferences({ data }: VehiclePreferencesProps) {
  const vehicles = data.vehicles;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-medium tracking-tight text-foreground">
          Vehicle Preferences
        </h1>
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
          Manage your protected fleet, default vehicle selection, and QR sticker bindings.
        </p>
      </div>

      <SettingsSection
        title="Registered Vehicles"
        description="Vehicles actively monitored and linked to your VaahanSafe emergency account."
        action={
          <Link href="/vehicles/new">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs h-7 border-border hover:border-[#cc785c]"
            >
              Add Vehicle
            </Button>
          </Link>
        }
      >
        {vehicles.length > 0 ? (
          vehicles.map((v, idx) => (
            <SettingRow
              key={v.id}
              title={`${v.make} ${v.model}`}
              description={`Registration: ${v.registrationNumber}${v.year ? ` • Model Year: ${v.year}` : ""}`}
              status={
                idx === 0 ? (
                  <SettingStatus status="CURRENT" />
                ) : (
                  <SettingStatus status="ACTIVE" />
                )
              }
            >
              <div className="flex items-center gap-2">
                <Link href={`/vehicles/${v.id}`}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 text-muted-foreground hover:text-foreground"
                  >
                    Manage &rarr;
                  </Button>
                </Link>
              </div>
            </SettingRow>
          ))
        ) : (
          <div className="py-6 text-center text-xs text-muted-foreground">
            No vehicles registered yet.
          </div>
        )}
      </SettingsSection>
    </div>
  );
}
