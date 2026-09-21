import React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

export interface MedicalInformationProps {
  notes?: string | null;
}

export function MedicalInformation({ notes }: MedicalInformationProps) {
  if (!notes || !notes.trim()) {
    return null;
  }

  return (
    <div className="space-y-2 pt-1">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <VaahanIcon name="alert" size={14} className="text-amber-600 dark:text-amber-500" />
        <span className="font-mono text-[10px] uppercase tracking-wider">
          Safety & Medical Information
        </span>
      </div>

      <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 text-xs text-foreground/90 leading-relaxed font-sans">
        {notes.trim()}
      </div>

      <p className="text-[10px] text-muted-foreground/80 leading-normal italic">
        Information is provided by the vehicle owner and may not be medically verified.
      </p>
    </div>
  );
}
