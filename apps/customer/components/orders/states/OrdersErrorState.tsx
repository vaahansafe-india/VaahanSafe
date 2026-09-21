"use client";

import { Button } from "@vaahansafe/ui/components";
import { VaahanIcon } from "@vaahansafe/icons";

interface OrdersErrorStateProps {
  onRetry?: () => void;
}

export function OrdersErrorState({ onRetry }: OrdersErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5 px-6 py-16 text-center shadow-xs">
      <div className="flex size-14 items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/10 text-destructive">
        <VaahanIcon name="alert" className="size-7" />
      </div>

      <div className="mt-4 font-mono text-[10px] uppercase tracking-[0.24em] text-destructive">
        Fulfillment Query Error
      </div>

      <h3 className="mt-1 font-serif text-xl font-medium tracking-tight text-foreground">
        We Couldn&apos;t Load Your Orders
      </h3>

      <p className="mt-2 max-w-md text-xs text-muted-foreground leading-relaxed">
        We encountered an operational issue while retrieving your fulfillment history. Please refresh or try again in a few moments.
      </p>

      <div className="mt-6 flex gap-3">
        <Button
          onClick={() => {
            if (onRetry) onRetry();
            else window.location.reload();
          }}
          className="bg-[#cc785c] hover:bg-[#a9583e] text-white font-mono text-xs uppercase tracking-wider h-10 px-5 gap-1.5"
        >
          <VaahanIcon name="refresh" className="size-3.5" />
          <span>Retry Connection</span>
        </Button>
      </div>
    </div>
  );
}
