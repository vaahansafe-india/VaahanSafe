import * as React from "react";

export interface SettingsGroupLabelProps {
  children: React.ReactNode;
  className?: string;
}

export function SettingsGroupLabel({
  children,
  className = "",
}: SettingsGroupLabelProps) {
  return (
    <h3
      className={`px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground/70 ${className}`}
    >
      {children}
    </h3>
  );
}
