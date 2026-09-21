"use client";

import Link from "next/link";
import { Badge, Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@vaahansafe/ui/components";
import { VaahanIcon } from "@vaahansafe/icons";
import type { OrderListItem } from "@/lib/orders-types";
import { ProductMedia } from "./media/ProductMedia";
import { FulfillmentRail } from "./FulfillmentRail";
import { OrderMetadataStrip } from "./OrderMetadataStrip";

interface OrderRecordProps {
  order: OrderListItem;
  onViewDetails: (order: OrderListItem) => void;
  onTrackShipment: (order: OrderListItem) => void;
  onViewReceipt: (order: OrderListItem) => void;
  onCancelOrder: (order: OrderListItem) => void;
}

export function OrderRecord({
  order,
  onViewDetails,
  onTrackShipment,
  onViewReceipt,
  onCancelOrder,
}: OrderRecordProps) {
  const formattedDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const itemName =
    order.items.length > 0
      ? order.items.map((i) => (i.quantity > 1 ? `${i.name} (x${i.quantity})` : i.name)).join(", ")
      : "VaahanSafe Automotive Safety Kit";

  const totalFormatted = `₹${(order.totalMinor / 100).toFixed(0)}`;

  const paymentBadgeVariant =
    order.paymentStatus === "PAID"
      ? "success"
      : order.paymentStatus === "FAILED"
      ? "destructive"
      : order.paymentStatus === "REFUNDED"
      ? "secondary"
      : "outline";

  return (
    <div className="rounded-2xl border border-border bg-card p-3.5 sm:p-5 lg:p-6 shadow-xs hover:border-[#cc785c]/30 transition-all duration-200 space-y-3.5 sm:space-y-4">
      {/* TOP: Identity, Product, Price & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
        {/* Left: Thumbnail & Details */}
        <div className="flex items-start gap-3 sm:gap-4 min-w-0">
          <ProductMedia
            media={order.productMedia}
            variant="thumbnail"
            alt={itemName}
            className="size-16 sm:size-20 md:size-24 shrink-0 rounded-xl"
          />

          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="font-mono text-xs sm:text-base font-bold tracking-tight text-foreground break-all sm:break-normal">
                {order.orderNumber}
              </span>
              <Badge
                variant={paymentBadgeVariant}
                className="font-mono text-[9px] sm:text-[10px] tracking-wider uppercase px-1.5 sm:px-2 py-0.5"
              >
                {order.paymentStatus}
              </Badge>
              {order.fulfillmentStage === "DELIVERED" && (
                <Badge variant="outline" className="font-mono text-[9px] sm:text-[10px] text-teal-700 dark:text-teal-400 border-teal-600/30 bg-teal-500/10 hover:bg-teal-500/15 hover:text-teal-700 dark:hover:text-teal-400 transition-colors">
                  Delivered
                </Badge>
              )}
            </div>

            <div className="text-xs sm:text-sm font-medium text-foreground truncate">
              {itemName}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-muted-foreground font-mono">
              <span className="font-semibold text-foreground">{totalFormatted}</span>
              <span>&bull;</span>
              <span>Placed on {formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 self-stretch sm:self-start justify-end sm:justify-start shrink-0 pt-1 sm:pt-0 border-t border-border/40 sm:border-0">
          <Button
            onClick={() => onViewDetails(order)}
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none h-8 sm:h-9 gap-1.5 font-mono text-xs font-medium border-border hover:border-[#cc785c]/50 hover:bg-muted"
          >
            <span>View Details</span>
            <VaahanIcon name="arrow-right" className="size-3.5 text-muted-foreground" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 sm:h-9 w-8 sm:w-9 p-0 text-muted-foreground hover:text-foreground shrink-0"
                aria-label="Order actions"
              >
                <VaahanIcon name="more-vertical" className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 font-sans">
              <DropdownMenuItem onClick={() => onViewDetails(order)} className="gap-2 text-xs">
                <VaahanIcon name="eye" className="size-3.5 text-muted-foreground" />
                <span>View Full Details</span>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => onTrackShipment(order)} className="gap-2 text-xs">
                <VaahanIcon name="truck" className="size-3.5 text-muted-foreground" />
                <span>Track Fulfillment</span>
              </DropdownMenuItem>

              {order.paymentStatus === "PAID" && (
                <DropdownMenuItem onClick={() => onViewReceipt(order)} className="gap-2 text-xs">
                  <VaahanIcon name="receipt" className="size-3.5 text-muted-foreground" />
                  <span>View Official Receipt</span>
                </DropdownMenuItem>
              )}

              {order.qrSticker && (
                <DropdownMenuItem asChild className="gap-2 text-xs">
                  <Link href={`/qr`}>
                    <VaahanIcon name="qr" className="size-3.5 text-muted-foreground" />
                    <span>View QR Identity</span>
                  </Link>
                </DropdownMenuItem>
              )}

              {order.vehicle && (
                <DropdownMenuItem asChild className="gap-2 text-xs">
                  <Link href={`/vehicles`}>
                    <VaahanIcon name="vehicle" className="size-3.5 text-muted-foreground" />
                    <span>View Vehicle</span>
                  </Link>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem asChild className="gap-2 text-xs">
                <Link href="/help">
                  <VaahanIcon name="help" className="size-3.5 text-muted-foreground" />
                  <span>Fulfillment Support</span>
                </Link>
              </DropdownMenuItem>

              {order.canCancel && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onCancelOrder(order)}
                    className="gap-2 text-xs text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <VaahanIcon name="alert" className="size-3.5" />
                    <span>Cancel Order</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* MIDDLE: Fulfillment Rail */}
      <div className="pt-2">
        <FulfillmentRail steps={order.timelineSteps} stage={order.fulfillmentStage} />
      </div>

      {/* BOTTOM: Metadata Strip */}
      <OrderMetadataStrip order={order} />
    </div>
  );
}
