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
    <div className="p-3.5 sm:p-5 space-y-1 w-full min-w-0">
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-muted-foreground truncate">
          {label}
        </span>
      </div>
      <div className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
        {value}
      </div>
      {hint && (
        <div className="font-sans text-[10px] sm:text-[11px] text-muted-foreground truncate">
          {hint}
        </div>
      )}
    </div>
  );
}
