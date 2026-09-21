"use client";

import { VaahanIcon } from "@vaahansafe/icons";

interface PaymentChartEmptyProps {
  message?: string;
  subtext?: string;
}

export function PaymentChartEmpty({
  message = "NOT ENOUGH PAYMENT ACTIVITY YET",
  subtext = "Payment activity will appear here as verified transactions are recorded.",
}: PaymentChartEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-2 rounded-xl border border-dashed border-border/70 bg-background/50">
      <div className="flex size-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground">
        <VaahanIcon name="payment" size={16} className="text-[#cc785c]" />
      </div>
      <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground font-semibold">
        {message}
      </div>
      <p className="text-xs text-muted-foreground max-w-sm">
        {subtext}
      </p>
    </div>
  );
}
