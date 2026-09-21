import * as React from "react";

export interface SettingsSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function SettingsSection({
  title,
  description,
  children,
  action,
  className = "",
}: SettingsSectionProps) {
  return (
    <section className={`space-y-1 ${className}`}>
      <div className="flex items-start justify-between gap-4 pb-2.5 border-b border-border/80">
        <div>
          <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-foreground">
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
              {description}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div>{children}</div>
    </section>
  );
}
