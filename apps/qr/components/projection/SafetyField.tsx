import React from "react";
import { Badge } from "@vaahansafe/ui/components";

export interface SafetyFieldProps {
  label: string;
  value?: string | null;
  isBloodGroup?: boolean;
}

export function SafetyField({ label, value, isBloodGroup = false }: SafetyFieldProps) {
  if (!value || !value.trim()) {
    return null;
  }

  return (
    <div className="space-y-1">
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block">
        {label}
      </span>
      {isBloodGroup ? (
        <div className="inline-flex items-center gap-2">
          <Badge
            variant="destructive"
            className="font-mono text-xs font-bold px-2.5 py-0.5 tracking-wider bg-red-600/90 hover:bg-red-600 text-white"
          >
            {value.trim()}
          </Badge>
          <span className="text-[11px] text-muted-foreground">Emergency Identification</span>
        </div>
      ) : (
        <p className="text-sm font-medium text-foreground tracking-tight">{value.trim()}</p>
      )}
    </div>
  );
}
