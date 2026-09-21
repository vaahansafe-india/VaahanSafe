import React from "react";

export interface SafetyIdentityRailProps {
  currentStage?: "VEHICLE" | "QR" | "VIEW";
}

export function SafetyIdentityRail({ currentStage = "VIEW" }: SafetyIdentityRailProps) {
  return (
    <div className="w-full my-4 py-2" aria-label="Identity Resolution Rail">
      {/* Mobile Vertical Milestone Rail (<640px) */}
      <div className="sm:hidden flex flex-col space-y-1 font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
        <div className="flex items-center gap-3">
          <span className="size-2 rounded-full bg-foreground/60 shrink-0" />
          <span>Physical Vehicle</span>
        </div>
        <div className="w-px h-3.5 bg-border ml-[3.5px]" />
        <div className="flex items-center gap-3">
          <span className="size-2 rounded-full bg-foreground/60 shrink-0" />
          <span>QR Identity</span>
        </div>
        <div className="w-px h-3.5 bg-border ml-[3.5px]" />
        <div className="flex items-center gap-3">
          <span className="size-2 rounded-full bg-[#cc785c] ring-3 ring-[#cc785c]/20 shrink-0" />
          <span className="text-[#cc785c] font-semibold">Public Safety View</span>
        </div>
      </div>

      {/* Desktop Horizontal Milestone Rail (>=640px) */}
      <div className="hidden sm:flex items-center justify-between font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-foreground/60" />
          <span>Vehicle</span>
        </div>
        <div className="flex-1 h-px bg-border mx-3" />
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-foreground/60" />
          <span>QR Identity</span>
        </div>
        <div className="flex-1 h-px bg-border mx-3" />
        <div className="flex items-center gap-2 text-[#cc785c] font-semibold">
          <span className="size-2 rounded-full bg-[#cc785c] ring-3 ring-[#cc785c]/20" />
          <span>Safety View</span>
        </div>
      </div>
    </div>
  );
}
