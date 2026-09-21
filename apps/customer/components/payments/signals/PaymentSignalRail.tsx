"use client";

import { PaymentSignal } from "./PaymentSignal";
import type { PaymentSignalMetrics } from "@/lib/payments-types";

interface PaymentSignalRailProps {
  signals: PaymentSignalMetrics;
}

export function PaymentSignalRail({ signals }: PaymentSignalRailProps) {
  const formattedConfirmedAmount = `₹${(signals.totalConfirmedMinor / 100).toLocaleString("en-IN")}`;

  const formattedLastVerified = signals.lastVerifiedAt
    ? new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(signals.lastVerifiedAt))
    : "—";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
      {/* Subtle top registration hairline */}
      <div className="h-[2px] w-full bg-gradient-to-r from-[#cc785c] via-[#5db8a6] to-transparent opacity-60" />

      <div className="flex divide-x divide-border/70 overflow-x-auto scrollbar-none">
        <PaymentSignal
          label="Total Confirmed"
          value={<span className="text-[#cc785c]">{formattedConfirmedAmount}</span>}
          hint="Server-verified financial volume"
          isFirst
        />

        <PaymentSignal
          label="Payments"
          value={signals.totalConfirmedCount}
          hint="Authoritative transactions"
        />

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

        <PaymentSignal
          label="Last Verified"
          value={<span className="text-base sm:text-lg font-semibold">{formattedLastVerified}</span>}
          hint="Signed Cashfree event"
        />
      </div>
    </div>
  );
}
