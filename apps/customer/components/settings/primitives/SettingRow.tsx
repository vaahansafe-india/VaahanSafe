import * as React from "react";

export interface SettingRowProps {
  title: string;
  description?: React.ReactNode;
  status?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  isDestructive?: boolean;
}

export function SettingRow({
  title,
  description,
  status,
  children,
  className = "",
  isDestructive = false,
}: SettingRowProps) {
  return (
    <div
      className={`flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between transition-colors border-b border-border/40 last:border-b-0 ${className}`}
    >
      <div className="space-y-0.5 pr-4 min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-sm font-medium leading-none ${
              isDestructive ? "text-destructive" : "text-foreground"
            }`}
          >
            {title}
          </span>
          {status}
        </div>
        {description && (
          <div className="text-xs text-muted-foreground leading-relaxed pt-0.5">
            {description}
          </div>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
          {children}
        </div>
      )}
    </div>
  );
}
