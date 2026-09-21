"use client";

import type { ReactNode } from "react";

interface PaymentSignalProps {
  label: string;
  value: ReactNode;
  hint?: string;
  isFirst?: boolean;
}

export function PaymentSignal({ label, value, hint, isFirst }: PaymentSignalProps) {
  return (
    <div className="flex-1 min-w-[140px] sm:min-w-[160px] p-4 sm:p-5 space-y-1">
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-foreground">
        {value}
      </div>
      {hint && (
        <div className="font-sans text-[11px] text-muted-foreground truncate">
          {hint}
        </div>
      )}
    </div>
  );
}
