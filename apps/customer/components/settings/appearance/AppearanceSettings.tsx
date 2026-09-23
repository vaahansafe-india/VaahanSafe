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
        {/* Color Theme with Small Previews */}
        <div className="p-4 sm:p-5 space-y-3.5">
          <div className="space-y-1">
            <span className="text-sm font-medium leading-none text-foreground">
              Color Theme
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed pt-0.5">
              VaahanSafe adapts between editorial warm daylight and focused nighttime contrast.
            </p>
          </div>

          <div
            role="radiogroup"
            aria-label="Color theme selection"
            className="grid grid-cols-3 gap-2.5 sm:gap-4 pt-1"
          >
            {/* 01. LIGHT THEME PREVIEW */}
            <button
              type="button"
              role="radio"
              aria-checked={currentTheme === "light"}
              onClick={() => handleThemeChange("light")}
              className={`group flex flex-col text-left p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer ${
                currentTheme === "light"
                  ? "border-[#cc785c] bg-[#cc785c]/5 ring-2 ring-[#cc785c]/30 shadow-xs"
                  : "border-border/80 bg-muted/20 hover:border-border hover:bg-muted/40"
              }`}
            >
              {/* Miniature Light Mockup */}
              <div className="relative w-full aspect-[16/10] rounded-lg overflow-hidden border border-zinc-200 bg-white p-1 flex flex-col justify-between shadow-2xs select-none pointer-events-none">
                {/* Mini Top Bar */}
                <div className="flex items-center justify-between pb-0.5 border-b border-zinc-100">
                  <div className="flex items-center gap-0.5">
                    <div className="w-1 h-1 rounded-full bg-[#cc785c]" />
                    <div className="w-2.5 h-0.5 rounded-full bg-zinc-300" />
                  </div>
                  <div className="w-2 h-0.5 rounded-full bg-zinc-200" />
                </div>
                {/* Mini Content Grid */}
                <div className="flex gap-1 flex-1 pt-0.5">
                  <div className="w-2 bg-zinc-100 rounded-xs flex flex-col gap-0.5 p-0.5">
                    <div className="w-full h-0.5 bg-zinc-300 rounded-full" />
                    <div className="w-full h-0.5 bg-zinc-200 rounded-full" />
                  </div>
                  <div className="flex-1 flex flex-col gap-0.5">
                    <div className="p-0.5 rounded-xs bg-zinc-50 border border-zinc-100 flex flex-col gap-0.5">
                      <div className="w-2/5 h-0.5 bg-[#cc785c] rounded-full" />
                      <div className="w-4/5 h-0.5 bg-zinc-200 rounded-full" />
                    </div>
                    <div className="flex gap-0.5">
                      <div className="flex-1 h-1 rounded-xs bg-zinc-100" />
                      <div className="flex-1 h-1 rounded-xs bg-zinc-100" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Label & Radio Indicator */}
              <div className="flex items-center justify-between w-full pt-2 px-0.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <VaahanIcon
                    name="sun"
                    size={13}
                    className={
                      currentTheme === "light"
                        ? "text-[#cc785c] shrink-0"
                        : "text-muted-foreground shrink-0"
                    }
                  />
                  <span
                    className={`text-xs font-medium truncate ${
                      currentTheme === "light"
                        ? "text-foreground font-semibold"
                        : "text-muted-foreground"
                    }`}
                  >
                    Light
                  </span>
                </div>
                <div
                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                    currentTheme === "light"
                      ? "border-[#cc785c] bg-[#cc785c]"
                      : "border-muted-foreground/30 bg-transparent"
                  }`}
                >
                  {currentTheme === "light" && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
              </div>
            </button>

            {/* 02. DARK THEME PREVIEW */}
            <button
              type="button"
              role="radio"
              aria-checked={currentTheme === "dark"}
              onClick={() => handleThemeChange("dark")}
              className={`group flex flex-col text-left p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer ${
                currentTheme === "dark"
                  ? "border-[#cc785c] bg-[#cc785c]/5 ring-2 ring-[#cc785c]/30 shadow-xs"
                  : "border-border/80 bg-muted/20 hover:border-border hover:bg-muted/40"
              }`}
            >
              {/* Miniature Dark Mockup */}
              <div className="relative w-full aspect-[16/10] rounded-lg overflow-hidden border border-zinc-800 bg-[#09090b] p-1 flex flex-col justify-between shadow-2xs select-none pointer-events-none">
                {/* Mini Top Bar */}
                <div className="flex items-center justify-between pb-0.5 border-b border-zinc-800">
                  <div className="flex items-center gap-0.5">
                    <div className="w-1 h-1 rounded-full bg-[#cc785c]" />
                    <div className="w-2.5 h-0.5 rounded-full bg-zinc-600" />
                  </div>
                  <div className="w-2 h-0.5 rounded-full bg-zinc-700" />
                </div>
                {/* Mini Content Grid */}
                <div className="flex gap-1 flex-1 pt-0.5">
                  <div className="w-2 bg-[#18181b] rounded-xs flex flex-col gap-0.5 p-0.5 border border-zinc-800/40">
                    <div className="w-full h-0.5 bg-zinc-600 rounded-full" />
                    <div className="w-full h-0.5 bg-zinc-700 rounded-full" />
                  </div>
                  <div className="flex-1 flex flex-col gap-0.5">
                    <div className="p-0.5 rounded-xs bg-[#18181b] border border-zinc-800 flex flex-col gap-0.5">
                      <div className="w-2/5 h-0.5 bg-[#cc785c] rounded-full" />
                      <div className="w-4/5 h-0.5 bg-zinc-700 rounded-full" />
                    </div>
                    <div className="flex gap-0.5">
                      <div className="flex-1 h-1 rounded-xs bg-[#18181b] border border-zinc-800/60" />
                      <div className="flex-1 h-1 rounded-xs bg-[#18181b] border border-zinc-800/60" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Label & Radio Indicator */}
              <div className="flex items-center justify-between w-full pt-2 px-0.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <VaahanIcon
                    name="moon"
                    size={13}
                    className={
                      currentTheme === "dark"
                        ? "text-[#cc785c] shrink-0"
                        : "text-muted-foreground shrink-0"
                    }
                  />
                  <span
                    className={`text-xs font-medium truncate ${
                      currentTheme === "dark"
                        ? "text-foreground font-semibold"
                        : "text-muted-foreground"
                    }`}
                  >
                    Dark
                  </span>
                </div>
                <div
                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                    currentTheme === "dark"
                      ? "border-[#cc785c] bg-[#cc785c]"
                      : "border-muted-foreground/30 bg-transparent"
                  }`}
                >
                  {currentTheme === "dark" && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
              </div>
            </button>

            {/* 03. SYSTEM THEME PREVIEW (SPLIT) */}
            <button
              type="button"
              role="radio"
              aria-checked={currentTheme === "system"}
              onClick={() => handleThemeChange("system")}
              className={`group flex flex-col text-left p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer ${
                currentTheme === "system"
                  ? "border-[#cc785c] bg-[#cc785c]/5 ring-2 ring-[#cc785c]/30 shadow-xs"
                  : "border-border/80 bg-muted/20 hover:border-border hover:bg-muted/40"
              }`}
            >
              {/* Miniature System Mockup (Split Light & Dark) */}
              <div className="relative w-full aspect-[16/10] rounded-lg overflow-hidden border border-border flex shadow-2xs select-none pointer-events-none">
                {/* Left Half: Light */}
                <div className="w-1/2 bg-white p-1 flex flex-col justify-between border-r border-zinc-200">
                  <div className="flex items-center gap-0.5 pb-0.5 border-b border-zinc-100">
                    <div className="w-1 h-1 rounded-full bg-[#cc785c]" />
                    <div className="w-2 h-0.5 rounded-full bg-zinc-300" />
                  </div>
                  <div className="flex-1 pt-0.5 flex flex-col gap-0.5">
                    <div className="p-0.5 rounded-xs bg-zinc-50 border border-zinc-100">
                      <div className="w-3/4 h-0.5 bg-[#cc785c] rounded-full mb-0.5" />
                      <div className="w-1/2 h-0.5 bg-zinc-200 rounded-full" />
                    </div>
                  </div>
                </div>
                {/* Right Half: Dark */}
                <div className="w-1/2 bg-[#09090b] p-1 flex flex-col justify-between">
                  <div className="flex items-center justify-end gap-0.5 pb-0.5 border-b border-zinc-800">
                    <div className="w-2 h-0.5 rounded-full bg-zinc-600" />
                  </div>
                  <div className="flex-1 pt-0.5 flex flex-col gap-0.5">
                    <div className="p-0.5 rounded-xs bg-[#18181b] border border-zinc-800">
                      <div className="w-3/4 h-0.5 bg-[#cc785c] rounded-full mb-0.5" />
                      <div className="w-1/2 h-0.5 bg-zinc-700 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Label & Radio Indicator */}
              <div className="flex items-center justify-between w-full pt-2 px-0.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <VaahanIcon
                    name="laptop"
                    size={13}
                    className={
                      currentTheme === "system"
                        ? "text-[#cc785c] shrink-0"
                        : "text-muted-foreground shrink-0"
                    }
                  />
                  <span
                    className={`text-xs font-medium truncate ${
                      currentTheme === "system"
                        ? "text-foreground font-semibold"
                        : "text-muted-foreground"
                    }`}
                  >
                    System
                  </span>
                </div>
                <div
                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                    currentTheme === "system"
                      ? "border-[#cc785c] bg-[#cc785c]"
                      : "border-muted-foreground/30 bg-transparent"
                  }`}
                >
                  {currentTheme === "system" && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
              </div>
            </button>
          </div>
        </div>

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
