import * as React from "react";

export interface SettingsSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  cardClassName?: string;
  noDivide?: boolean;
}

export function SettingsSection({
  title,
  description,
  children,
  action,
  className = "",
  cardClassName = "",
  noDivide = false,
}: SettingsSectionProps) {
  return (
    <section className={`space-y-2.5 ${className}`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-2.5 sm:gap-4 px-1">
        <div className="space-y-0.5 min-w-0 flex-1 w-full">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-foreground">
            {title}
          </h2>
          {description && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              {description}
            </p>
          )}
        </div>
        {action && (
          <div className="shrink-0 flex items-center justify-start sm:justify-end w-full sm:w-auto pt-0.5 sm:pt-0">
            {action}
          </div>
        )}
      </div>

      <div
        className={`rounded-2xl border border-border bg-card shadow-xs overflow-hidden ${
          noDivide ? "" : "divide-y divide-border/60"
        } ${cardClassName}`}
      >
        {children}
      </div>
    </section>
  );
}
