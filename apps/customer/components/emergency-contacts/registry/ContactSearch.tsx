"use client";

import React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

interface ContactSearchProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function ContactSearch({ value, onChange, className = "" }: ContactSearchProps) {
  return (
    <div className={`relative flex-1 min-w-[200px] ${className}`}>
      <VaahanIcon
        name="search"
        size={14}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search contacts by name, role, or vehicle..."
        className="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-9 text-xs text-foreground placeholder:text-muted-foreground focus:border-[#cc785c] focus:outline-none focus:ring-1 focus:ring-[#cc785c]"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
        >
          <VaahanIcon name="close" size={12} />
        </button>
      )}
    </div>
  );
}
