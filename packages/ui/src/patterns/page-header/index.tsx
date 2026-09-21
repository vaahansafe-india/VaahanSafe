import * as React from "react";
import { Badge } from "../../components/badge";

export interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  badge,
  actions,
  children,
  className = "",
}: PageHeaderProps) {
  return (
    <div
      className={`flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-6 pt-2 ${className}`}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          {badge && <Badge variant="secondary">{badge}</Badge>}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}
