"use client";

import React from "react";

interface ContactSignalProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
  className?: string;
}

export function ContactSignal({
  label,
  value,
  hint,
  className = "",
}: ContactSignalProps) {
  return (
    <div className={`flex flex-col py-1 px-3 ${className}`}>
      <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </span>
      <div className="mt-0.5 flex items-baseline gap-1.5 font-mono text-sm font-semibold text-foreground">
        {value}
        {hint && (
          <span className="text-[10px] font-normal text-muted-foreground">{hint}</span>
        )}
      </div>
    </div>
  );
}
