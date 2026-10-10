import React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

export interface ProjectionBoundaryProps {
  children: React.ReactNode;
}

export function ProjectionBoundary({ children }: ProjectionBoundaryProps) {
  return (
    <section className="w-full rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
      {/* Projection Top Frame Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/40 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <VaahanIcon name="shield" size={15} className="text-primary" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-foreground">
            Safety information
          </span>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground">
          Shared by the owner
        </span>
      </div>

      {/* Projection Content Body */}
      <div className="p-4 sm:p-5 space-y-4">{children}</div>

      {/* Signature Privacy Flow Footnote (Rule 37) */}
      <div className="px-4 py-2.5 bg-muted/20 border-t border-border/60 flex items-center justify-center text-center">
        <span className="font-mono text-[9px] sm:text-[10px] text-muted-foreground tracking-wider uppercase">
          Only details the owner has chosen to share
        </span>
      </div>
    </section>
  );
}
