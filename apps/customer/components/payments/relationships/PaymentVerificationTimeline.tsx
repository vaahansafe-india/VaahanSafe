"use client";

import { VaahanIcon } from "@vaahansafe/icons";
import type { VerificationMilestone } from "@/lib/payments-types";
import { formatMilestoneIst } from "@/lib/datetime";

interface PaymentVerificationTimelineProps {
  milestones: VerificationMilestone[];
}

export function PaymentVerificationTimeline({ milestones }: PaymentVerificationTimelineProps) {
  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between border-b border-border/70 pb-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Server Verification Milestones
        </span>
        <span className="font-mono text-[10px] text-[#5db8a6] font-semibold uppercase">
          Cryptographic Log
        </span>
      </div>

      <div className="space-y-0 pt-1">
        {milestones.map((m, idx) => {
          const isDone = m.status === "COMPLETED";
          const isCurrent = m.status === "CURRENT";
          const isFailed = m.status === "FAILED";
          const isLast = idx === milestones.length - 1;

          return (
            <div key={m.stage} className="relative flex items-start gap-3 sm:gap-3.5 group">
              {/* Marker Column */}
              <div className="relative flex flex-col items-center self-stretch shrink-0">
                {/* Node circle */}
                <div
                  className={`relative z-10 flex size-6 sm:size-7 items-center justify-center rounded-full border shadow-xs transition-colors ${
                    isDone
                      ? "border-[#5db8a6]/50 bg-[#5db8a6]/15 text-[#5db8a6]"
                      : isCurrent
                      ? "border-[#e8a55a] bg-[#e8a55a]/15 text-[#e8a55a]"
                      : isFailed
                      ? "border-[#c64545] bg-[#c64545]/10 text-[#c64545]"
                      : "border-border bg-card text-muted-foreground/40"
                  }`}
                >
                  {isDone ? (
                    <VaahanIcon name="check" size={13} />
                  ) : isCurrent ? (
                    <span className="size-2 rounded-full bg-[#e8a55a] animate-pulse" />
                  ) : isFailed ? (
                    <VaahanIcon name="alert" size={13} />
                  ) : (
                    <span className="size-1.5 rounded-full bg-muted-foreground/40" />
                  )}
                </div>

                {/* Connecting Line (stops at the last milestone, never hangs out) */}
                {!isLast && (
                  <div
                    className={`w-[2px] flex-1 my-1 transition-colors ${
                      isDone ? "bg-[#5db8a6]/35" : "bg-border/80"
                    }`}
                  />
                )}
              </div>

              {/* Milestone Details */}
              <div className={`flex-1 min-w-0 ${!isLast ? "pb-5 sm:pb-6" : "pb-1"} space-y-1`}>
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0.5 sm:gap-2">
                  <h5 className="font-mono text-xs font-bold text-foreground tracking-tight">
                    {m.label}
                  </h5>
                  {m.timestamp && (
                    <span className="font-mono text-[10px] sm:text-[11px] text-muted-foreground/80 shrink-0 tabular-nums">
                      {formatMilestoneIst(m.timestamp)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed break-words">
                  {m.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
