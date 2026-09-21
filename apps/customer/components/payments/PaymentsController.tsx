"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { VaahanIcon } from "@vaahansafe/icons";
import { Button } from "@vaahansafe/ui";

import { PaymentsHeader } from "./PaymentsHeader";
import { PaymentSignalRail } from "./signals/PaymentSignalRail";
import { PaymentPulse } from "./charts/PaymentPulse";
import { PaymentStateMap } from "./charts/PaymentStateMap";
import { PaymentPurposeMap } from "./charts/PaymentPurposeMap";
import { PaymentFilters } from "./registry/PaymentFilters";
import { ActivePaymentFilters } from "./registry/ActivePaymentFilters";
import { PaymentRegistry } from "./registry/PaymentRegistry";
import { PaymentAttention } from "./states/PaymentAttention";
import { PaymentsEmptyState } from "./states/PaymentsEmptyState";

import { PaymentDetailsSheet } from "./sheets/PaymentDetailsSheet";
import { PaymentFiltersSheet } from "./sheets/PaymentFiltersSheet";
import { MobilePaymentFiltersDrawer } from "./drawers/MobilePaymentFiltersDrawer";
import { InvoiceDialog } from "./dialogs/InvoiceDialog";
import { RetryPaymentAlert } from "./alerts/RetryPaymentAlert";

import { refreshPaymentStatusAction, retryPaymentAction } from "@/lib/payments-actions";
import type {
  PaymentsPageData,
  PaymentRecordItem,
  PaymentFilterState,
  PaymentAttentionItem,
} from "@/lib/payments-types";

interface PaymentsControllerProps {
  initialData: PaymentsPageData;
}

