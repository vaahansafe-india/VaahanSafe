"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { VaahanIcon } from "@vaahansafe/icons";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        className={`inline-flex items-center justify-center h-9 w-9 rounded-md border border-input bg-background text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${className || ""}`}
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
      className={`inline-flex items-center justify-center h-9 w-9 rounded-md border border-input bg-background text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${className || ""}`}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      title={`Switch to ${isDark ? "light" : "dark"} theme`}
    >
      {isDark ? (
        <VaahanIcon name="sun" size={18} className="text-amber-400" />
      ) : (
        <VaahanIcon name="moon" size={18} className="text-slate-700" />
      )}
    </button>
  );
}
