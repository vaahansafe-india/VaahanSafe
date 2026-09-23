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
              className="h-9 px-3.5 rounded-xl border-border hover:border-[#cc785c] gap-1.5 shadow-2xs font-medium text-foreground hover:text-[#cc785c]"
            >
              <VaahanIcon name="plus" size={13} className="text-[#cc785c]" />
              <span>Add Vehicle</span>
            </Button>
          </Link>
        }
      >
        {vehicles.length > 0 ? (
          vehicles.map((v, idx) => (
            <SettingRow
              key={v.id}
              icon={
                <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-[#cc785c]/10 text-[#cc785c] border border-[#cc785c]/20 shrink-0 shadow-2xs">
                  <VaahanIcon name="car" size={18} />
                </div>
              }
              title={`${v.make} ${v.model}`}
              description={
                <span className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="font-mono text-[11px] text-foreground font-semibold bg-muted/70 px-1.5 py-0.5 rounded border border-border/70">
                    {v.registrationNumber}
                  </span>
                  {v.year && (
                    <span className="text-muted-foreground">
                      &bull; Model Year: {v.year}
                    </span>
                  )}
                </span>
              }
              status={
                v.isDefault || idx === 0 ? (
                  <SettingStatus status="CURRENT" />
                ) : (
                  <SettingStatus status="ACTIVE" />
                )
              }
            >
              <Link href={`/vehicles/${v.id}`}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 rounded-lg border-border hover:border-[#cc785c] hover:text-[#cc785c] gap-1.5 shrink-0 text-foreground shadow-2xs text-xs font-medium"
                >
                  <span>Manage</span>
                  <VaahanIcon name="arrow-right" size={12} />
                </Button>
              </Link>
            </SettingRow>
          ))
        ) : (
          <div className="p-8 text-center text-xs text-muted-foreground space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground border border-border">
              <VaahanIcon name="car" size={24} />
            </div>
            <div>
              <p className="font-medium text-foreground">No vehicles registered yet</p>
              <p className="text-muted-foreground text-xs mt-0.5">
                Add a vehicle to enable QR safety protection and emergency routing.
              </p>
            </div>
            <Link href="/vehicles/new" className="inline-block pt-1">
              <Button
                size="sm"
                className="h-9 px-4 rounded-xl bg-[#cc785c] hover:bg-[#b8674d] text-white text-xs gap-1.5 shadow-xs font-medium"
              >
                <VaahanIcon name="plus" size={13} />
                <span>Add Your First Vehicle</span>
              </Button>
            </Link>
          </div>
        )}
      </SettingsSection>

      {/* Fleet Routing Guidance */}
      <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 sm:p-4 text-[11px] text-muted-foreground leading-relaxed flex items-start gap-2.5">
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#cc785c]/10 text-[#cc785c] shrink-0 mt-0.5">
          <VaahanIcon name="info" size={13} />
        </div>
        <div>
          <span className="font-semibold text-foreground">Fleet Routing Anchor: </span>
          Your primary (CURRENT) vehicle receives instant scan alerts first. You can reorder priorities and link dedicated physical QR stickers from the vehicle management console.
        </div>
      </div>
    </div>
  );
}
