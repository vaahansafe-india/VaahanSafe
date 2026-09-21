"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { VaahanIcon } from "@vaahansafe/icons";

import { SubscriptionHeader } from "./SubscriptionHeader";
import { SubscriptionAttention } from "./SubscriptionAttention";
import { IdentityServicePrinciple } from "./IdentityServicePrinciple";
import { ServicePassport } from "./ServicePassport";
import { ServiceRelationshipRail } from "./ServiceRelationshipRail";
import { ConnectedVehicleIdentities } from "./ConnectedVehicleIdentities";
import { ServiceCapabilityLedger } from "./ServiceCapabilityLedger";
import { ServiceCommandDeck } from "./ServiceCommandDeck";
import { BillingPreview } from "./BillingPreview";
import { ServiceHistory } from "./ServiceHistory";

import { PlanDetailsSheet } from "./sheets/PlanDetailsSheet";
import { ManageSubscriptionSheet } from "./sheets/ManageSubscriptionSheet";
import { ServiceDetailsSheet } from "./sheets/ServiceDetailsSheet";
import { VehicleServiceSheet } from "./sheets/VehicleServiceSheet";
import { ExplorePlansSheet } from "./sheets/ExplorePlansSheet";

import { ServiceEventDialog } from "./dialogs/ServiceEventDialog";
import { PaymentDetailsDialog } from "./dialogs/PaymentDetailsDialog";
import { CancelRenewalAlert } from "./alerts/CancelRenewalAlert";
import { SubscriptionEmptyState } from "./states/SubscriptionEmptyState";

import { toggleAutoRenewalAction } from "@/lib/subscription-actions";
import type {
  SubscriptionServiceOverview,
  ConnectedVehicleServiceItem,
  ServiceCapabilityItem,
  ServiceHistoryTimelineEvent,
  BillingSummaryRecord,
} from "@/lib/subscription-types";

interface SubscriptionControllerProps {
  initialData: SubscriptionServiceOverview;
}

