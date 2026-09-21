"use client";

import { ScanJourneyNode } from "./ScanJourneyNode";
import type { ScanJourneyMilestone } from "@/lib/scan-history-types";

interface ScanJourneyProps {
  milestones: ScanJourneyMilestone[];
}

export function ScanJourney({ milestones }: ScanJourneyProps) {
  if (!milestones || milestones.length === 0) return null;

  return (
    <div className="rounded-xl border border-border/80 bg-background/50 p-4 space-y-3">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
        Encounter Journey
      </div>
      <div className="pt-1">
        {milestones.map((m, idx) => (
          <ScanJourneyNode
            key={m.key}
            milestone={m}
            isLast={idx === milestones.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
