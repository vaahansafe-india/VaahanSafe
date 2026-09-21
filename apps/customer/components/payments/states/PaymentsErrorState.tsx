"use client";

import { VaahanIcon } from "@vaahansafe/icons";
import { Button } from "@vaahansafe/ui";

interface PaymentsErrorStateProps {
  onRetry?: () => void;
}

export function PaymentsErrorState({ onRetry }: PaymentsErrorStateProps) {
  return (
    <div className="rounded-3xl border border-[#c64545]/30 bg-card p-8 sm:p-12 text-center space-y-4">
      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-[#c64545]/40 bg-[#c64545]/10 text-[#c64545]">
        <VaahanIcon name="alert" size={22} />
      </div>

      <div className="space-y-1.5 max-w-sm mx-auto">
        <h3 className="font-serif text-xl sm:text-2xl font-medium text-foreground">
          We Couldn&apos;t Load Your Payments
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          An operational connection issue occurred while reading your financial records. Your transaction data remains secure.
        </p>
      </div>

      {onRetry && (
        <Button
          type="button"
          onClick={onRetry}
          className="bg-[#cc785c] hover:bg-[#a9583e] text-white font-mono text-xs h-9 px-4"
        >
          <span>Retry Connection</span>
        </Button>
      )}
    </div>
  );
}
