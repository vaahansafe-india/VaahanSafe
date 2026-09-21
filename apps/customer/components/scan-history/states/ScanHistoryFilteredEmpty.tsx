"use client";

import { Button } from "@vaahansafe/ui";
import { VaahanIcon } from "@vaahansafe/icons";

interface ScanHistoryFilteredEmptyProps {
  onClearFilters: () => void;
}

export function ScanHistoryFilteredEmpty({ onClearFilters }: ScanHistoryFilteredEmptyProps) {
  return (
    <div className="py-12 px-4 text-center space-y-4">
      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <VaahanIcon name="filter" size={20} />
      </div>

      <div className="space-y-1 max-w-sm mx-auto">
        <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Zero Matches
        </div>
        <h3 className="font-serif text-lg font-medium text-foreground">
          No scans match these filters.
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Try adjusting your date range, vehicle scope, or search terms to view recorded activity.
        </p>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={onClearFilters}
        className="h-10 px-4 rounded-xl text-xs font-semibold gap-1.5 shadow-xs"
      >
        <span>Clear Filters</span>
        <VaahanIcon name="arrow-right" size={13} />
      </Button>
    </div>
  );
}
