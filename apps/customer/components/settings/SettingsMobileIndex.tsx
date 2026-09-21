"use client";

import * as React from "react";
import { VaahanIcon, type VaahanIconName } from "@vaahansafe/icons";
import { SettingsGroupLabel } from "./primitives/SettingsGroupLabel";
import { SettingsSearch } from "./SettingsSearch";
import type { SettingsCategory } from "@/lib/settings-types";

interface MobileNavItem {
  id: SettingsCategory;
  label: string;
  description: string;
  icon: VaahanIconName;
}

interface MobileNavGroup {
  label: string;
  items: MobileNavItem[];
}

const MOBILE_GROUPS: MobileNavGroup[] = [
  {
    label: "General",
    items: [
      { id: "profile", label: "Profile", description: "Name, verified mobile & email", icon: "user" },
      { id: "account", label: "Account", description: "Account identity & region", icon: "id-card" },
    ],
  },
  {
    label: "Preferences",
    items: [
      { id: "notifications", label: "Notifications", description: "Channel delivery preferences", icon: "notification" },
      { id: "appearance", label: "Appearance", description: "Color theme & motion", icon: "palette" },
    ],
  },
  {
    label: "Safety & Privacy",
    items: [
      { id: "privacy", label: "Safety & Privacy", description: "Public projection & safety preview", icon: "shield" },
      { id: "vehicles", label: "Vehicle Preferences", description: "Fleet and default car", icon: "car" },
    ],
  },
  {
    label: "Security",
    items: [
      { id: "security", label: "Security & Sessions", description: "Authenticators & active devices", icon: "lock" },
    ],
  },
  {
    label: "Data",
    items: [
      { id: "data", label: "Data & Privacy", description: "Data export & Danger Zone", icon: "database" },
    ],
  },
];

interface SettingsMobileIndexProps {
  onSelectCategory: (cat: SettingsCategory) => void;
}

export function SettingsMobileIndex({ onSelectCategory }: SettingsMobileIndexProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="font-serif text-2xl font-medium tracking-tight text-foreground">
          Settings
        </h1>
        <p className="text-xs text-muted-foreground">
          Your VaahanSafe account, safety projection, and control center.
        </p>
      </div>

      {/* Search Field */}
      <SettingsSearch onSelectCategory={onSelectCategory} />

      {/* Grouped Category Navigators */}
      <div className="space-y-6">
        {MOBILE_GROUPS.map((group) => (
          <div key={group.label} className="space-y-1.5">
            <SettingsGroupLabel>{group.label}</SettingsGroupLabel>
            <div className="rounded-xl border border-border/80 bg-card divide-y divide-border/50 overflow-hidden shadow-2xs">
              {group.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectCategory(item.id)}
                  className="flex w-full items-center justify-between p-3.5 text-left transition-colors hover:bg-muted/40 active:bg-muted/60"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#cc785c]/10 text-[#cc785c]">
                      <VaahanIcon name={item.icon} size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-foreground">
                        {item.label}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {item.description}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 text-muted-foreground">
                    <VaahanIcon name="chevron-right" size={16} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
