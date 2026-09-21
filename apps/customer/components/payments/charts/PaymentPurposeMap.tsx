"use client";

import type { PaymentPurposeItem } from "@/lib/payments-types";

interface PaymentPurposeMapProps {
  composition: PaymentPurposeItem[];
}

export function PaymentPurposeMap({ composition }: PaymentPurposeMapProps) {
  // Only render if the account actually has multiple distinct categories
  if (composition.length <= 1) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4">
      <div className="space-y-0.5">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#cc785c]">
          Allocation Ledger
        </div>
        <h3 className="font-serif text-lg font-medium text-foreground">
          Payments by Purpose
        </h3>
      </div>

      <div className="space-y-3">
        {composition.map((item) => (
          <div key={item.category} className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-foreground font-medium truncate">{item.label}</span>
              <span className="font-bold text-foreground">
                ₹{(item.amountMinor / 100).toLocaleString("en-IN")} ({item.percentage}%)
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted/60">
              <div
                className="h-full bg-[#cc785c] rounded-full transition-all duration-500"
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
