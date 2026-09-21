"use client";

import { cn } from "@vaahansafe/ui/lib/utils";
import { VaahanIcon } from "@vaahansafe/icons";
import type { OrderListItem } from "@/lib/orders-types";

interface OrderMetadataStripProps {
  order: OrderListItem;
  className?: string;
  onSelectVehicle?: (vehicleId: string) => void;
  onOpenQr?: (qrId: string) => void;
}

export function OrderMetadataStrip({
  order,
  className,
}: OrderMetadataStripProps) {
  // Format masked delivery location for privacy in list view
  const deliveryLocation = order.shippingAddress
    ? [order.shippingAddress.city, order.shippingAddress.state].filter(Boolean).join(", ")
    : "Address on file";

  // Format courier summary
  const courierSummary = order.shipment?.trackingReference
    ? `${order.shipment.provider} (${order.shipment.trackingReference})`
    : order.fulfilment?.status === "PACKED"
    ? "Awaiting Courier Pickup"
    : order.fulfillmentStage === "PROCESSING"
    ? "Packaging in Progress"
    : "Standard Fulfillment";

  // Vehicle display
  const vehicleDisplay = order.vehicle
    ? `${order.vehicle.makeModel} (${order.vehicle.plateNumber})`
    : "Not yet bound";

  // QR display
  const qrDisplay = order.qrSticker
    ? order.qrSticker.visibleCode
    : order.paymentStatus === "PAID"
    ? "Allocating Identity"
    : "Post-payment Allocation";

  return (
    <div
      className={cn(
        "grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 border-t border-border/60 pt-3 text-xs text-muted-foreground",
        className
      )}
    >
      {/* DELIVERY */}
      <div className="flex items-start gap-2">
        <VaahanIcon name="map-pin" className="size-3.5 text-muted-foreground/70 shrink-0 mt-0.5" />
        <div className="min-w-0">
          <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/80">
            Delivery
          </div>
          <div className="font-medium text-foreground truncate mt-0.5" title={deliveryLocation}>
            {deliveryLocation}
          </div>
        </div>
      </div>

      {/* COURIER */}
      <div className="flex items-start gap-2">
        <VaahanIcon name="truck" className="size-3.5 text-muted-foreground/70 shrink-0 mt-0.5" />
        <div className="min-w-0">
          <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/80">
            Fulfillment
          </div>
          <div className="font-medium text-foreground truncate mt-0.5" title={courierSummary}>
            {courierSummary}
          </div>
        </div>
      </div>

      {/* VEHICLE */}
      <div className="flex items-start gap-2">
        <VaahanIcon name="vehicle" className="size-3.5 text-muted-foreground/70 shrink-0 mt-0.5" />
        <div className="min-w-0">
          <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/80">
            For Vehicle
          </div>
          <div className="font-medium text-foreground truncate mt-0.5" title={vehicleDisplay}>
            {vehicleDisplay}
          </div>
        </div>
      </div>

      {/* QR IDENTITY */}
      <div className="flex items-start gap-2">
        <VaahanIcon name="qr" className="size-3.5 text-muted-foreground/70 shrink-0 mt-0.5" />
        <div className="min-w-0">
          <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/80">
            QR Identity
          </div>
          <div className="font-mono text-[11px] font-semibold text-foreground truncate mt-0.5" title={qrDisplay}>
            {qrDisplay}
          </div>
        </div>
      </div>
    </div>
  );
}
