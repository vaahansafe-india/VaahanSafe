"use client";

import { VaahanIcon } from "@vaahansafe/icons";
import { Button } from "@vaahansafe/ui";

interface PaymentsFilteredEmptyStateProps {
  onClearFilters: () => void;
}

export function PaymentsFilteredEmptyState({ onClearFilters }: PaymentsFilteredEmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-8 sm:p-10 text-center space-y-4">
      <div className="mx-auto flex size-10 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground">
        <VaahanIcon name="filter" size={18} />
      </div>

      <div className="space-y-1">
        <h4 className="font-mono text-xs uppercase tracking-wider font-bold text-foreground">
          No Matching Payments
        </h4>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          No authoritative payment records match your active search and filter criteria.
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onClearFilters}
        className="font-mono text-xs border-border"
      >
        Clear Filters
      </Button>
    </div>
  );
}
