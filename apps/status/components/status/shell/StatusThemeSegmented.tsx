"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { VaahanIcon } from "@vaahansafe/icons";

export function StatusThemeSegmented() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-7 w-44 rounded-lg border border-[#e6dfd8] bg-[#f5f0e8]/30 dark:border-[#2e2b27] dark:bg-[#1f1e1b]/30" />
    );
  }

  const options: Array<{
    key: "light" | "system" | "dark";
    label: string;
    icon: "sun" | "compass" | "moon";
  }> = [
    { key: "light", label: "Light", icon: "sun" },
    { key: "system", label: "System", icon: "compass" },
    { key: "dark", label: "Dark", icon: "moon" },
  ];

  return (
    <div
      role="group"
      aria-label="Theme selection"
      className="inline-flex items-center rounded-lg border border-[#e6dfd8] bg-[#f5f0e8]/50 p-0.5 dark:border-[#2e2b27] dark:bg-[#1f1e1b]/80"
    >
      {options.map((opt) => {
        const isActive = theme === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => setTheme(opt.key)}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-all ${
              isActive
                ? "bg-[#faf9f5] text-[#141413] shadow-xs dark:bg-[#282622] dark:text-[#faf9f5]"
                : "text-[#8e8b82] hover:text-[#141413] dark:text-[#77736d] dark:hover:text-[#faf9f5]"
            }`}
          >
            <VaahanIcon name={opt.icon} size={11} />
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
