"use client";

import * as React from "react";
import { VaahanIcon, type VaahanIconName } from "@vaahansafe/icons";
import { SettingsGroupLabel } from "./primitives/SettingsGroupLabel";
import type { SettingsCategory } from "@/lib/settings-types";

interface NavItem {
  id: SettingsCategory;
  label: string;
  icon: VaahanIconName;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "General",
    items: [
      { id: "profile", label: "Profile", icon: "user" },
      { id: "account", label: "Account", icon: "id-card" },
    ],
  },
  {
    label: "Preferences",
    items: [
      { id: "notifications", label: "Notifications", icon: "notification" },
      { id: "appearance", label: "Appearance", icon: "palette" },
    ],
  },
  {
    label: "Safety & Privacy",
    items: [
      { id: "privacy", label: "Safety & Privacy", icon: "shield" },
      { id: "vehicles", label: "Vehicle Preferences", icon: "car" },
    ],
  },
  {
    label: "Security",
    items: [
      { id: "security", label: "Security & Sessions", icon: "lock" },
    ],
  },
  {
    label: "Data",
    items: [
      { id: "data", label: "Data & Privacy", icon: "database" },
    ],
  },
];

interface SettingsNavigationProps {
  activeCategory: SettingsCategory;
  onSelectCategory: (cat: SettingsCategory) => void;
}

export function SettingsNavigation({
  activeCategory,
  onSelectCategory,
}: SettingsNavigationProps) {
  return (
    <nav className="w-56 shrink-0 space-y-6" aria-label="Settings Categories">
      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="space-y-1">
          <SettingsGroupLabel>{group.label}</SettingsGroupLabel>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const isSelected = activeCategory === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectCategory(item.id)}
                  className={`relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors text-left ${
                    isSelected
                      ? "bg-[#cc785c]/10 text-foreground font-semibold"
                      : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                  }`}
                  aria-current={isSelected ? "page" : undefined}
                >
                  {/* Subtle coral registration indicator on active */}
                  {isSelected && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-1 rounded-r-full bg-[#cc785c]"
                      aria-hidden="true"
                    />
                  )}
                  <div
                    className={`flex items-center justify-center ${
                      isSelected ? "text-[#cc785c]" : "text-muted-foreground"
                    }`}
                  >
                    <VaahanIcon name={item.icon} size={16} />
                  </div>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