export function PaymentsController({ initialData }: PaymentsControllerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // 1. URL search parameters sync
  const initialStatus = searchParams.get("status") || "all";
  const initialSearch = searchParams.get("search") || "";
  const initialVehicle = searchParams.get("vehicle") || "all";
  const initialPurpose = searchParams.get("purpose") || "all";

  const [filters, setFilters] = useState<PaymentFilterState>({
    status: initialStatus,
    search: initialSearch,
    vehicleId: initialVehicle,
    purpose: initialPurpose,
    period: "ALL",
  });

  // Modal / Sheet States
  const [selectedPaymentForDetails, setSelectedPaymentForDetails] = useState<PaymentRecordItem | null>(null);
  const [selectedPaymentForInvoice, setSelectedPaymentForInvoice] = useState<PaymentRecordItem | null>(null);
  const [selectedPaymentForRetry, setSelectedPaymentForRetry] = useState<PaymentRecordItem | null>(null);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // Sync state with URL params
  const updateUrlParams = (newFilters: PaymentFilterState) => {
    const params = new URLSearchParams();
    if (newFilters.status !== "all") params.set("status", newFilters.status);
    if (newFilters.search) params.set("search", newFilters.search);
    if (newFilters.vehicleId !== "all") params.set("vehicle", newFilters.vehicleId);
    if (newFilters.purpose !== "all") params.set("purpose", newFilters.purpose);

    const queryString = params.toString();
    startTransition(() => {
      router.replace(`${pathname}${queryString ? `?${queryString}` : ""}`, { scroll: false });
    });
  };

  const handleFilterChange = (updates: Partial<PaymentFilterState>) => {
    const updated = { ...filters, ...updates };
    setFilters(updated);
    updateUrlParams(updated);
  };

  const handleClearFilters = () => {
    const resetState: PaymentFilterState = {
      status: "all",
      search: "",
      vehicleId: "all",
      purpose: "all",
      period: "ALL",
    };
    setFilters(resetState);
    updateUrlParams(resetState);
  };

  const handleRemoveFilter = (key: keyof PaymentFilterState) => {
    const defaultValue = key === "search" ? "" : "all";
    handleFilterChange({ [key]: defaultValue });
  };

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.status !== "all") count++;
    if (filters.vehicleId !== "all") count++;
    if (filters.purpose !== "all") count++;
    if (filters.search.trim()) count++;
    return count;
  }, [filters]);

  // Selected vehicle display label
  const selectedVehicleLabel = useMemo(() => {
    if (filters.vehicleId === "all") return undefined;
    return initialData.vehicles.find((v) => v.id === filters.vehicleId)?.label;
  }, [filters.vehicleId, initialData.vehicles]);

  // Client-side filtering over authoritative records
  const filteredPayments = useMemo(() => {
    return initialData.payments.filter((payment) => {
      // 1. Status Filter
      if (filters.status !== "all") {
        if (filters.status === "confirmed" && payment.status !== "SUCCESS") return false;
        if (filters.status === "pending" && payment.status !== "PENDING") return false;
        if (filters.status === "failed" && payment.status !== "FAILED") return false;
      }

      // 2. Vehicle Filter
      if (filters.vehicleId !== "all") {
        if (!payment.vehicle || payment.vehicle.id !== filters.vehicleId) return false;
      }

      // 3. Purpose Filter
      if (filters.purpose !== "all") {
        if (payment.purpose !== filters.purpose) return false;
      }

      // 4. Search Filter (safe fields only)
      if (filters.search) {
        const query = filters.search.toLowerCase().trim();
        const matchesOrder = payment.orderNumber.toLowerCase().includes(query);
        const matchesRef = payment.paymentReference.toLowerCase().includes(query);
        const matchesDesc = payment.productDescription.toLowerCase().includes(query);
        const matchesPurpose = payment.purposeLabel.toLowerCase().includes(query);
        const matchesVehicle =
          payment.vehicle?.plateNumber.toLowerCase().includes(query) ||
          payment.vehicle?.makeModel.toLowerCase().includes(query);

        if (!matchesOrder && !matchesRef && !matchesDesc && !matchesPurpose && !matchesVehicle) {
          return false;
        }
      }

      return true;
    });
  }, [initialData.payments, filters]);

  // Attention actions handler
  const handleAttentionAction = async (item: PaymentAttentionItem) => {
    if (item.actionType === "REFRESH") {
      toast.promise(refreshPaymentStatusAction(item.paymentId), {
        loading: "Verifying gateway status with Cashfree...",
        success: (res) => {
          if (res.success) {
            router.refresh();
            return res.message || "Payment status refreshed";
          }
          throw new Error(res.message);
        },
        error: (err) => err.message || "Failed to refresh payment status",
      });
    } else if (item.actionType === "RETRY") {
      const payment = initialData.payments.find((p) => p.id === item.paymentId);
      if (payment) {
        setSelectedPaymentForRetry(payment);
      }
    }
  };

  // Retry payment execution
  const handleConfirmRetry = async (payment: PaymentRecordItem) => {
    setIsRetrying(true);
    try {
      const res = await retryPaymentAction(payment.orderId);
      if (res.success && res.data?.checkoutUrl) {
        toast.success("Preparing secure checkout...");
        router.push(res.data.checkoutUrl);
      } else {
        toast.error(res.message || "Unable to retry payment");
      }
    } catch {
      toast.error("An operational error occurred while retrying payment.");
    } finally {
      setIsRetrying(false);
      setSelectedPaymentForRetry(null);
    }
  };

  // If user has 0 payments recorded in D1
  if (initialData.payments.length === 0) {
    return (
      <div className="space-y-8">
        <PaymentsHeader
          totalConfirmedMinor={0}
          totalConfirmedCount={0}
          selectedVehicleId={filters.vehicleId}
          vehicles={initialData.vehicles}
          onVehicleChange={(vehicleId) => handleFilterChange({ vehicleId })}
        />
        <PaymentsEmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 01. EDITORIAL HEADER */}
      <PaymentsHeader
        totalConfirmedMinor={initialData.signals.totalConfirmedMinor}
        totalConfirmedCount={initialData.signals.totalConfirmedCount}
        selectedVehicleId={filters.vehicleId}
        vehicles={initialData.vehicles}
        onVehicleChange={(vehicleId) => handleFilterChange({ vehicleId })}
      />

      {/* 02. ATTENTION STATES (If pending/failed transactions exist) */}
      <PaymentAttention items={initialData.attentionItems} onAction={handleAttentionAction} />

      {/* 03. PAYMENT SIGNAL RAIL */}
      <PaymentSignalRail signals={initialData.signals} />

      {/* 04. FINANCIAL ACTIVITY VISUALIZATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Payment Pulse (Time / Activity) */}
        <div className="lg:col-span-8">
          <PaymentPulse events={initialData.pulseEvents} />
        </div>

        {/* State Map & Purpose Ledger */}
        <div className="lg:col-span-4 space-y-6">
          <PaymentStateMap composition={initialData.stateComposition} />
          <PaymentPurposeMap composition={initialData.purposeComposition} />
        </div>
      </div>

      {/* 05. FILTERS & SEARCH */}
      <div className="space-y-3 pt-2">
        <PaymentFilters
          filters={filters}
          vehicles={initialData.vehicles}
          onFilterChange={handleFilterChange}
          onOpenFilterSheet={() => {
            if (typeof window !== "undefined" && window.innerWidth < 768) {
              setIsFilterDrawerOpen(true);
            } else {
              setIsFilterSheetOpen(true);
            }
          }}
          activeFilterCount={activeFilterCount}
        />

        <ActivePaymentFilters
          filters={filters}
          vehicleLabel={selectedVehicleLabel}
          onRemoveFilter={handleRemoveFilter}
          onClearAll={handleClearFilters}
        />
      </div>

      {/* 06. PAYMENT REGISTRY */}
      <PaymentRegistry
        payments={filteredPayments}
        hasActiveFilters={activeFilterCount > 0}
        onClearFilters={handleClearFilters}
        onViewDetails={(payment) => setSelectedPaymentForDetails(payment)}
        onViewInvoice={(payment) => setSelectedPaymentForInvoice(payment)}
        onRetryPayment={(payment) => setSelectedPaymentForRetry(payment)}
      />

      {/* 07. PAYMENT RECONCILIATION & SUPPORT ASSISTANCE */}
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#cc785c]">
            Billing Support
          </div>
          <h4 className="font-serif text-base font-medium text-foreground">
            Have a question about a payment?
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            All payments are processed securely via RBI-authorized gateways with cryptographic webhook signatures.
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="font-mono text-xs border-border hover:bg-muted"
          >
            <a href="mailto:support@vaahansafe.com">
              <VaahanIcon name="mail" size={13} className="text-[#cc785c] mr-1.5" />
              <span>Contact Billing Desk</span>
            </a>
          </Button>
        </div>
      </div>

      {/* 08. SHEETS, DRAWERS & DIALOGS */}
      <PaymentDetailsSheet
        payment={selectedPaymentForDetails}
        isOpen={Boolean(selectedPaymentForDetails)}
        onClose={() => setSelectedPaymentForDetails(null)}
        onViewInvoice={(p) => setSelectedPaymentForInvoice(p)}
      />

      <InvoiceDialog
        payment={selectedPaymentForInvoice}
        isOpen={Boolean(selectedPaymentForInvoice)}
        onClose={() => setSelectedPaymentForInvoice(null)}
      />

      <PaymentFiltersSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        filters={filters}
        onApplyFilters={handleFilterChange}
        onResetFilters={handleClearFilters}
        vehicles={initialData.vehicles}
      />

      <MobilePaymentFiltersDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={filters}
        onApplyFilters={handleFilterChange}
        onResetFilters={handleClearFilters}
        vehicles={initialData.vehicles}
      />

      <RetryPaymentAlert
        payment={selectedPaymentForRetry}
        isOpen={Boolean(selectedPaymentForRetry)}
        onClose={() => setSelectedPaymentForRetry(null)}
        onConfirmRetry={handleConfirmRetry}
        isRetrying={isRetrying}
      />
    </div>
  );
}
