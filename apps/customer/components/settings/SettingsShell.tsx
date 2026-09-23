"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SettingsNavigation } from "./SettingsNavigation";
import { SettingsMobileIndex } from "./SettingsMobileIndex";
import { SettingsMobileHeader } from "./SettingsMobileHeader";
import { SettingsSearch } from "./SettingsSearch";

import { ProfileSettings } from "./profile/ProfileSettings";
import { AccountSettings } from "./account/AccountSettings";
import { NotificationSettings } from "./notifications/NotificationSettings";
import { AppearanceSettings } from "./appearance/AppearanceSettings";
import { SafetyPrivacySettings } from "./privacy/SafetyPrivacySettings";
import { VehiclePreferences } from "./vehicles/VehiclePreferences";
import { SecuritySettings } from "./security/SecuritySettings";
import { DataPrivacySettings } from "./data/DataPrivacySettings";

import type { SettingsCategory, SettingsData } from "@/lib/settings-types";

interface SettingsShellProps {
  initialData: SettingsData;
  defaultCategory?: SettingsCategory;
}

export function SettingsShell({
  initialData,
  defaultCategory = "profile",
}: SettingsShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read initial category from query param if provided
  const queryCategory = searchParams?.get("category") as SettingsCategory | null;
  const [activeCategory, setActiveCategory] = React.useState<SettingsCategory>(
    queryCategory || defaultCategory
  );

  // Mobile navigation state: showIndex is true at mobile root
  const [isMobileIndex, setIsMobileIndex] = React.useState(!queryCategory);

  const handleSelectCategory = (cat: SettingsCategory) => {
    setActiveCategory(cat);
    setIsMobileIndex(false);
    // Update URL without full page reload
    router.replace(`/settings?category=${cat}`, { scroll: false });
  };

  const handleMobileBack = () => {
    setIsMobileIndex(true);
    router.replace("/settings", { scroll: false });
  };

  const categoryTitles: Record<SettingsCategory, string> = {
    profile: "Profile",
    account: "Account",
    notifications: "Notifications",
    appearance: "Appearance",
    privacy: "Safety & Privacy",
    vehicles: "Vehicle Preferences",
    security: "Security & Sessions",
    sessions: "Security & Sessions",
    data: "Data & Privacy",
  };

  const renderActiveContent = () => {
    switch (activeCategory) {
      case "profile":
        return <ProfileSettings data={initialData} />;
      case "account":
        return <AccountSettings data={initialData} />;
      case "notifications":
        return <NotificationSettings data={initialData} />;
      case "appearance":
        return <AppearanceSettings />;
      case "privacy":
        return <SafetyPrivacySettings data={initialData} />;
      case "vehicles":
        return <VehiclePreferences data={initialData} />;
      case "security":
      case "sessions":
        return <SecuritySettings data={initialData} />;
      case "data":
        return <DataPrivacySettings data={initialData} />;
      default:
        return <ProfileSettings data={initialData} />;
    }
  };

  return (
    <div className="w-full">
      {/* ========================================================================= */}
      {/* 01. MOBILE VIEW (<1024px)                                                 */}
      {/* ========================================================================= */}
      <div className="lg:hidden">
        {isMobileIndex ? (
          <SettingsMobileIndex onSelectCategory={handleSelectCategory} />
        ) : (
          <div className="pb-12">
            <SettingsMobileHeader
              onBack={handleMobileBack}
              categoryTitle={categoryTitles[activeCategory]}
            />
            <div className="max-w-xl mx-auto space-y-6">{renderActiveContent()}</div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 02. DESKTOP VIEW (>=1024px)                                               */}
      {/* Interaction philosophy of ChatGPT-style settings:                         */}
      {/* Calm left rail (~220-240px) + Narrow focused reading workspace (~760-840px)*/}
      {/* ========================================================================= */}
      <div className="hidden lg:flex items-start gap-12 xl:gap-16">
        {/* Left Category Rail */}
        <aside className="w-56 shrink-0 sticky top-20 space-y-4">
          <SettingsSearch onSelectCategory={handleSelectCategory} />
          <SettingsNavigation
            activeCategory={activeCategory}
            onSelectCategory={handleSelectCategory}
          />
        </aside>

        {/* Right Focused Settings Workspace */}
        <main className="flex-1 min-w-0 max-w-3xl pb-16 space-y-8">
          {renderActiveContent()}
        </main>
      </div>
    </div>
  );
}
