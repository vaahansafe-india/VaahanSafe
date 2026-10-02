"use client";

import * as React from "react";
import { CustomerLink as Link } from "@/components/query/CustomerLink";
import { useCustomerRouter } from "@/lib/use-customer-router";
import { DashboardHeader } from "./DashboardHeader";
import { VehicleSummary } from "./VehicleSummary";
import { IdentityReadinessRail } from "./IdentityReadinessRail";
import { QuickCommandDeck } from "./QuickCommandDeck";
import { NeedsAttention } from "./NeedsAttention";
import { DashboardFilters } from "./DashboardFilters";
import { CommandPalette } from "./CommandPalette";
import { SafetyProjectionMatrix } from "./visualizations/SafetyProjectionMatrix";
import { QrLifeline } from "./visualizations/QrLifeline";
import { CommerceServicePanel } from "./CommerceServicePanel";
import { VehicleIdentitySheet } from "./sheets/VehicleIdentitySheet";
import { QrIdentitySheet } from "./sheets/QrIdentitySheet";
import { SafetyViewSheet } from "./sheets/SafetyViewSheet";
import { EmergencyContactSheet } from "./sheets/EmergencyContactSheet";
import { DashboardFilterSheet } from "./sheets/DashboardFilterSheet";
import { NotificationSheet } from "./sheets/NotificationSheet";
import { QrEventDialog } from "./dialogs/QrEventDialog";
import { ConstellationEventDialog } from "./dialogs/ConstellationEventDialog";
import { ReplacementConfirmAlert } from "./alerts/ReplacementConfirmAlert";
import { DashboardEmptyState } from "./states/DashboardEmptyState";
import type {
  DashboardOverviewData,
  DashboardQrLifelineEvent,
  DashboardConstellationEvent,
  DashboardAttentionItem,
} from "@/lib/dashboard-types";

interface DashboardControllerProps {
  initialData: DashboardOverviewData;
}

