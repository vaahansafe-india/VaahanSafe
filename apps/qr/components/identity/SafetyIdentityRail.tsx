import React from "react";

export interface SafetyIdentityRailProps {
  currentStage?: "VEHICLE" | "QR" | "VIEW";
}

export function SafetyIdentityRail({ currentStage = "VIEW" }: SafetyIdentityRailProps) {
  return (
    <div className="space-y-2 pb-1" aria-label="Vehicle safety information">
      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-primary">{currentStage === "VIEW" ? "Here when you need it" : "VaahanSafe vehicle identity"}</p>
      <h1 className="font-serif font-medium tracking-tight text-foreground">Vehicle safety details</h1>
      <p className="text-sm leading-relaxed text-muted-foreground">Reach an approved contact or let the owner know about a concern.</p>
    </div>
  );
}
