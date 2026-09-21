"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { ScanHistoryHeader } from "./ScanHistoryHeader";
import { ScanSignalRail } from "./signals/ScanSignalRail";
import { ScanRhythmChart } from "./charts/ScanRhythmChart";
import { TemporalScanField } from "./charts/TemporalScanField";
import { QrScanDistribution } from "./charts/QrScanDistribution";
import { ScanEventRegistry } from "./registry/ScanEventRegistry";

import { ScanDetailSheet } from "./sheets/ScanDetailSheet";
import { ScanFiltersSheet } from "./sheets/ScanFiltersSheet";
import { MobileScanFiltersDrawer } from "./drawers/MobileScanFiltersDrawer";
import { ScanPrivacyDialog } from "./dialogs/ScanPrivacyDialog";
import { ScanHistoryEmptyState } from "./states/ScanHistoryEmptyState";

import type {
  ScanHistoryOverview,
  ScanHistoryFilterState,
  ScanEventItem,
  ScanPeriodFilter,
  ScanRhythmPoint,
} from "@/lib/scan-history-types";

interface ScanHistoryControllerProps {
  initialData: ScanHistoryOverview;
}

export function ScanHistoryController({ initialData }: ScanHistoryControllerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // 1. URL search parameters sync
  const initialPeriod = (searchParams.get("period") as ScanPeriodFilter) || initialData.appliedFilters.period || "30D";
  const initialVehicle = searchParams.get("vehicle") || initialData.appliedFilters.vehicleId || "all";
  const initialQr = searchParams.get("qr") || initialData.appliedFilters.qrPublicId || "all";
  const initialType = (searchParams.get("type") as any) || initialData.appliedFilters.eventType || "all";
  const initialDevice = (searchParams.get("device") as any) || initialData.appliedFilters.deviceCategory || "all";
  const initialSearch = searchParams.get("search") || initialData.appliedFilters.search || "";

  const [filters, setFilters] = useState<ScanHistoryFilterState>({
    period: initialPeriod,
    vehicleId: initialVehicle,
    qrPublicId: initialQr,
    eventType: initialType,
    deviceCategory: initialDevice,
    search: initialSearch,
  });

  // Modal / Sheet / Drawer States
  const [selectedEvent, setSelectedEvent] = useState<ScanEventItem | null>(null);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isPrivacyDialogOpen, setIsPrivacyDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync state with URL params
  const updateUrlParams = (newFilters: ScanHistoryFilterState) => {
    const params = new URLSearchParams();
    if (newFilters.period !== "30D") params.set("period", newFilters.period);
    if (newFilters.vehicleId !== "all") params.set("vehicle", newFilters.vehicleId);
    if (newFilters.qrPublicId !== "all") params.set("qr", newFilters.qrPublicId);
    if (newFilters.eventType !== "all") params.set("type", newFilters.eventType);
    if (newFilters.deviceCategory !== "all") params.set("device", newFilters.deviceCategory);
    if (newFilters.search) params.set("search", newFilters.search);

    const queryString = params.toString();
    startTransition(() => {
      router.replace(`${pathname}${queryString ? `?${queryString}` : ""}`, { scroll: false });
    });
  };

  const handleFilterChange = (updates: Partial<ScanHistoryFilterState>) => {
    const updated = { ...filters, ...updates };
    setFilters(updated);
    updateUrlParams(updated);
  };

  const handleClearFilters = () => {
    const resetState: ScanHistoryFilterState = {
      period: "30D",
      vehicleId: "all",
      qrPublicId: "all",
      eventType: "all",
      deviceCategory: "all",
      search: "",
    };
    setFilters(resetState);
    updateUrlParams(resetState);
    toast.info("Filters reset to default 30-day window.");
  };

  const handleRemoveFilter = (key: keyof ScanHistoryFilterState) => {
    const defaultVal = key === "period" ? "30D" : key === "search" ? "" : "all";
    handleFilterChange({ [key]: defaultVal });
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    startTransition(() => {
      router.refresh();
      setTimeout(() => {
        setIsRefreshing(false);
        toast.success("Scan history updated from Cloudflare telemetry.");
      }, 400);
    });
  };

  // Cross-chart interaction: Click on Scan Rhythm point filters to that date
  const handleSelectRhythmPoint = (point: ScanRhythmPoint) => {
    if (point.scanCount > 0) {
      handleFilterChange({ search: point.label });
      toast.info(`Filtered scan records for ${point.fullDate || point.label}`);
    }
  };

  // Cross-chart interaction: Click on QR in distribution chart scopes to that QR
  const handleSelectQrFromChart = (publicId: string) => {
    handleFilterChange({ qrPublicId: publicId });
    toast.info(`Scoped encounters to pass ${publicId}`);
  };

  // Case A: User has zero active vehicle passes linked
  if (!initialData.userHasQr) {
    return (
      <div className="space-y-6">
        <ScanHistoryHeader
          vehicles={[]}
          selectedVehicleId="all"
          onSelectVehicle={() => {}}
          onRefresh={handleRefresh}
          onOpenPrivacyDialog={() => setIsPrivacyDialogOpen(true)}
          isRefreshing={isRefreshing}
        />
        <ScanHistoryEmptyState hasActiveQr={false} />
        <ScanPrivacyDialog
          isOpen={isPrivacyDialogOpen}
          onClose={() => setIsPrivacyDialogOpen(false)}
        />
      </div>
    );
  }

  // Case B: User has active passes, but zero lifetime scans
  if (initialData.signals.totalScans === 0) {
    return (
      <div className="space-y-6">
        <ScanHistoryHeader
          vehicles={initialData.authorizedVehicles}
          selectedVehicleId={filters.vehicleId}
          onSelectVehicle={(vehId) => handleFilterChange({ vehicleId: vehId })}
          onRefresh={handleRefresh}
          onOpenPrivacyDialog={() => setIsPrivacyDialogOpen(true)}
          isRefreshing={isRefreshing}
        />
        <ScanSignalRail data={initialData.signals} />
        <ScanHistoryEmptyState hasActiveQr={true} />
        <ScanPrivacyDialog
          isOpen={isPrivacyDialogOpen}
          onClose={() => setIsPrivacyDialogOpen(false)}
        />
      </div>
    );
  }

  // Case C: Active scan history with telemetry
  return (
    <div className="space-y-6">
      {/* 01 Scan Context Header */}
      <ScanHistoryHeader
        vehicles={initialData.authorizedVehicles}
        selectedVehicleId={filters.vehicleId}
        onSelectVehicle={(vehId) => handleFilterChange({ vehicleId: vehId })}
        onRefresh={handleRefresh}
        onOpenPrivacyDialog={() => setIsPrivacyDialogOpen(true)}
        isRefreshing={isRefreshing}
      />

      {/* 02 Scan Signal Rail */}
      <ScanSignalRail data={initialData.signals} />

      {/* 03 Signature Visualization: Scan Rhythm */}
      <ScanRhythmChart
        data={initialData.rhythmSeries}
        period={filters.period}
        onPeriodChange={(newPeriod) => handleFilterChange({ period: newPeriod })}
        onSelectPoint={handleSelectRhythmPoint}
      />

      {/* 04 Secondary Visualizations: 2-Column Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <TemporalScanField data={initialData.temporalField} />
        <QrScanDistribution
          data={initialData.qrDistribution}
          onSelectQr={handleSelectQrFromChart}
        />
      </div>

      {/* 05 Security & Encounter Registry */}
      <ScanEventRegistry
        events={initialData.events}
        filters={filters}
        vehicles={initialData.authorizedVehicles}
        qrs={initialData.authorizedQrs}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        onRemoveFilter={handleRemoveFilter}
        onSelectEvent={(evt) => setSelectedEvent(evt)}
        onOpenFilterSheet={() => setIsFilterSheetOpen(true)}
        onOpenMobileDrawer={() => setIsFilterDrawerOpen(true)}
      />

      {/* Supporting Sheets & Dialogs */}
      <ScanDetailSheet
        event={selectedEvent}
        isOpen={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
      />

      <ScanFiltersSheet
        filters={filters}
        vehicles={initialData.authorizedVehicles}
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        onApply={(newFilters) => handleFilterChange(newFilters)}
        onReset={handleClearFilters}
      />

      <MobileScanFiltersDrawer
        filters={filters}
        vehicles={initialData.authorizedVehicles}
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        onApply={(newFilters) => handleFilterChange(newFilters)}
        onReset={handleClearFilters}
      />

      <ScanPrivacyDialog
        isOpen={isPrivacyDialogOpen}
        onClose={() => setIsPrivacyDialogOpen(false)}
      />
    </div>
  );
}
