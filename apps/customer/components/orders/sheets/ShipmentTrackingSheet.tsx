"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, Badge, Button, Separator, ScrollArea } from "@vaahansafe/ui/components";
import { VaahanIcon } from "@vaahansafe/icons";
import type { OrderListItem } from "@/lib/orders-types";

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
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col bg-background font-sans">
        {/* HEADER */}
        <SheetHeader className="p-6 border-b border-border/80 bg-card/60">
          <div className="flex items-center justify-between gap-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#cc785c]">
              Logistics Tracking
            </div>
            <Badge
              variant={isDelivered ? "success" : isShipped ? "default" : "outline"}
              className="font-mono text-[10px] uppercase tracking-wider"
            >
              {order.fulfillmentStage}
            </Badge>
          </div>

          <SheetTitle className="font-mono text-lg font-bold tracking-tight text-foreground mt-1">
            Fulfillment Journey
          </SheetTitle>

          <SheetDescription className="text-xs text-muted-foreground">
            Order Ref: {order.orderNumber}
          </SheetDescription>
        </SheetHeader>

        {/* TRACKING SUMMARY CARD */}
        <div className="p-6 pb-2">
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-muted-foreground">Courier Partner:</span>
              <span className="font-semibold text-foreground">{courierProvider}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-muted-foreground">Tracking Number:</span>
              <span className="font-mono font-bold text-[#cc785c]">{trackingNumber}</span>
            </div>

            {order.shippingAddress && (
              <div className="pt-2 border-t border-border/60 text-xs text-muted-foreground">
                <span className="font-mono text-[10px] uppercase text-muted-foreground/80 block">
                  Delivering to:
                </span>
                <span className="font-medium text-foreground">
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* TIMELINE EVENTS */}
        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-6 pl-4 border-l-2 border-border/80 my-2">
            {events.map((event, idx) => {
              const formattedEventDate = event.date
                ? new Date(event.date).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Pending stage";

              return (
                <div key={idx} className="relative pl-5">
                  {/* Node marker on vertical line */}
                  <div
                    className={`absolute -left-[23px] top-1 size-3.5 rounded-full border-2 ${
                      event.isCompleted
                        ? "border-teal-600 bg-teal-600"
                        : event.isCurrent
                        ? "border-[#cc785c] bg-[#cc785c] ring-3 ring-[#cc785c]/20"
                        : "border-border bg-background"
                    }`}
                  />

                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <span
                        className={`text-xs font-semibold ${
                          event.isCurrent
                            ? "text-[#cc785c]"
                            : event.isCompleted
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {event.title}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {formattedEventDate}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {event.description}
                    </p>

                    {event.location && (
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground/80 pt-0.5">
                        <VaahanIcon name="map-pin" className="size-3" />
                        <span>{event.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* FOOTER */}
        <div className="p-4 border-t border-border/80 bg-card/60 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose} className="font-mono text-xs">
            Close Tracking
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
