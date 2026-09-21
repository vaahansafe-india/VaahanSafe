"use client";

import * as React from "react";
import { DashboardHeader } from "./DashboardHeader";
import { VehicleIdentityCore } from "./VehicleIdentityCore";
import { IdentityReadinessRail } from "./IdentityReadinessRail";
import { QuickCommandDeck } from "./QuickCommandDeck";
import { NeedsAttention } from "./NeedsAttention";
import { DashboardFilters } from "./DashboardFilters";
import { CommandPalette } from "./CommandPalette";
import { ScanPulse } from "./visualizations/ScanPulse";
import { IdentityOrbit } from "./visualizations/IdentityOrbit";
import { SafetyProjectionMatrix } from "./visualizations/SafetyProjectionMatrix";
import { QrLifeline } from "./visualizations/QrLifeline";
import { ActivityConstellation } from "./visualizations/ActivityConstellation";
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
  const {
    vehicles,
    activeVehicle,
    qrSticker,
    safetyProfile,
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
    else if (target === "subscription") window.location.href = "/subscription";
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

      {/* 03. Vehicle Identity Core & Topology Orbit Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
        <div className="lg:col-span-7 flex flex-col h-full">
          <VehicleIdentityCore
            vehicle={activeVehicle}
            qrSticker={qrSticker}
            safetyProfile={safetyProfile}
            onManageIdentity={() => setVehicleSheetOpen(true)}
            onViewQr={() => setQrSheetOpen(true)}
          />
        </div>

        <div className="lg:col-span-5 flex flex-col h-full">
          <IdentityOrbit
            vehicle={activeVehicle}
            qrSticker={qrSticker}
            safetyProfile={safetyProfile}
            onSelectVehicle={() => setVehicleSheetOpen(true)}
            onSelectQr={() => setQrSheetOpen(true)}
            onSelectSafetyView={() => setSafetySheetOpen(true)}
            onSelectContacts={() => setContactsSheetOpen(true)}
          />
        </div>
      </div>

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
      <section aria-labelledby="scan-intelligence-heading">
        <ScanPulse
          summary={scanSummary}
          vehiclePlate={activeVehicle.registrationNumber}
          qrVisibleCode={qrSticker?.visibleCode}
          onRangeChange={() => setFiltersSheetOpen(true)}
        />
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
      <section aria-labelledby="activity-constellation-heading">
        <ActivityConstellation
          events={constellationEvents}
          onSelectEvent={(evt) => setSelectedConstellationEvent(evt)}
        />
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
