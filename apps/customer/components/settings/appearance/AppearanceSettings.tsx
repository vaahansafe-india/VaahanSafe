"use client";

import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { Switch, useTheme } from "@vaahansafe/ui";
import { SettingsSection } from "../primitives/SettingsSection";
import { SettingRow } from "../primitives/SettingRow";
import { toast } from "sonner";

type ThemeMode = "system" | "light" | "dark";

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [reduceMotion, setReduceMotion] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      setReduceMotion(document.documentElement.classList.contains("reduce-motion"));
    }
  }, []);

  const handleThemeChange = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    toast.success(`Theme set to ${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)}.`);
  };

  const handleMotionToggle = (enabled: boolean) => {
    setReduceMotion(enabled);
    if (enabled) {
      document.documentElement.classList.add("reduce-motion");
      try {
        localStorage.setItem("vs_reduce_motion", "true");
      } catch {}
      toast.success("Interface motion reduced.");
    } else {
      document.documentElement.classList.remove("reduce-motion");
      try {
        localStorage.removeItem("vs_reduce_motion");
      } catch {}
      toast.success("Standard interface motion enabled.");
    }
  };

  const currentTheme = mounted ? theme || "system" : "system";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-medium tracking-tight text-foreground">
          Appearance
        </h1>
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
          Customize the visual presentation, color contrast, and accessibility preferences.
        </p>
      </div>

      <SettingsSection
        title="Theme & Contrast"
        description="Select a comfortable visual theme for viewing your vehicle fleet and safety controls."
      >
        <SettingRow
          title="Color Theme"
          description="VaahanSafe adapts between editorial warm daylight and focused nighttime contrast."
        >
          <div className="inline-flex rounded-lg border border-border p-1 bg-muted/40">
            <button
              type="button"
              onClick={() => handleThemeChange("light")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                currentTheme === "light"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <VaahanIcon name="sun" size={14} />
              Light
            </button>
            <button
              type="button"
              onClick={() => handleThemeChange("dark")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                currentTheme === "dark"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <VaahanIcon name="moon" size={14} />
              Dark
            </button>
            <button
              type="button"
              onClick={() => handleThemeChange("system")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                currentTheme === "system"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <VaahanIcon name="laptop" size={14} />
              System
            </button>
          </div>
        </SettingRow>

        <SettingRow
          title="Reduce Interface Motion"
          description="Minimize animations, transitions, and slide-in drawers across all customer surfaces."
        >
          <Switch
            checked={reduceMotion}
            onCheckedChange={handleMotionToggle}
            aria-label="Reduce interface motion"
          />
        </SettingRow>
      </SettingsSection>
    </div>
  );
}
