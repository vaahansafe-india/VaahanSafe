"use client";

import type { OrderListItem } from "@/lib/orders-types";
import { OrderRecord } from "./OrderRecord";
import { OrdersEmptyState } from "./states/OrdersEmptyState";
import { OrdersFilteredEmptyState } from "./states/OrdersFilteredEmptyState";

interface OrderRegistryProps {
  orders: OrderListItem[];
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onViewDetails: (order: OrderListItem) => void;
  onTrackShipment: (order: OrderListItem) => void;
  onViewReceipt: (order: OrderListItem) => void;
  onCancelOrder: (order: OrderListItem) => void;
}

export function OrderRegistry({
  orders,
  hasActiveFilters,
  onClearFilters,
  onViewDetails,
  onTrackShipment,
  onViewReceipt,
  onCancelOrder,
}: OrderRegistryProps) {
  if (orders.length === 0) {
    if (hasActiveFilters) {
      return <OrdersFilteredEmptyState onClearFilters={onClearFilters} />;
    }
    return <OrdersEmptyState />;
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <OrderRecord
          key={order.id}
          order={order}
          onViewDetails={onViewDetails}
          onTrackShipment={onTrackShipment}
          onViewReceipt={onViewReceipt}
          onCancelOrder={onCancelOrder}
        />
      ))}
    </div>
  );
}
