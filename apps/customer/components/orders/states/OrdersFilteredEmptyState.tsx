"use client";

import { Button } from "@vaahansafe/ui/components";
import { VaahanIcon } from "@vaahansafe/icons";

interface OrdersFilteredEmptyStateProps {
  onClearFilters: () => void;
}

export function OrdersFilteredEmptyState({
  onClearFilters,
}: OrdersFilteredEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 px-6 py-14 text-center shadow-xs">
      <div className="flex size-12 items-center justify-center rounded-xl border border-border bg-muted/50 text-muted-foreground">
        <VaahanIcon name="search" className="size-6" />
      </div>

      <h3 className="mt-4 font-serif text-lg font-medium tracking-tight text-foreground">
        No Matching Orders Found
      </h3>

      <p className="mt-1.5 max-w-sm text-xs text-muted-foreground">
        No fulfillment records matched your active search query or filter selection. Try adjusting your parameters.
      </p>

      <div className="mt-5">
        <Button
          onClick={onClearFilters}
          variant="outline"
          size="sm"
          className="gap-1.5 font-mono text-xs border-border hover:border-[#cc785c]/40 hover:bg-muted"
        >
          <VaahanIcon name="close" className="size-3.5" />
          <span>Clear All Filters</span>
        </Button>
      </div>
    </div>
  );
}
