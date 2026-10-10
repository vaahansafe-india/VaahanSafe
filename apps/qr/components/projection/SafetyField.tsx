import React from "react";
import { Badge } from "@vaahansafe/ui/components/badge";

export interface SafetyFieldProps {
  label: string;
  value?: string | null;
  isBloodGroup?: boolean;
}

export function SafetyField({
  label,
  value,
  isBloodGroup = false,
}: SafetyFieldProps) {
  if (!value || !value.trim()) {
    return null;
  }

  return (
    <div className="min-w-0 space-y-2">
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block">
        {label}
      </span>
      {isBloodGroup ? (
        <div className="flex min-w-0 flex-wrap items-start gap-x-2 gap-y-1 min-[360px]:flex-col sm:flex-row sm:items-center">
          <Badge
            variant="outline"
            className="font-mono text-base font-bold px-3 py-1 border-primary/30 bg-primary/5 text-primary"
          >
            {value.trim()}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Provided by owner
          </span>
        </div>
      ) : (
        <p className="break-words text-base font-medium text-foreground tracking-tight">
          {value.trim()}
        </p>
      )}
    </div>
  );
}
