import * as React from "react";
import { VaahanSafeMark } from "@vaahansafe/ui";

interface DocumentCoverArtifactProps {
  docId: string;
  number: string;
  stepName: string;
  title: string;
  diagram: readonly string[];
  className?: string;
  compact?: boolean;
}

export function DocumentCoverArtifact({
  docId,
  number,
  stepName,
  title,
  diagram,
  className = "",
  compact = false,
}: DocumentCoverArtifactProps) {
  // Take up to 5 steps of the diagram for clean cover display
  const displaySteps = diagram.filter((line) => line !== "       ↓" && line !== "    ↓" && line !== "   ↓").slice(0, 4);

  return (
    <div
      className={`
        relative flex flex-col justify-between overflow-hidden
        rounded-lg border border-border bg-muted
        p-5 text-foreground shadow-sm transition-all
        dark:border-border dark:bg-zinc-950 dark:text-zinc-50
        ${compact ? "min-h-[220px] max-w-[280px]" : "min-h-[300px] w-full max-w-[340px]"}
        ${className}
      `}
      aria-hidden="true"
    >
      {/* Corner Technical Registration Marks */}
      <span className="absolute top-2 left-2 h-1.5 w-1.5 border-t border-l border-[#a1a1aa]/40" />
      <span className="absolute top-2 right-2 h-1.5 w-1.5 border-t border-r border-[#a1a1aa]/40" />
      <span className="absolute bottom-2 left-2 h-1.5 w-1.5 border-b border-l border-[#a1a1aa]/40" />
      <span className="absolute bottom-2 right-2 h-1.5 w-1.5 border-b border-r border-[#a1a1aa]/40" />

      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between border-b border-border pb-2 dark:border-white/[0.08]">
          <div className="flex items-center gap-1.5">
            <VaahanSafeMark size={14} aria-hidden="true" />
            <span className="font-mono text-[9px] font-semibold tracking-[0.2em] text-foreground dark:text-zinc-50">
              VAAHANSAFE
            </span>
          </div>
          <span className="font-mono text-[9px] font-medium tracking-wider text-[#cc785c]">
            {stepName}
          </span>
        </div>

        {/* Doc ID & Title */}
        <div className="mt-3">
          <div className="font-mono text-[10px] font-semibold tracking-[0.14em] text-muted-foreground dark:text-zinc-400">
            {docId}
          </div>
          <h4 className="mt-1 font-serif text-lg font-normal leading-tight tracking-tight text-foreground dark:text-zinc-50">
            {title}
          </h4>
        </div>

        {/* Rule with Coral Identity Pip */}
        <div className="mt-3 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
          <span className="h-px flex-1 bg-[#e4e4e7] dark:bg-white/[0.1]" />
        </div>
      </div>

      {/* Architectural Sequence Diagram */}
      <div className="my-3 space-y-1 rounded bg-background/80 p-2.5 font-mono text-[9px] text-[#3f3f46] dark:bg-zinc-900/60 dark:text-zinc-200">
        {displaySteps.map((step, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            <span className="text-muted-foreground">{idx === 0 ? "●" : "↓"}</span>
            <span className="truncate">{step}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border pt-2 font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground dark:border-white/[0.08] dark:text-zinc-500">
        <span>VAAHANSAFE / REFERENCE</span>
        <span className="font-semibold text-foreground dark:text-zinc-50">{number}</span>
      </div>
    </div>
  );
}
