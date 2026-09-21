"use client";

import type { ReactNode } from "react";

interface ScanSignalProps {
  label: string;
  value: ReactNode;
  subtitle?: string;
  isAccent?: boolean;
}

export function ScanSignal({ label, value, subtitle, isAccent }: ScanSignalProps) {
  return (
    <div className="flex-1 min-w-[140px] space-y-1">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </div>
      <div
        className={`font-mono text-2xl sm:text-3xl font-bold tracking-tight ${
          isAccent ? "text-primary" : "text-foreground"
        }`}
      >
        {value}
      </div>
      {subtitle && (
        <div className="text-[11px] font-mono text-muted-foreground truncate">
          {subtitle}
        </div>
      )}
    </div>
  );
}
