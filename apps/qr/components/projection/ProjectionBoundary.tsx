import React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

export interface ProjectionBoundaryProps {
  children: React.ReactNode;
}

export function ProjectionBoundary({ children }: ProjectionBoundaryProps) {
  return (
    <section className="w-full rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
      {/* Projection Top Frame Header */}
      <div className="px-4 py-3 bg-muted/40 border-b border-border/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <VaahanIcon name="shield" size={15} className="text-primary" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-foreground">
            Public Safety View
          </span>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground">
          Controlled Projection
        </span>
      </div>

      {/* Projection Content Body */}
      <div className="p-4 sm:p-5 space-y-4">{children}</div>

      {/* Signature Privacy Flow Footnote (Rule 37) */}
      <div className="px-4 py-2.5 bg-muted/20 border-t border-border/60 flex items-center justify-center text-center">
        <span className="font-mono text-[9px] sm:text-[10px] text-muted-foreground tracking-wider uppercase">
          Private Account &bull; Controlled Projection &bull; Public Safety View
        </span>
      </div>
    </section>
  );
}
