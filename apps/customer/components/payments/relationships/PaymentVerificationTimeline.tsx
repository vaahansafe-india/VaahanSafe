"use client";

import { VaahanIcon } from "@vaahansafe/icons";
import type { VerificationMilestone } from "@/lib/payments-types";

interface PaymentVerificationTimelineProps {
  milestones: VerificationMilestone[];
}

export function PaymentVerificationTimeline({ milestones }: PaymentVerificationTimelineProps) {
  const formatDate = (isoString?: string | null) => {
    if (!isoString) return "Pending Verification";
    try {
      return new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(isoString));
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-4">
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        Server Verification Milestones
      </div>

      <div className="relative pl-6 sm:pl-8 space-y-5 before:absolute before:left-[11px] sm:before:left-[15px] before:top-2 before:bottom-2 before:w-[2px] before:bg-border">
        {milestones.map((m, idx) => {
          const isDone = m.status === "COMPLETED";
          const isCurrent = m.status === "CURRENT";
          const isFailed = m.status === "FAILED";

          return (
            <div key={m.stage} className="relative group">
              {/* Timeline Marker */}
              <div
                className={`absolute -left-6 sm:-left-8 top-0.5 flex size-6 sm:size-7 items-center justify-center rounded-full border shadow-xs transition-colors ${
                  isDone
                    ? "border-[#5db8a6]/50 bg-[#5db8a6]/10 text-[#5db8a6]"
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

              {/* Milestone Details */}
              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <h5 className="font-mono text-xs font-bold text-foreground">
                    {m.label}
                  </h5>
                  {m.timestamp && (
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {formatDate(m.timestamp)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
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
