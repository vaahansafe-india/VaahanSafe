"use client";

import Link from "next/link";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, Badge, Button, Separator, ScrollArea } from "@vaahansafe/ui/components";
import { VaahanIcon } from "@vaahansafe/icons";
import type { OrderListItem } from "@/lib/orders-types";
import { ProductMedia } from "../media/ProductMedia";
import { FulfillmentRail } from "../FulfillmentRail";

interface OrderDetailsSheetProps {
  order: OrderListItem | null;
  isOpen: boolean;
  onClose: () => void;
  onViewReceipt: (order: OrderListItem) => void;
  onTrackShipment: (order: OrderListItem) => void;
  onCancelOrder: (order: OrderListItem) => void;
}

export function OrderDetailsSheet({
  order,
  isOpen,
  onClose,
  onViewReceipt,
  onTrackShipment,
  onCancelOrder,
}: OrderDetailsSheetProps) {
  if (!order) return null;

  const formattedDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const paymentBadgeVariant =
    order.paymentStatus === "PAID"
      ? "success"
      : order.paymentStatus === "FAILED"
      ? "destructive"
      : order.paymentStatus === "REFUNDED"
      ? "secondary"
      : "outline";

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col bg-background font-sans">
        {/* HEADER */}
        <SheetHeader className="p-6 border-b border-border/80 bg-card/60">
          <div className="flex items-center justify-between gap-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#cc785c]">
              Order Dossier
            </div>
            <Badge variant={paymentBadgeVariant} className="font-mono text-[10px] uppercase tracking-wider">
              {order.paymentStatus}
            </Badge>
          </div>

          <SheetTitle className="font-mono text-lg font-bold tracking-tight text-foreground mt-1">
            {order.orderNumber}
          </SheetTitle>

          <SheetDescription className="text-xs text-muted-foreground">
            Placed on {formattedDate} &bull; Total ₹{(order.totalMinor / 100).toFixed(0)}
          </SheetDescription>
        </SheetHeader>

        {/* BODY SCROLL */}
        <ScrollArea className="flex-1 px-6 py-5">
          <div className="space-y-6">
            {/* 1. FULFILLMENT TIMELINE */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Fulfillment Status
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onTrackShipment(order)}
                  className="h-7 px-2 font-mono text-[11px] text-[#cc785c] hover:bg-[#cc785c]/10"
                >
                  <span>Track Courier</span>
                  <VaahanIcon name="arrow-right" className="size-3 ml-1" />
                </Button>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <FulfillmentRail steps={order.timelineSteps} stage={order.fulfillmentStage} />
              </div>
            </div>

            <Separator />

            {/* 2. PRODUCT LINE ITEMS */}
            <div className="space-y-3">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Items In This Order
              </span>

              <div className="space-y-2.5">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3.5 rounded-xl border border-border bg-card p-3.5"
                  >
                    <ProductMedia
                      media={order.productMedia}
                      variant="thumbnail"
                      className="size-14 rounded-lg shrink-0"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-foreground truncate">
                        {item.name}
                      </div>
                      <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                        Qty: {item.quantity} &bull; Unit: ₹{(item.unitPriceMinor / 100).toFixed(0)}
                      </div>
                    </div>

                    <div className="font-mono text-xs font-bold text-foreground shrink-0">
                      ₹{(item.totalPriceMinor / 100).toFixed(0)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* 3. PAYMENT BREAKDOWN */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Payment Summary
                </span>
                {order.paymentStatus === "PAID" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewReceipt(order)}
                    className="h-7 px-2 font-mono text-[11px] text-[#cc785c] hover:bg-[#cc785c]/10"
                  >
                    <VaahanIcon name="receipt" className="size-3 mr-1" />
                    <span>View Receipt</span>
                  </Button>
                )}
              </div>

              <div className="rounded-xl border border-border bg-card p-4 space-y-2 font-mono text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>₹{(order.subtotalMinor / 100).toFixed(0)}</span>
                </div>
                {order.discountMinor > 0 && (
                  <div className="flex justify-between text-teal-600 dark:text-teal-400">
                    <span>Discount</span>
                    <span>-₹{(order.discountMinor / 100).toFixed(0)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Standard Shipping</span>
                  <span>
                    {order.shippingMinor > 0 ? `₹${(order.shippingMinor / 100).toFixed(0)}` : "FREE"}
                  </span>
                </div>
                {order.taxMinor > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>GST (Included)</span>
                    <span>₹{(order.taxMinor / 100).toFixed(0)}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between font-bold text-sm text-foreground">
                  <span>Total Paid</span>
                  <span>₹{(order.totalMinor / 100).toFixed(0)}</span>
                </div>

                {order.paymentRef && (
                  <div className="pt-2 text-[10px] text-muted-foreground border-t border-border/40 flex justify-between">
                    <span>Gateway Ref ({order.paymentProvider})</span>
                    <span className="truncate max-w-[180px]">{order.paymentRef}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* 4. DELIVERY ADDRESS */}
            <div className="space-y-3">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Shipping Destination
              </span>

              {order.shippingAddress ? (
                <div className="rounded-xl border border-border bg-card p-4 space-y-1 text-xs">
                  <div className="font-semibold text-foreground">
                    {order.shippingAddress.recipientName}
                  </div>
                  <div className="text-muted-foreground">
                    {order.shippingAddress.line1}
                    {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}
                  </div>
                  <div className="text-muted-foreground">
                    {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}
                  </div>
                  <div className="pt-1 font-mono text-[11px] text-muted-foreground">
                    Contact: +91 {order.shippingAddress.phone}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground">
                  No shipping address attached to this record.
                </div>
              )}
            </div>

            <Separator />

            {/* 5. VEHICLE & QR CONNECTIONS */}
            <div className="space-y-3">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Connected Vehicle &amp; Identity
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Vehicle Card */}
                <div className="rounded-xl border border-border bg-card p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase text-muted-foreground">
                    <VaahanIcon name="vehicle" className="size-3" />
                    <span>Associated Vehicle</span>
                  </div>
                  {order.vehicle ? (
                    <>
                      <div className="font-mono text-xs font-bold text-foreground">
                        {order.vehicle.plateNumber}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {order.vehicle.makeModel}
                      </div>
                      <div className="pt-1">
                        <Link
                          href={`/vehicles`}
                          className="inline-flex items-center gap-1 font-mono text-[10px] text-[#cc785c] hover:underline"
                        >
                          <span>Vehicle Profile</span>
                          <VaahanIcon name="arrow-right" className="size-2.5" />
                        </Link>
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      Vehicle binding pending
                    </div>
                  )}
                </div>

                {/* QR Identity Card */}
                <div className="rounded-xl border border-border bg-card p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase text-muted-foreground">
                    <VaahanIcon name="qr" className="size-3" />
                    <span>QR Identity</span>
                  </div>
                  {order.qrSticker ? (
                    <>
                      <div className="font-mono text-xs font-bold text-foreground">
                        {order.qrSticker.visibleCode}
                      </div>
                      <div className="font-mono text-[10px] text-teal-600 dark:text-teal-400">
                        Status: {order.qrSticker.status}
                      </div>
                      <div className="pt-1">
                        <Link
                          href={`/qr`}
                          className="inline-flex items-center gap-1 font-mono text-[10px] text-[#cc785c] hover:underline"
                        >
                          <span>Manage Sticker</span>
                          <VaahanIcon name="arrow-right" className="size-2.5" />
                        </Link>
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      Allocated upon packing
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* FOOTER ACTIONS */}
        <div className="p-4 border-t border-border/80 bg-card/60 flex items-center justify-between gap-3">
          {order.canCancel ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCancelOrder(order)}
              className="text-destructive border-destructive/30 hover:bg-destructive/10 font-mono text-xs"
            >
              Cancel Order
            </Button>
          ) : (
            <Button asChild variant="ghost" size="sm" className="font-mono text-xs text-muted-foreground">
              <Link href="/help">
                <VaahanIcon name="help" className="size-3.5 mr-1.5" />
                <span>Need Help?</span>
              </Link>
            </Button>
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="font-mono text-xs border-border"
            >
              Close
            </Button>

            {order.paymentStatus === "PAID" && (
              <Button
                size="sm"
                onClick={() => onViewReceipt(order)}
                className="bg-[#cc785c] hover:bg-[#a9583e] text-white font-mono text-xs gap-1.5"
              >
                <VaahanIcon name="receipt" className="size-3.5" />
                <span>Receipt</span>
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