export function DashboardController({ initialData }: DashboardControllerProps) {
  const router = useCustomerRouter();
  const {
    vehicles,
    activeVehicle,
    qrSticker,
    safetyProfile: initialSafetyProfile,
    scanSummary,
    qrLifeline,
    constellationEvents,
    attentionItems,
    subscription,
    recentOrders,
    recentNotifications,
    unreadNotificationCount,
    filterState,
  } = initialData;

  // Real-time reactive safety profile state
  const [safetyProfile, setSafetyProfile] = React.useState(initialSafetyProfile);

  React.useEffect(() => {
    setSafetyProfile(initialSafetyProfile);
  }, [initialSafetyProfile]);

  // Active sheets
  const [vehicleSheetOpen, setVehicleSheetOpen] = React.useState(false);
  const [qrSheetOpen, setQrSheetOpen] = React.useState(false);
  const [safetySheetOpen, setSafetySheetOpen] = React.useState(false);
  const [contactsSheetOpen, setContactsSheetOpen] = React.useState(false);
  const [filtersSheetOpen, setFiltersSheetOpen] = React.useState(false);
  const [notificationsSheetOpen, setNotificationsSheetOpen] = React.useState(false);

  // Active dialogs & alerts
  const [selectedQrEvent, setSelectedQrEvent] = React.useState<DashboardQrLifelineEvent | null>(null);
  const [selectedConstellationEvent, setSelectedConstellationEvent] = React.useState<DashboardConstellationEvent | null>(null);
  const [replacementAlertOpen, setReplacementAlertOpen] = React.useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = React.useState(false);

  // Count active filters
  const activeFilterCount =
    (filterState.range !== "30d" ? 1 : 0) +
    (filterState.eventType ? 1 : 0) +
    (filterState.qrId ? 1 : 0);

  // Handle actions from NeedsAttention
  const handleAttentionAction = (target: DashboardAttentionItem["actionTarget"]) => {
    if (target === "emergency-contacts") setContactsSheetOpen(true);
    else if (target === "qr") setQrSheetOpen(true);
    else if (target === "safety-view") setSafetySheetOpen(true);
    else if (target === "vehicle") setVehicleSheetOpen(true);
    else if (target === "subscription") router.push("/subscription");
  };

  // If user has zero vehicles, display truthful empty state
  if (vehicles.length === 0 || !activeVehicle) {
    return <DashboardEmptyState />;
  }

  return (
    <div className="space-y-8 w-full">
      {/* 01. Context Bar & Page Header */}
      <DashboardHeader
        vehicles={vehicles}
        activeVehicle={activeVehicle}
        unreadNotifications={unreadNotificationCount}
        activeFilterCount={activeFilterCount}
        onOpenNotifications={() => setNotificationsSheetOpen(true)}
        onOpenFilters={() => setFiltersSheetOpen(true)}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
      />

      {/* 02. Attention Engine: Domain Audit Alert Strip */}
      {attentionItems.length > 0 && (
        <NeedsAttention
          items={attentionItems}
          onAction={handleAttentionAction}
        />
      )}

      <VehicleSummary
            vehicle={activeVehicle}
            qrSticker={qrSticker}
            onManageIdentity={() => setVehicleSheetOpen(true)}
            onViewQr={() => setQrSheetOpen(true)}
      />

      {/* 03. Identity Signal Strip */}
      <IdentityReadinessRail
        vehicle={activeVehicle}
        qrSticker={qrSticker}
        safetyProfile={safetyProfile}
        onOpenVehicleSheet={() => setVehicleSheetOpen(true)}
        onOpenQrSheet={() => setQrSheetOpen(true)}
        onOpenSafetySheet={() => setSafetySheetOpen(true)}
        onOpenContactsSheet={() => setContactsSheetOpen(true)}
      />

      {/* 04. Quick Commands Deck */}
      <QuickCommandDeck
        onManageVehicle={() => setVehicleSheetOpen(true)}
        onViewQr={() => setQrSheetOpen(true)}
        onEditSafetyView={() => setSafetySheetOpen(true)}
        onEmergencyContacts={() => setContactsSheetOpen(true)}
      />

      {/* 05. Global Filter Bar */}
      <DashboardFilters
        filterState={filterState}
        onOpenDetailedFilters={() => setFiltersSheetOpen(true)}
      />

      {/* 06. Scan Intelligence (Scan Pulse) */}
      <section className="paper-section" aria-labelledby="scan-intelligence-heading">
        <div className="flex items-center justify-between gap-3"><h2 id="scan-intelligence-heading" className="text-3xl">Scan activity</h2><Link href="/scan-history" className="text-sm text-[#a9583e] underline underline-offset-4">View history →</Link></div>
        <dl className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3">
          <div><dt className="paper-label">Total scans</dt><dd className="mt-2 font-serif text-4xl">{scanSummary.totalScans}</dd></div>
          <div><dt className="paper-label">Emergency scans</dt><dd className="mt-2 font-serif text-4xl">{scanSummary.emergencyScans}</dd></div>
          <div><dt className="paper-label">Last scan</dt><dd className="mt-2 text-sm">{scanSummary.lastScanAt ? new Date(scanSummary.lastScanAt).toLocaleString("en-IN") : "No scans yet"}</dd></div>
        </dl>
      </section>

      {/* 07. Safety Projection Matrix & QR Lifeline */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SafetyProjectionMatrix
          profile={safetyProfile}
          onEditSafetyView={() => setSafetySheetOpen(true)}
        />
        <QrLifeline
          events={qrLifeline}
          qrSticker={qrSticker}
          onSelectEvent={(evt) => setSelectedQrEvent(evt)}
          onRequestReplacement={() => setReplacementAlertOpen(true)}
        />
      </div>

      {/* 08. Activity Constellation (Cross-Domain Temporal Field) */}
      <section className="paper-section" aria-labelledby="recent-activity-heading">
        <h2 id="recent-activity-heading" className="text-3xl">Recent activity</h2>
        {constellationEvents.length ? <ul className="mt-5 divide-y divide-border">{constellationEvents.slice(0, 8).map(event => <li key={event.id}>
          <button onClick={() => setSelectedConstellationEvent(event)} className="flex w-full flex-wrap items-center justify-between gap-3 py-4 text-left hover:text-[#a9583e]">
            <span><span className="block text-sm font-medium">{event.title}</span><span className="mt-1 block text-xs text-muted-foreground">{event.summary}</span></span>
            <time dateTime={event.timestamp} className="text-xs text-muted-foreground">{new Date(event.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</time>
          </button>
        </li>)}</ul> : <p className="mt-4 text-sm text-muted-foreground">No activity in the selected period.</p>}
      </section>

      {/* 09. Service / Plan & Orders Panel */}
      <CommerceServicePanel
        subscription={subscription}
        orders={recentOrders}
      />

      {/* Contextual Sheets */}
      <VehicleIdentitySheet
        open={vehicleSheetOpen}
        onOpenChange={setVehicleSheetOpen}
        vehicle={activeVehicle}
        qrSticker={qrSticker}
      />

      <QrIdentitySheet
        open={qrSheetOpen}
        onOpenChange={setQrSheetOpen}
        qrSticker={qrSticker}
        vehicle={activeVehicle}
        onRequestReplacement={() => setReplacementAlertOpen(true)}
      />

      <SafetyViewSheet
        open={safetySheetOpen}
        onOpenChange={setSafetySheetOpen}
        vehicle={activeVehicle}
        profile={safetyProfile}
        onSaved={(updated) => {
          setSafetyProfile((prev) => ({
            ...prev,
            ...updated,
          }));
        }}
      />

      <EmergencyContactSheet
        open={contactsSheetOpen}
        onOpenChange={setContactsSheetOpen}
        contacts={safetyProfile.contacts}
        vehicle={activeVehicle}
      />

      <DashboardFilterSheet
        open={filtersSheetOpen}
        onOpenChange={setFiltersSheetOpen}
        vehicles={vehicles}
        activeVehicle={activeVehicle}
        filterState={filterState}
      />

      <NotificationSheet
        open={notificationsSheetOpen}
        onOpenChange={setNotificationsSheetOpen}
        notifications={recentNotifications}
        unreadCount={unreadNotificationCount}
      />

      {/* Dialogs & Alerts */}
      <QrEventDialog
        event={selectedQrEvent}
        onOpenChange={(open) => {
          if (!open) setSelectedQrEvent(null);
        }}
      />

      <ConstellationEventDialog
        event={selectedConstellationEvent}
        onOpenChange={(open) => {
          if (!open) setSelectedConstellationEvent(null);
        }}
      />

      <ReplacementConfirmAlert
        open={replacementAlertOpen}
        onOpenChange={setReplacementAlertOpen}
        qrSticker={qrSticker}
        vehicle={activeVehicle}
      />

      {/* Command Palette */}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        activeVehicle={activeVehicle}
        qrSticker={qrSticker}
        onOpenVehicleSheet={() => setVehicleSheetOpen(true)}
        onOpenQrSheet={() => setQrSheetOpen(true)}
        onOpenSafetySheet={() => setSafetySheetOpen(true)}
        onOpenContactsSheet={() => setContactsSheetOpen(true)}
      />
    </div>
  );
}
