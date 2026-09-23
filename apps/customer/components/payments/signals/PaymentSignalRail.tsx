"use client";

import { PaymentSignal } from "./PaymentSignal";
import type { PaymentSignalMetrics } from "@/lib/payments-types";
import { formatDateIst } from "@/lib/datetime";

interface PaymentSignalRailProps {
  signals: PaymentSignalMetrics;
}

export function PaymentSignalRail({ signals }: PaymentSignalRailProps) {
  const formattedConfirmedAmount = `₹${(signals.totalConfirmedMinor / 100).toLocaleString("en-IN")}`;

  const formattedLastVerified = signals.lastVerifiedAt
    ? formatDateIst(signals.lastVerifiedAt)
    : "—";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
      {/* Subtle top registration hairline */}
      <div className="h-[2px] w-full bg-gradient-to-r from-[#cc785c] via-[#5db8a6] to-transparent opacity-60" />

      <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 divide-border/70 md:divide-x">
        <div className="border-r border-border/70 md:border-r-0">
          <PaymentSignal
            label="Total Confirmed"
            value={<span className="text-[#cc785c]">{formattedConfirmedAmount}</span>}
            hint="Server-verified financial volume"
            isFirst
          />
        </div>

        <div>
          <PaymentSignal
            label="Payments"
            value={signals.totalConfirmedCount}
            hint="Authoritative transactions"
          />
        </div>

        <div className="border-r border-border/70 md:border-r-0">
          <PaymentSignal
            label="Pending"
            value={
              signals.pendingCount > 0 ? (
                <span className="text-[#e8a55a]">{signals.pendingCount}</span>
              ) : (
                <span className="text-muted-foreground font-normal">0</span>
              )
            }
            hint={signals.pendingCount > 0 ? "Awaiting webhook proof" : "No pending confirmation"}
          />
        </div>

        <div>
          <PaymentSignal
            label="Last Verified"
            value={<span className="text-base sm:text-lg font-semibold">{formattedLastVerified}</span>}
            hint="Signed gateway event"
          />
        </div>
      </div>
    </div>
  );
}
