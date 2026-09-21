"use client";

import type { PaymentPulseEvent } from "@/lib/payments-types";

interface PaymentChartTooltipProps {
  event: PaymentPulseEvent;
}

export function PaymentChartTooltip({ event }: PaymentChartTooltipProps) {
  const formattedDate = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(event.date));

  return (
    <div className="rounded-xl border border-[#252320] bg-[#181715] p-3 text-[#FAF9F5] shadow-xl text-left space-y-1.5 min-w-[170px] pointer-events-none">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1 text-[10px] font-mono uppercase text-muted-soft">
        <span>{formattedDate}</span>
        <span className="text-[#5db8a6] font-semibold">{event.status}</span>
      </div>

      <div className="space-y-0.5">
        <div className="font-mono text-base font-bold text-[#cc785c]">
          ₹{(event.amountMinor / 100).toLocaleString("en-IN")}
        </div>
        <div className="text-xs text-white/90 font-medium truncate">
          {event.purposeLabel}
        </div>
      </div>

      <div className="pt-1 border-t border-white/10 font-mono text-[10px] text-white/50 truncate">
        Order: {event.orderNumber}
      </div>
    </div>
  );
}
