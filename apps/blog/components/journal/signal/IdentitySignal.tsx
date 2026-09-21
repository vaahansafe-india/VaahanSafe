import * as React from "react";

interface IdentitySignalProps {
  className?: string;
  theme?: "light" | "dark";
}

export function IdentitySignal({ className = "", theme = "light" }: IdentitySignalProps) {
  const isDark = theme === "dark";

  return (
    <div
      className={`flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.24em] ${
        isDark ? "text-[#a09d96]" : "text-[#8e8b82] dark:text-[#77736d]"
      } ${className}`}
      aria-label="VaahanSafe Identity Signal Line"
    >
      <span className={isDark ? "text-[#faf9f5]" : "text-[#141413] dark:text-[#faf9f5]"}>
        VEHICLE
      </span>

      <span className="flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
        <span
          className={`h-px w-8 sm:w-16 ${
            isDark ? "bg-[#2e2b27]" : "bg-[#e6dfd8] dark:bg-[#2e2b27]"
          }`}
        />
      </span>

      <span className={isDark ? "text-[#faf9f5]" : "text-[#141413] dark:text-[#faf9f5]"}>
        IDENTITY
      </span>

      <span className="flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-[#5db8a6]" />
        <span
          className={`h-px w-8 sm:w-16 ${
            isDark ? "bg-[#2e2b27]" : "bg-[#e6dfd8] dark:bg-[#2e2b27]"
          }`}
        />
      </span>

      <span className={isDark ? "text-[#faf9f5]" : "text-[#141413] dark:text-[#faf9f5]"}>
        CONNECTION
      </span>

      <span className="h-1.5 w-1.5 rounded-full bg-[#e8a55a]" />
    </div>
  );
}
