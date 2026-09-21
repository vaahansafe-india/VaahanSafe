import * as React from "react";
import { VaahanIcon, type VaahanIconName } from "@vaahansafe/icons";
import { Button } from "../../components/button";

export interface EmptyStateProps {
  icon?: VaahanIconName;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function EmptyState({
  icon = "file",
  title,
  description,
  actionLabel,
  onAction,
  className = "",
  children,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-border bg-card/50 ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground mb-4">
        <VaahanIcon name={icon} size={24} />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-5 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm">
          {actionLabel}
        </Button>
      )}
      {children}
    </div>
  );
}
