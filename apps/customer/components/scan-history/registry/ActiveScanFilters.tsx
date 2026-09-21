"use client";

import { Badge, Button } from "@vaahansafe/ui";
import { VaahanIcon } from "@vaahansafe/icons";
import type {
  ScanHistoryFilterState,
  AuthorizedVehicleScope,
  AuthorizedQrScope,
} from "@/lib/scan-history-types";

interface ActiveScanFiltersProps {
  filters: ScanHistoryFilterState;
  vehicles: AuthorizedVehicleScope[];
  qrs: AuthorizedQrScope[];
  onRemoveFilter: (key: keyof ScanHistoryFilterState) => void;
  onClearAll: () => void;
}

export function ActiveScanFilters({
  filters,
  vehicles,
  qrs,
  onRemoveFilter,
  onClearAll,
}: ActiveScanFiltersProps) {
  const activeItems: Array<{ key: keyof ScanHistoryFilterState; label: string }> = [];

  if (filters.period !== "30D" && filters.period !== "ALL") {
    activeItems.push({ key: "period", label: filters.period });
  }

  if (filters.vehicleId !== "all") {
    const v = vehicles.find((x) => x.id === filters.vehicleId);
    activeItems.push({
      key: "vehicleId",
      label: v ? `${v.make} ${v.model}` : "Vehicle Filter",
    });
  }

  if (filters.qrPublicId !== "all") {
    const q = qrs.find((x) => x.publicId === filters.qrPublicId);
    activeItems.push({
      key: "qrPublicId",
      label: q ? q.maskedPublicId : filters.qrPublicId,
    });
  }

  if (filters.eventType !== "all") {
    activeItems.push({
      key: "eventType",
      label:
        filters.eventType === "EMERGENCY_TRIGGER"
          ? "Emergency"
          : filters.eventType === "PUBLIC_RESOLVE"
          ? "Public Scan"
          : "Inspection",
    });
  }

  if (filters.deviceCategory !== "all") {
    activeItems.push({
      key: "deviceCategory",
      label: filters.deviceCategory,
    });
  }

  if (filters.search) {
    activeItems.push({
      key: "search",
      label: `"${filters.search}"`,
    });
  }

  if (activeItems.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 pt-1">
      <span className="text-[11px] font-mono text-muted-foreground mr-1">
        Active Filters:
      </span>

      {activeItems.map((item) => (
        <Badge
          key={item.key}
          variant="outline"
          className="h-7 px-2.5 gap-1.5 rounded-lg border-border bg-card text-foreground font-mono text-[11px] font-normal hover:bg-muted/60"
        >
          <span>{item.label}</span>
          <button
            type="button"
            onClick={() => onRemoveFilter(item.key)}
            className="text-muted-foreground hover:text-foreground ml-0.5"
            aria-label={`Remove filter ${item.label}`}
          >
            <VaahanIcon name="close" size={11} />
          </button>
        </Badge>
      ))}

      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="h-7 px-2 text-xs font-mono text-primary hover:text-primary hover:bg-primary/10 shadow-none"
      >
        Clear all
      </Button>
    </div>
  );
}
