"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { VaahanIcon } from "@vaahansafe/icons";

interface StatusThemeToggleProps {
  className?: string;
}

export function StatusThemeToggle({ className = "" }: StatusThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Hydration-safe placeholder
  if (!mounted) {
    return (
      <div
        className={`h-8 w-8 rounded-lg border border-[#e6dfd8] bg-[#f5f0e8]/40 dark:border-[#2e2b27] dark:bg-[#1f1e1b]/40 ${className}`}
        aria-hidden="true"
      />
    );
  }

  const isDark = (resolvedTheme || theme) === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`group relative flex h-8 w-8 items-center justify-center rounded-lg border border-[#e6dfd8] bg-[#f5f0e8]/70 text-[#6c6a64] transition-all hover:border-[#cc785c]/40 hover:bg-[#faf9f5] hover:text-[#cc785c] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#cc785c] dark:border-[#2e2b27] dark:bg-[#1f1e1b] dark:text-[#a09d96] dark:hover:border-[#cc785c]/40 dark:hover:bg-[#282622] dark:hover:text-[#cc785c] ${className}`}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      title={`Switch to ${isDark ? "light" : "dark"} theme`}
    >
      {isDark ? (
        <VaahanIcon
          name="sun"
          size={14}
          className="text-[#e8a55a] transition-transform duration-200 group-hover:rotate-45"
        />
      ) : (
        <VaahanIcon
          name="moon"
          size={14}
          className="text-[#4f4d47] transition-transform duration-200 group-hover:-rotate-12"
        />
      )}
    </button>
  );
}
