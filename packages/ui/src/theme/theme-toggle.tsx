"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { VaahanIcon } from "@vaahansafe/icons";
import { cn } from "../lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const baseClasses =
    "inline-flex items-center justify-center h-8 w-8 rounded-lg border border-border bg-background text-sm font-medium transition-colors hover:border-[#cc785c] hover:text-[#cc785c] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring shrink-0";

  if (!mounted) {
    return (
      <button
        type="button"
        className={cn(baseClasses, className)}
        aria-label="Toggle theme placeholder"
      >
        <span className="h-4 w-4" />
      </button>
    );
  }

  const isDark = (resolvedTheme || theme) === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(baseClasses, className)}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      title={`Switch to ${isDark ? "light" : "dark"} theme`}
    >
      {isDark ? (
        <VaahanIcon name="sun" size={15} className="text-amber-400" />
      ) : (
        <VaahanIcon name="moon" size={15} className="text-slate-700 dark:text-slate-300" />
      )}
    </button>
  );
}

