"use client";

import { Badge } from "@vaahansafe/ui";
import { VaahanIcon } from "@vaahansafe/icons";
import type { ScanJourneyMilestone } from "@/lib/scan-history-types";

interface ScanJourneyNodeProps {
  milestone: ScanJourneyMilestone;
  isLast?: boolean;
}

export function ScanJourneyNode({ milestone, isLast }: ScanJourneyNodeProps) {
  return (
    <div className="relative flex gap-3.5 group">
      {/* Node Indicator */}
      <div className="flex flex-col items-center">
        <span
          className={`flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-mono transition-colors ${
            milestone.isCompleted
              ? "border-primary bg-primary text-primary-foreground font-bold shadow-xs"
              : "border-border bg-muted text-muted-foreground"
          }`}
        >
          {milestone.isCompleted ? (
            <VaahanIcon name="check" size={12} />
          ) : (
            <span className="size-1.5 rounded-full bg-muted-foreground" />
          )}
        </span>
        {!isLast && (
          <span
            className={`w-px flex-1 my-1 ${
              milestone.isCompleted ? "bg-primary/40" : "bg-border/60"
            }`}
          />
        )}
      </div>

      {/* Content */}
      <div className={`space-y-1 pb-5 ${isLast ? "pb-0" : ""}`}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground">
            {milestone.title}
          </span>
          {milestone.statusText && (
            <Badge
              variant={milestone.badgeVariant || "outline"}
              className="text-[9px] font-mono py-0"
            >
              {milestone.statusText}
            </Badge>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {milestone.description}
        </p>
      </div>
    </div>
  );
}
