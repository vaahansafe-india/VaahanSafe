"use client";

import { Input } from "@vaahansafe/ui";
import { VaahanIcon } from "@vaahansafe/icons";

interface ScanSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function ScanSearch({ value, onChange }: ScanSearchProps) {
  return (
    <div className="relative flex-1 min-w-[200px]">
      <VaahanIcon
        name="search"
        size={15}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
      />
      <Input
        type="search"
        placeholder="Search by pass ID, plate, model, region..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 pl-9 pr-8 text-xs rounded-xl border-border bg-card text-foreground placeholder:text-muted-foreground shadow-xs"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
        >
          <VaahanIcon name="close" size={13} />
        </button>
      )}
    </div>
  );
}
