"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, Badge, Button, ScrollArea } from "@vaahansafe/ui/components";
import { cn } from "@vaahansafe/ui/lib/utils";
import { VaahanIcon } from "@vaahansafe/icons";
import type { OrderListItem } from "@/lib/orders-types";
import { formatFullIstTimestamp } from "@/lib/datetime";

interface ShipmentTrackingSheetProps {
  order: OrderListItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ShipmentTrackingSheet({
  order,
  isOpen,
  onClose,
}: ShipmentTrackingSheetProps) {
  if (!order) return null;

  const courierProvider = order.shipment?.provider || "VaahanSafe Direct Logistics";
  const trackingNumber = order.shipment?.trackingReference || "Pending Allocation";
  const isDelivered = order.fulfillmentStage === "DELIVERED";
  const isShipped = order.fulfillmentStage === "SHIPPED";
  const isCancelled = order.fulfillmentStage === "CANCELLED";

  // Build shipment timeline events from real data
  const events: Array<{
    date: string;
    title: string;
    description: string;
    location?: string;
    isCompleted: boolean;
    isCurrent: boolean;
  }> = [
    {
      date: order.createdAt,
      title: "Order Confirmed & Paid",
      description: "Payment authoritatively verified by payment gateway",
      location: "VaahanSafe Central Platform",
      isCompleted: true,
      isCurrent: order.fulfillmentStage === "ORDER_PLACED",
    },
    {
      date: order.fulfilment?.processingAt || order.paidAt || order.createdAt,
      title: "Allocated in Fulfillment Center",
      description: "QR sticker and companion guide verified from secure hardware inventory",
      location: "VaahanSafe Fulfillment Hub (Bengaluru)",
      isCompleted: ["PROCESSING", "PACKED", "SHIPPED", "DELIVERED"].includes(order.fulfillmentStage),
      isCurrent: order.fulfillmentStage === "PROCESSING",
    },
    {
      date: order.fulfilment?.packedAt || "",
      title: "Packed in Tamper-Evident Pouch",
      description: "Package sealed with security sticker and shipping label affixed",
      location: "VaahanSafe Fulfillment Hub (Bengaluru)",
      isCompleted: ["PACKED", "SHIPPED", "DELIVERED"].includes(order.fulfillmentStage),
      isCurrent: order.fulfillmentStage === "PACKED",
    },
    {
      date: order.shipment?.shippedAt || "",
      title: "Handed over to Courier Partner",
      description: `Dispatched via ${courierProvider}`,
      location: "Regional Courier Gateway",
      isCompleted: isShipped || isDelivered,
      isCurrent: isShipped,
    },
    {
      date: order.shipment?.deliveredAt || "",
      title: "Delivered to Customer",
      description: order.shippingAddress
        ? `Delivered to ${order.shippingAddress.city}, ${order.shippingAddress.state}`
        : "Delivered to registered shipping address",
      location: order.shippingAddress?.city,
      isCompleted: isDelivered,
      isCurrent: isDelivered,
    },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg h-full max-h-screen p-0 flex flex-col bg-background font-sans overflow-hidden"
      >
        {/* FIXED STICKY HEADER */}
        <div className="sticky top-0 z-10 shrink-0 border-b border-border/80 bg-card/95 backdrop-blur-md p-4 sm:p-6 pr-14 sm:pr-16 space-y-1">
          <SheetHeader className="text-left space-y-1 p-0">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-[#cc785c]">
              <span>Logistics Tracking</span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
              <SheetTitle className="font-mono text-lg sm:text-xl font-bold tracking-tight text-foreground truncate max-w-[calc(100%-85px)]">
                Fulfillment Journey
              </SheetTitle>
              <Badge
                variant={isDelivered ? "success" : isCancelled ? "destructive" : isShipped ? "default" : "outline"}
                className="font-mono text-[10px] uppercase tracking-wider shrink-0"
              >
                {order.fulfillmentStage}
              </Badge>
            </div>

            <SheetDescription className="text-xs text-muted-foreground truncate">
              Order Ref: {order.orderNumber}
            </SheetDescription>
          </SheetHeader>
        </div>

        {/* TRACKING SUMMARY CARD */}
        <div className="p-4 sm:p-6 pb-2 shrink-0">
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-1 text-xs">
              <span className="font-mono text-muted-foreground">Courier Partner:</span>
              <span className="font-semibold text-foreground">{courierProvider}</span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-1 text-xs">
              <span className="font-mono text-muted-foreground">Tracking Number:</span>
              <span className="font-mono font-bold text-[#cc785c]">{trackingNumber}</span>
            </div>

            {order.shippingAddress && (
              <div className="pt-2 border-t border-border/60 text-xs text-muted-foreground space-y-0.5">
                <span className="font-mono text-[10px] uppercase text-muted-foreground/80 block">
                  Delivering to:
                </span>
                <span className="font-medium text-foreground block break-words">
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* TIMELINE EVENTS */}
        <ScrollArea className="flex-1 px-4 sm:px-6 py-4">
          <div className="space-y-0 py-1">
            {events.map((event, idx) => {
              const isLast = idx === events.length - 1;
              const formattedEventDate = event.date
                ? formatFullIstTimestamp(event.date, { compact: true })
                : "Pending stage";

              return (
                <div key={idx} className="flex items-start gap-3.5 group">
                  {/* Marker + Track Column */}
                  <div className="flex flex-col items-center self-stretch shrink-0">
                    <div
                      className={cn(
                        "relative z-10 flex size-4 items-center justify-center rounded-full border-2 transition-all mt-0.5",
                        event.isCompleted
                          ? "border-teal-600 bg-teal-600 text-white shadow-xs"
                          : event.isCurrent
                          ? "border-[#cc785c] bg-[#cc785c] text-white ring-4 ring-[#cc785c]/20 shadow-xs"
                          : "border-border bg-background"
                      )}
                    >
                      {event.isCompleted ? (
                        <VaahanIcon name="check" className="size-2.5 stroke-[3]" />
                      ) : event.isCurrent ? (
                        <div className="size-1 rounded-full bg-white animate-pulse" />
                      ) : null}
                    </div>

                    {/* Connecting line between nodes - only rendered if NOT last */}
                    {!isLast && (
                      <div
                        className={cn(
                          "w-0.5 flex-1 min-h-[36px] my-1",
                          event.isCompleted ? "bg-teal-600/70" : "bg-border/80"
                        )}
                      />
                    )}
                  </div>

                  {/* Content Column */}
                  <div className={cn("min-w-0 flex-1 space-y-1", !isLast ? "pb-6" : "pb-2")}>
                    <div className="flex flex-wrap items-baseline justify-between gap-1">
                      <span
                        className={cn(
                          "text-xs font-semibold",
                          event.isCurrent
                            ? "text-[#cc785c]"
                            : event.isCompleted
                            ? "text-foreground"
                            : "text-muted-foreground"
                        )}
                      >
                        {event.title}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                        {formattedEventDate}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {event.description}
                    </p>

                    {event.location && (
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground/80 pt-0.5">
                        <VaahanIcon name="map-pin" className="size-3 shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* FOOTER */}
        <div className="sticky bottom-0 z-10 shrink-0 p-4 border-t border-border/80 bg-card/95 backdrop-blur-md flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose} className="font-mono text-xs">
            Close Tracking
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