export function SubscriptionController({ initialData }: SubscriptionControllerProps) {
  const router = useRouter();

  const {
    passport,
    connectedVehicles,
    availablePlans,
    capabilities,
    billingRecords,
    historyEvents,
    attentionItems,
    scopedVehicleId,
  } = initialData;

  // Active Sheets
  const [planDetailsOpen, setPlanDetailsOpen] = React.useState(false);
  const [manageSubOpen, setManageSubOpen] = React.useState(false);
  const [explorePlansOpen, setExplorePlansOpen] = React.useState(false);
  const [serviceDetailsOpen, setServiceDetailsOpen] = React.useState(false);
  const [vehicleSheetOpen, setVehicleSheetOpen] = React.useState(false);

  // Active Dialogs & Alerts
  const [cancelAlertOpen, setCancelAlertOpen] = React.useState(false);
  const [selectedCapability, setSelectedCapability] = React.useState<ServiceCapabilityItem | null>(null);
  const [selectedVehicle, setSelectedVehicle] = React.useState<ConnectedVehicleServiceItem | null>(null);
  const [selectedEvent, setSelectedEvent] = React.useState<ServiceHistoryTimelineEvent | null>(null);
  const [selectedPaymentRecord, setSelectedPaymentRecord] = React.useState<BillingSummaryRecord | null>(null);

  // Mutation loading
  const [isUpdatingRenewal, setIsUpdatingRenewal] = React.useState(false);

  // Active vehicle reference
  const activeVehicle = scopedVehicleId
    ? connectedVehicles.find((v) => v.id === scopedVehicleId) || connectedVehicles[0]
    : connectedVehicles[0];

  // Handle empty vehicles state
  if (connectedVehicles.length === 0) {
    return <SubscriptionEmptyState />;
  }

  // Handlers for interactive sheets
  const handleInspectCapability = (cap: ServiceCapabilityItem) => {
    setSelectedCapability(cap);
    setServiceDetailsOpen(true);
  };

  const handleInspectVehicle = (v: ConnectedVehicleServiceItem) => {
    setSelectedVehicle(v);
    setVehicleSheetOpen(true);
  };

  const handleSelectEvent = (evt: ServiceHistoryTimelineEvent) => {
    setSelectedEvent(evt);
  };

  const handleViewReceipt = (rec: BillingSummaryRecord) => {
    setSelectedPaymentRecord(rec);
  };

  // Attention action routing
  const handleAttentionAction = (target: string) => {
    if (target === "payment") router.push("/payments");
    else if (target === "qr") router.push("/qr");
    else if (target === "vehicle") router.push("/vehicles");
    else if (target === "plan") setExplorePlansOpen(true);
  };

  // Toggle Auto-Renewal Mutation
  const handleConfirmCancelRenewal = async () => {
    if (!passport.id) return;
    setIsUpdatingRenewal(true);
    try {
      const result = await toggleAutoRenewalAction(passport.id, true);
      if (result.success) {
        toast.success(result.message);
        setCancelAlertOpen(false);
        setManageSubOpen(false);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to update renewal preference. Please try again.");
    } finally {
      setIsUpdatingRenewal(false);
    }
  };

  const handleResumeAutoRenewal = async () => {
    if (!passport.id) return;
    setIsUpdatingRenewal(true);
    try {
      const result = await toggleAutoRenewalAction(passport.id, false);
      if (result.success) {
        toast.success(result.message);
        setManageSubOpen(false);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to update renewal preference. Please try again.");
    } finally {
      setIsUpdatingRenewal(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 w-full max-w-7xl mx-auto pb-12">
      {/* 01. Service Context Header */}
      <SubscriptionHeader
        vehicles={connectedVehicles}
        scopedVehicleId={scopedVehicleId}
        onExplorePlans={() => setExplorePlansOpen(true)}
        onRefresh={() => router.refresh()}
      />

      {/* 02. Attention Engine */}
      {attentionItems.length > 0 && (
        <SubscriptionAttention
          items={attentionItems}
          onAction={handleAttentionAction}
        />
      )}

      {/* 03. Architecture Principle Explanatory Surface */}
      <IdentityServicePrinciple
        onLearnMore={() => setPlanDetailsOpen(true)}
      />

      {/* 04. Current Service Passport (Primary Dark Object) */}
      <ServicePassport
        passport={passport}
        activeVehicle={activeVehicle}
        onPlanDetails={() => setPlanDetailsOpen(true)}
        onManage={() => setManageSubOpen(true)}
        onExplorePlans={() => setExplorePlansOpen(true)}
      />

      {/* 05. Service Relationship Rail (5 Nodes) */}
      <ServiceRelationshipRail
        vehicle={activeVehicle}
        passport={passport}
        onOpenVehicle={() => {
          setSelectedVehicle(activeVehicle || null);
          setVehicleSheetOpen(true);
        }}
        onOpenIdentity={() => {
          setSelectedVehicle(activeVehicle || null);
          setVehicleSheetOpen(true);
        }}
        onOpenQr={() => router.push("/qr")}
        onOpenEntitlement={() => setPlanDetailsOpen(true)}
        onOpenServices={() => {
          const el = document.getElementById("enabled-services-ledger");
          el?.scrollIntoView({ behavior: "smooth" });
        }}
      />

      {/* 06. Connected Vehicle Identities & Fleet Ledger */}
      <ConnectedVehicleIdentities
        vehicles={connectedVehicles}
        scopedVehicleId={scopedVehicleId}
        onSelectVehicle={(id) => {
          router.push(`/subscription?vehicle=${id}`);
        }}
        onInspectVehicle={handleInspectVehicle}
        onAddVehicleService={() => router.push("/vehicles")}
      />

      {/* 07. What's Enabled: Service Capability Ledger */}
      <div id="enabled-services-ledger">
        <ServiceCapabilityLedger
          capabilities={capabilities}
          onInspectCapability={handleInspectCapability}
        />
      </div>

      {/* 08. Service Command Deck */}
      <ServiceCommandDeck
        onPlanDetails={() => setPlanDetailsOpen(true)}
        onManageSubscription={() => setManageSubOpen(true)}
        onExplorePlans={() => setExplorePlansOpen(true)}
        onAddVehicle={() => router.push("/vehicles")}
        hasActiveSubscription={passport.hasSubscription}
      />

      {/* 09. Billing & Payments Preview */}
      <BillingPreview
        records={billingRecords}
        onViewRecord={handleViewReceipt}
      />

      {/* 10. Service History Timeline */}
      <ServiceHistory
        events={historyEvents}
        onSelectEvent={handleSelectEvent}
      />

      {/* 11. Help & Invariant Verification Footer */}
      <div className="rounded-2xl border border-border/80 bg-card p-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <VaahanIcon name="shield" size={14} className="text-[#5db8a6]" />
          <span>Need assistance with your vehicle identity or subscription renewal?</span>
        </div>
        <div className="flex items-center gap-4 font-mono text-xs">
          <a
            href="mailto:support@vaahansafe.com"
            className="text-[#cc785c] hover:underline flex items-center gap-1"
          >
            <span>Contact Support</span>
            <VaahanIcon name="arrow-right" size={11} />
          </a>
        </div>
      </div>

      {/* Sheets */}
      <PlanDetailsSheet
        open={planDetailsOpen}
        onOpenChange={setPlanDetailsOpen}
        passport={passport}
        vehicles={connectedVehicles}
        capabilities={capabilities}
        onManagePlan={() => setManageSubOpen(true)}
        onExplorePlans={() => setExplorePlansOpen(true)}
      />

      <ManageSubscriptionSheet
        open={manageSubOpen}
        onOpenChange={setManageSubOpen}
        passport={passport}
        availablePlans={availablePlans}
        onRequestCancelRenewal={() => setCancelAlertOpen(true)}
        onEnableRenewal={handleResumeAutoRenewal}
        onExplorePlans={() => setExplorePlansOpen(true)}
        isUpdating={isUpdatingRenewal}
      />

      <ServiceDetailsSheet
        open={serviceDetailsOpen}
        onOpenChange={setServiceDetailsOpen}
        capability={selectedCapability}
      />

      <VehicleServiceSheet
        open={vehicleSheetOpen}
        onOpenChange={setVehicleSheetOpen}
        vehicle={selectedVehicle}
      />

      <ExplorePlansSheet
        open={explorePlansOpen}
        onOpenChange={setExplorePlansOpen}
        plans={availablePlans}
        currentPlanCode={passport.planCode}
      />

      {/* Dialogs */}
      <ServiceEventDialog
        open={Boolean(selectedEvent)}
        onOpenChange={(open) => {
          if (!open) setSelectedEvent(null);
        }}
        event={selectedEvent}
      />

      <PaymentDetailsDialog
        open={Boolean(selectedPaymentRecord)}
        onOpenChange={(open) => {
          if (!open) setSelectedPaymentRecord(null);
        }}
        record={selectedPaymentRecord}
      />

      {/* AlertDialogs */}
      <CancelRenewalAlert
        open={cancelAlertOpen}
        onOpenChange={setCancelAlertOpen}
        passport={passport}
        vehicles={connectedVehicles}
        onConfirm={handleConfirmCancelRenewal}
        isLoading={isUpdatingRenewal}
      />
    </div>
  );
}
