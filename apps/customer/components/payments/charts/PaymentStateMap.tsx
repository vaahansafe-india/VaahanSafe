"use client";

import { VaahanIcon } from "@vaahansafe/icons";
import type { PaymentStateComposition } from "@/lib/payments-types";

interface PaymentStateMapProps {
  composition: PaymentStateComposition;
}

export function PaymentStateMap({ composition }: PaymentStateMapProps) {
  const { confirmedCount, pendingCount, failedCount, totalCount, allConfirmed } = composition;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4">
      <div className="space-y-0.5">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#cc785c]">
          Payment State Map
        </div>
        <h3 className="font-serif text-lg font-medium text-foreground">
          Verification Composition
        </h3>
      </div>

      {totalCount === 0 ? (
        <div className="py-6 text-center text-xs text-muted-foreground font-mono">
          NO PAYMENTS RECORDED
        </div>
      ) : allConfirmed ? (
        <div className="rounded-xl border border-[#5db8a6]/40 bg-[#5db8a6]/[0.04] p-4 space-y-2">
          <div className="flex items-center gap-2 text-[#5db8a6]">
            <VaahanIcon name="check" size={16} />
            <span className="font-mono text-xs font-bold uppercase tracking-wider">
              All Recorded Payments Confirmed
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            100% of your transactions ({confirmedCount} {confirmedCount === 1 ? "payment" : "payments"}) have completed authoritative server verification via signed gateway events.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5 py-1">
          {/* Confirmed Rail */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-foreground font-semibold flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#5db8a6]" />
                CONFIRMED
              </span>
              <span className="text-foreground font-bold">{confirmedCount}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted/60">
              <div
                className="h-full bg-[#5db8a6] rounded-full transition-all duration-500"
                style={{ width: `${Math.round((confirmedCount / totalCount) * 100)}%` }}
              />
            </div>
          </div>

          {/* Pending Rail */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-foreground font-semibold flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#e8a55a]" />
                PENDING
              </span>
              <span className="text-foreground font-bold">{pendingCount}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted/60">
              <div
                className="h-full bg-[#e8a55a] rounded-full transition-all duration-500"
                style={{ width: `${Math.round((pendingCount / totalCount) * 100)}%` }}
              />
            </div>
          </div>

          {/* Failed Rail */}
          {failedCount > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-foreground font-semibold flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#c64545]" />
                  FAILED / DROPPED
                </span>
                <span className="text-foreground font-bold">{failedCount}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted/60">
                <div
                  className="h-full bg-[#c64545] rounded-full transition-all duration-500"
                  style={{ width: `${Math.round((failedCount / totalCount) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
