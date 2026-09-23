import * as React from "react";

export interface SettingRowProps {
  title: string;
  description?: React.ReactNode;
  status?: React.ReactNode;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  isDestructive?: boolean;
  align?: "center" | "start";
  stackOnMobile?: boolean;
}

export function SettingRow({
  title,
  description,
  status,
  icon,
  children,
  className = "",
  isDestructive = false,
  align = "center",
  stackOnMobile = true,
}: SettingRowProps) {
  return (
    <div
      className={`p-4 sm:p-5 transition-colors hover:bg-muted/10 ${
        stackOnMobile
          ? "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
          : `flex flex-row ${
              align === "start" ? "items-start" : "items-center"
            } justify-between gap-3 sm:gap-4`
      } ${className}`}
    >
      <div className="flex items-start sm:items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
        {icon && <div className="shrink-0 mt-0.5 sm:mt-0">{icon}</div>}
        <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1 pr-1 sm:pr-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-sm font-medium leading-snug ${
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
      </div>
      {children && (
        <div
          className={`shrink-0 flex items-center gap-2 sm:gap-3 ${
            stackOnMobile
              ? `${icon ? "pl-13 sm:pl-0" : ""} self-start sm:self-center w-full sm:w-auto justify-start sm:justify-end`
              : "self-center justify-end"
          }`}
        >
          {children}
        </div>
      )}
    </div>
  );
}
