"use client";

import { VaahanIcon } from "@vaahansafe/icons";
import { Button } from "@vaahansafe/ui";
import type { PaymentAttentionItem } from "@/lib/payments-types";

interface PaymentAttentionProps {
  items: PaymentAttentionItem[];
  onAction: (item: PaymentAttentionItem) => void;
}

export function PaymentAttention({ items, onAction }: PaymentAttentionProps) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const isPending = item.type === "PENDING_VERIFICATION";
        const isFailed = item.type === "PAYMENT_FAILED";

        return (
          <div
            key={item.id}
            className={`rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
              isPending
                ? "border-[#e8a55a]/40 bg-[#e8a55a]/[0.05]"
                : isFailed
                ? "border-[#c64545]/40 bg-[#c64545]/[0.05]"
                : "border-border bg-card"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex size-8 shrink-0 items-center justify-center rounded-xl border mt-0.5 ${
                  isPending
                    ? "border-[#e8a55a]/40 bg-[#e8a55a]/10 text-[#e8a55a]"
                    : "border-[#c64545]/40 bg-[#c64545]/10 text-[#c64545]"
                }`}
              >
                <VaahanIcon name={isPending ? "clock" : "alert"} size={16} />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
                    {item.title}
                  </h4>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {item.orderNumber}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>

            <div className="shrink-0 self-start sm:self-center">
              <Button
                type="button"
                size="sm"
                onClick={() => onAction(item)}
                className={`font-mono text-xs font-semibold h-8.5 px-3.5 ${
                  isPending
                    ? "bg-[#e8a55a] hover:bg-[#d49348] text-white"
                    : "bg-[#c64545] hover:bg-[#b03a3a] text-white"
                }`}
              >
                {item.actionLabel}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
