"use client";

import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import type { DashboardQrLifelineEvent, DashboardQrSticker } from "@/lib/dashboard-types";
import { formatFullIstTimestamp } from "@/lib/datetime";

interface QrLifelineProps {
  events: DashboardQrLifelineEvent[];
  qrSticker: DashboardQrSticker | null;
  onSelectEvent: (event: DashboardQrLifelineEvent) => void;
  onRequestReplacement: () => void;
}

export function QrLifeline({
  events,
  qrSticker,
  onSelectEvent,
  onRequestReplacement,
}: QrLifelineProps) {
  return (
    <div className="flex flex-col justify-between rounded-2xl sm:rounded-3xl border border-border bg-card p-4 sm:p-6 lg:p-7 shadow-sm w-full max-w-full overflow-hidden">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 border-b border-border pb-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-2 w-2 shrink-0 rounded-full bg-[#cc785c]" />
            <h3 className="font-mono text-[11px] sm:text-xs font-bold uppercase tracking-[0.16em] sm:tracking-[0.2em] text-foreground truncate">
              QR LIFELINE &bull; AUDIT TRAIL
            </h3>
          </div>

          {qrSticker && qrSticker.status === "ACTIVE" && (
            <button
              type="button"
              onClick={onRequestReplacement}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-muted/50 px-2.5 py-1.5 font-mono text-[11px] font-medium text-foreground hover:border-[#cc785c] hover:text-[#cc785c] shrink-0"
            >
              <VaahanIcon name="refresh" size={12} />
              <span>Replace Sticker</span>
            </button>
          )}
        </div>

        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
          Immutable chronological lifecycle milestones of this vehicle&apos;s physical QR safety identity.
        </p>

        {events.length === 0 ? (
          <div className="my-6 rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
            No QR sticker lifecycle recorded yet. Bind a sticker to begin tracking.
          </div>
        ) : (
          <div className="relative mt-6 space-y-4">
            {/* Lifeline Chronological Rail */}
            <ol className="relative border-l border-border/80 ml-2.5 sm:ml-3 space-y-4 sm:space-y-5">
              {events.map((evt, idx) => {
                const isLast = idx === events.length - 1;
                const isWarning = evt.status === "REPLACED" || evt.status === "SUSPENDED" || evt.status === "REVOKED";
                const isSuccess = evt.status === "ACTIVE";

                const dotColor = isWarning
                  ? "bg-[#c64545]"
                  : isSuccess
                  ? "bg-[#5db8a6]"
                  : "bg-[#cc785c]";

                return (
                  <li
                    key={evt.id}
                    onClick={() => onSelectEvent(evt)}
                    className="group ml-4 sm:ml-5 cursor-pointer"
                  >
                    {/* Node Dot */}
                    <span
                      className={`absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-card ${dotColor} transition-transform group-hover:scale-125`}
                    />

                    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                      <div className="font-mono text-xs font-bold text-foreground group-hover:text-[#cc785c] truncate">
                        {evt.title}
                      </div>
                      <time className="font-mono text-[10px] text-muted-foreground shrink-0">
                        {formatFullIstTimestamp(evt.timestamp, { compact: true })}
                      </time>
                    </div>

                    <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                      {evt.description}
                    </p>

                    <div className="mt-1 flex flex-wrap items-center gap-1.5 sm:gap-2 font-mono text-[9px] text-muted-foreground uppercase">
                      <span>Actor: {evt.actorType}</span>
                      {evt.reasonCode && (
                        <>
                          <span>&bull;</span>
                          <span className="truncate max-w-[200px]">Reason: {evt.reasonCode}</span>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </div>

      <div className="mt-4 border-t border-border pt-3 text-[10px] font-mono text-muted-foreground">
        CLICK EVENT MILESTONE TO VIEW AUDIT PAYLOAD
      </div>
    </div>
  );
}
