"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { OrdersPageData, OrderListItem, OrderFilterState } from "@/lib/orders-types";
import { OrdersHero } from "./OrdersHero";
import { OrderStatusTabs } from "./OrderStatusTabs";
import { OrderFilters } from "./OrderFilters";
import { OrderRegistry } from "./OrderRegistry";
import { OrderHelp } from "./OrderHelp";
import { OrderDetailsSheet } from "./sheets/OrderDetailsSheet";
import { ShipmentTrackingSheet } from "./sheets/ShipmentTrackingSheet";
import { OrderFiltersSheet } from "./sheets/OrderFiltersSheet";
import { MobileOrderFiltersDrawer } from "./drawers/MobileOrderFiltersDrawer";
import { ReceiptDialog } from "./dialogs/ReceiptDialog";
import { CancelOrderAlert } from "./alerts/CancelOrderAlert";

interface OrdersControllerProps {
  initialData: OrdersPageData;
}

export function OrdersController({ initialData }: OrdersControllerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // 1. URL search parameters sync
  const initialStatus = searchParams.get("status") || "all";
  const initialSearch = searchParams.get("search") || "";
  const initialVehicle = searchParams.get("vehicle") || "all";
  const initialPayment = searchParams.get("payment") || "all";

  const [filters, setFilters] = useState<OrderFilterState>({
    status: initialStatus,
    search: initialSearch,
    vehicleId: initialVehicle,
    paymentStatus: initialPayment,
  });

  // Modal / Sheet States
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<OrderListItem | null>(null);
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState<OrderListItem | null>(null);
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState<OrderListItem | null>(null);
  const [selectedOrderForCancel, setSelectedOrderForCancel] = useState<OrderListItem | null>(null);
  const [isFiltersSheetOpen, setIsFiltersSheetOpen] = useState(false);
  const [isFiltersDrawerOpen, setIsFiltersDrawerOpen] = useState(false);

  // Sync state to URL without reloading
  const updateUrlParams = (newFilters: OrderFilterState) => {
    const params = new URLSearchParams();
    if (newFilters.status && newFilters.status !== "all") params.set("status", newFilters.status);
    if (newFilters.search) params.set("search", newFilters.search);
    if (newFilters.vehicleId && newFilters.vehicleId !== "all") params.set("vehicle", newFilters.vehicleId);
    if (newFilters.paymentStatus && newFilters.paymentStatus !== "all") params.set("payment", newFilters.paymentStatus);

    const query = params.toString();
    const targetUrl = query ? `${pathname}?${query}` : pathname;
    startTransition(() => {
      router.replace(targetUrl, { scroll: false });
    });
  };

  const handleFilterChange = (partial: Partial<OrderFilterState>) => {
    const updated = { ...filters, ...partial };
    setFilters(updated);
    updateUrlParams(updated);
  };

  const handleClearFilters = () => {
    const reset = { status: "all", search: "", vehicleId: "all", paymentStatus: "all" };
    setFilters(reset);
    updateUrlParams(reset);
  };

  // Active filter count (excluding default 'all')
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.status && filters.status !== "all") count++;
    if (filters.search) count++;
    if (filters.vehicleId && filters.vehicleId !== "all") count++;
    if (filters.paymentStatus && filters.paymentStatus !== "all") count++;
    return count;
  }, [filters]);

  // Filtered orders computation
  const filteredOrders = useMemo(() => {
    return initialData.orders.filter((order) => {
      // 1. Status Filter
      if (filters.status && filters.status !== "all") {
        const targetStatus = filters.status.toLowerCase();
        if (targetStatus === "processing") {
          if (!["ORDER_PLACED", "PAYMENT_CONFIRMED", "PROCESSING", "PACKED"].includes(order.fulfillmentStage)) {
            return false;
          }
        } else if (targetStatus === "shipped") {
          if (order.fulfillmentStage !== "SHIPPED") return false;
        } else if (targetStatus === "delivered") {
          if (order.fulfillmentStage !== "DELIVERED") return false;
        } else if (targetStatus === "cancelled") {
          if (order.fulfillmentStage !== "CANCELLED") return false;
        }
      }

      // 2. Vehicle Filter
      if (filters.vehicleId && filters.vehicleId !== "all") {
        if (!order.vehicle || order.vehicle.id !== filters.vehicleId) {
          return false;
        }
      }

      // 3. Payment Filter
      if (filters.paymentStatus && filters.paymentStatus !== "all") {
        if (order.paymentStatus.toLowerCase() !== filters.paymentStatus.toLowerCase()) {
          return false;
        }
      }

      // 4. Search Filter
      if (filters.search) {
        const query = filters.search.toLowerCase().trim();
        const matchesNumber = order.orderNumber.toLowerCase().includes(query);
        const matchesProduct = order.items.some((i) => i.name.toLowerCase().includes(query));
        const matchesVehicle =
          order.vehicle?.plateNumber.toLowerCase().includes(query) ||
          order.vehicle?.makeModel.toLowerCase().includes(query);
        const matchesTracking = order.shipment?.trackingReference?.toLowerCase().includes(query);
        const matchesAddress =
          order.shippingAddress?.city.toLowerCase().includes(query) ||
          order.shippingAddress?.state.toLowerCase().includes(query);

        if (!matchesNumber && !matchesProduct && !matchesVehicle && !matchesTracking && !matchesAddress) {
          return false;
        }
      }

      return true;
    });
  }, [initialData.orders, filters]);

  return (
    <div className="space-y-8">
      {/* 1. HERO PRODUCT & HARDWARE PRESENTATION */}
      <OrdersHero />

      {/* 2. NAVIGATION & STATUS TABS */}
      <OrderStatusTabs
        activeStatus={filters.status}
        onStatusChange={(status) => handleFilterChange({ status })}
        counts={initialData.counts}
      />

      {/* 3. SEARCH & QUICK FILTER BAR */}
      <OrderFilters
        filters={filters}
        vehicles={initialData.vehicles}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        onOpenFiltersSheet={() => {
          if (typeof window !== "undefined" && window.innerWidth < 768) {
            setIsFiltersDrawerOpen(true);
          } else {
            setIsFiltersSheetOpen(true);
          }
        }}
        activeFilterCount={activeFilterCount}
      />

      {/* 4. ASYMMETRIC MAIN GRID (Desktop >= 1280: 8-9 cols main, 3-4 cols side) */}
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        {/* Main Orders Registry Column */}
        <div className="xl:col-span-8 2xl:col-span-9">
          <OrderRegistry
            orders={filteredOrders}
            hasActiveFilters={activeFilterCount > 0}
            onClearFilters={handleClearFilters}
            onViewDetails={(order) => setSelectedOrderForDetails(order)}
            onTrackShipment={(order) => setSelectedOrderForTracking(order)}
            onViewReceipt={(order) => setSelectedOrderForReceipt(order)}
            onCancelOrder={(order) => setSelectedOrderForCancel(order)}
          />
        </div>

        {/* Side Panel Column (Help & Fulfillment Support) */}
        <div className="xl:col-span-4 2xl:col-span-3 space-y-6">
          <OrderHelp
            onTrackSelected={() => {
              if (filteredOrders.length > 0 && filteredOrders[0]) {
                setSelectedOrderForTracking(filteredOrders[0]);
              }
            }}
          />
        </div>
      </div>

      {/* 5. SHEETS, DRAWERS & DIALOGS */}
      <OrderDetailsSheet
        order={selectedOrderForDetails}
        isOpen={Boolean(selectedOrderForDetails)}
        onClose={() => setSelectedOrderForDetails(null)}
        onViewReceipt={(order) => {
          setSelectedOrderForDetails(null);
          setSelectedOrderForReceipt(order);
        }}
        onTrackShipment={(order) => {
          setSelectedOrderForDetails(null);
          setSelectedOrderForTracking(order);
        }}
        onCancelOrder={(order) => {
          setSelectedOrderForDetails(null);
          setSelectedOrderForCancel(order);
        }}
      />

      <ShipmentTrackingSheet
        order={selectedOrderForTracking}
        isOpen={Boolean(selectedOrderForTracking)}
        onClose={() => setSelectedOrderForTracking(null)}
      />

      <ReceiptDialog
        order={selectedOrderForReceipt}
        isOpen={Boolean(selectedOrderForReceipt)}
        onClose={() => setSelectedOrderForReceipt(null)}
      />

      <CancelOrderAlert
        order={selectedOrderForCancel}
        isOpen={Boolean(selectedOrderForCancel)}
        onClose={() => setSelectedOrderForCancel(null)}
        onSuccess={() => {
          router.refresh();
        }}
      />

      <OrderFiltersSheet
        isOpen={isFiltersSheetOpen}
        onClose={() => setIsFiltersSheetOpen(false)}
        filters={filters}
        vehicles={initialData.vehicles}
        onApplyFilters={(newFilters) => {
          setFilters(newFilters);
          updateUrlParams(newFilters);
        }}
        onResetFilters={handleClearFilters}
      />

      <MobileOrderFiltersDrawer
        isOpen={isFiltersDrawerOpen}
        onClose={() => setIsFiltersDrawerOpen(false)}
        filters={filters}
        vehicles={initialData.vehicles}
        onApplyFilters={(newFilters) => {
          setFilters(newFilters);
          updateUrlParams(newFilters);
        }}
        onResetFilters={handleClearFilters}
      />
    </div>
  );
}
