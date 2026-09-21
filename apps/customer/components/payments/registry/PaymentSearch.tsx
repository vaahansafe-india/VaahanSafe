"use client";

import { VaahanIcon } from "@vaahansafe/icons";

interface PaymentSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function PaymentSearch({
  value,
  onChange,
  placeholder = "Search by order #, product, or vehicle...",
}: PaymentSearchProps) {
  return (
    <div className="relative flex-1 min-w-[200px]">
      <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
        <VaahanIcon name="search" size={14} />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-xl border border-border bg-card pl-9 pr-8 font-sans text-xs text-foreground placeholder:text-muted-foreground/70 focus:border-[#cc785c] focus:outline-none focus:ring-1 focus:ring-[#cc785c] transition-all"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute inset-y-0 right-2.5 flex items-center text-muted-foreground hover:text-foreground"
        >
          <VaahanIcon name="close" size={12} />
        </button>
      )}
    </div>
  );
}
