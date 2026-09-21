"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { VehicleRegistryHeader } from "./VehicleRegistryHeader";
import { VehicleRegistryItem } from "./VehicleRegistryItem";
import { VehicleEmptyState } from "./VehicleEmptyState";
import { VehicleFilterSheet } from "./VehicleFilterSheet";
import { VehicleDetailsSheet } from "./sheets/VehicleDetailsSheet";
import { QrIdentitySheet } from "./sheets/QrIdentitySheet";
import { SafetyViewSheet } from "./sheets/SafetyViewSheet";
import { RemoveVehicleAlert } from "./alerts/RemoveVehicleAlert";
import type {
  VehicleRegistryItem as VehicleItemType,
  VehicleFilterState,
} from "@/lib/vehicle-types";

interface VehicleRegistryProps {
  initialItems: VehicleItemType[];
  totalCount: number;
}

export function VehicleRegistry({ initialItems, totalCount }: VehicleRegistryProps) {
  const router = useRouter();

  const [filters, setFilters] = React.useState<VehicleFilterState>({
    query: "",
    types: [],
    qrStatus: "ALL",
    safetyStatus: "ALL",
    viewMode: "REGISTRY",
    sort: "RECENT",
  });

  const [isFilterSheetOpen, setIsFilterSheetOpen] = React.useState(false);

  // Active sheets & alert state
  const [activeDetailsVehicle, setActiveDetailsVehicle] =
    React.useState<VehicleItemType | null>(null);
  const [activeQrVehicle, setActiveQrVehicle] =
    React.useState<VehicleItemType | null>(null);
  const [activeSafetyVehicle, setActiveSafetyVehicle] =
    React.useState<VehicleItemType | null>(null);
  const [activeRemoveVehicle, setActiveRemoveVehicle] =
    React.useState<VehicleItemType | null>(null);

  // Filter items in client based on active filter state
  const filteredItems = React.useMemo(() => {
    let result = [...initialItems];

    if (filters.query && filters.query.trim()) {
      const q = filters.query.trim().toLowerCase();
      result = result.filter(
        (item) =>
          item.make.toLowerCase().includes(q) ||
          item.model.toLowerCase().includes(q) ||
          item.registrationNumber.toLowerCase().includes(q) ||
          item.registrationNumberNormalized.toLowerCase().includes(q) ||
          item.identityId.toLowerCase().includes(q)
      );
    }

    if (filters.types && filters.types.length > 0) {
      const allowed = new Set(filters.types);
      result = result.filter((item) => allowed.has(item.type));
    }

    if (filters.qrStatus && filters.qrStatus !== "ALL") {
      if (filters.qrStatus === "ACTIVE") {
        result = result.filter(
          (item) =>
            item.qr.hasQr &&
            (item.qr.status === "ACTIVE" || item.qr.status === "ACTIVATED")
        );
      } else if (filters.qrStatus === "UNLINKED") {
        result = result.filter(
          (item) => !item.qr.hasQr || item.qr.status === "UNLINKED"
        );
      }
    }

    if (filters.safetyStatus && filters.safetyStatus !== "ALL") {
      result = result.filter((item) => item.safety.status === filters.safetyStatus);
    }

    if (filters.sort === "NAME") {
      result.sort((a, b) =>
        `${a.make} ${a.model}`.localeCompare(`${b.make} ${b.model}`)
      );
    } else if (filters.sort === "ATTENTION") {
      result.sort((a, b) => b.attention.length - a.attention.length);
    } else {
      result.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    return result;
  }, [initialItems, filters]);

  const handleRefresh = () => {
    router.refresh();
  };

  const hasAnyFilterActive =
    Boolean(filters.query && filters.query.trim().length > 0) ||
    Boolean(filters.types && filters.types.length > 0) ||
    filters.qrStatus !== "ALL" ||
    filters.safetyStatus !== "ALL";

  return (
    <div className="space-y-8">
      {/* 01. Header Surface */}
      <VehicleRegistryHeader
        totalCount={totalCount}
        filters={filters}
        onFilterChange={setFilters}
        onOpenFilterSheet={() => setIsFilterSheetOpen(true)}
      />

      {/* 02. Core Content */}
      {totalCount === 0 ? (
        <VehicleEmptyState isFiltered={false} />
      ) : filteredItems.length === 0 ? (
        <VehicleEmptyState
          isFiltered={true}
          onClearFilters={() =>
            setFilters({
              ...filters,
              query: "",
              types: [],
              qrStatus: "ALL",
              safetyStatus: "ALL",
            })
          }
        />
      ) : (
        <div
          className={
            filters.viewMode === "COMPACT"
              ? "rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border"
              : "space-y-4"
          }
        >
          {filteredItems.map((item, idx) => (
            <VehicleRegistryItem
              key={item.id}
              item={item}
              index={idx}
              viewMode={filters.viewMode}
              onOpenDetails={setActiveDetailsVehicle}
              onOpenQr={setActiveQrVehicle}
              onOpenSafety={setActiveSafetyVehicle}
              onOpenRemove={setActiveRemoveVehicle}
            />
          ))}
        </div>
      )}

      {/* 03. Interactive Sheets & Alert Dialogs */}
      <VehicleFilterSheet
        open={isFilterSheetOpen}
        onOpenChange={setIsFilterSheetOpen}
        filters={filters}
        onApplyFilters={setFilters}
        totalMatches={filteredItems.length}
      />

      <VehicleDetailsSheet
        open={Boolean(activeDetailsVehicle)}
        onOpenChange={(open) => !open && setActiveDetailsVehicle(null)}
        vehicle={activeDetailsVehicle}
        onSuccess={handleRefresh}
      />

      <QrIdentitySheet
        open={Boolean(activeQrVehicle)}
        onOpenChange={(open) => !open && setActiveQrVehicle(null)}
        vehicle={activeQrVehicle}
      />

      <SafetyViewSheet
        open={Boolean(activeSafetyVehicle)}
        onOpenChange={(open) => !open && setActiveSafetyVehicle(null)}
        vehicle={activeSafetyVehicle}
        onSuccess={handleRefresh}
      />

      <RemoveVehicleAlert
        open={Boolean(activeRemoveVehicle)}
        onOpenChange={(open) => !open && setActiveRemoveVehicle(null)}
        vehicle={activeRemoveVehicle}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
