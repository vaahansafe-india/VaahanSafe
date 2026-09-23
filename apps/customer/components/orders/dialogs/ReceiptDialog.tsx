"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Button, Separator } from "@vaahansafe/ui/components";
import { VaahanIcon } from "@vaahansafe/icons";
import type { OrderListItem } from "@/lib/orders-types";

interface ReceiptDialogProps {
  order: OrderListItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ReceiptDialog({ order, isOpen, onClose }: ReceiptDialogProps) {
  if (!order) return null;

  const formattedDate = new Date(order.paidAt || order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="fixed inset-auto inset-x-auto bottom-auto left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] sm:w-full max-w-md p-0 overflow-hidden bg-card font-sans border-border rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        {/* RECEIPT HEADER */}
        <div className="bg-card p-6 text-foreground text-center space-y-2 border-b border-border">
          <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#cc785c]">
            Official Commercial Receipt
          </div>
          <DialogTitle className="font-serif text-2xl font-medium tracking-tight text-foreground">
            VaahanSafe
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Automotive Vehicle Safety &amp; Emergency Identity Platform
          </DialogDescription>
        </div>

        {/* RECEIPT BODY */}
        <div className="p-6 space-y-4 font-mono text-xs">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-card p-3.5">
            <div>
              <span className="text-[10px] uppercase text-muted-foreground block">Order Ref</span>
              <span className="font-bold text-foreground">{order.orderNumber}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase text-muted-foreground block">Date Paid</span>
              <span className="text-foreground">{formattedDate}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-muted-foreground block">Payment Status</span>
              <span className="font-bold text-teal-600 dark:text-teal-400">
                AUTHORITATIVE PAID
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase text-muted-foreground block">Gateway Ref</span>
              <span className="text-foreground truncate block max-w-[140px]" title={order.paymentRef || ""}>
                {order.paymentRef || "Gateway Verified"}
              </span>
            </div>
          </div>

          {/* Customer & Delivery Snapshot */}
          {order.shippingAddress && (
            <div className="rounded-xl border border-border bg-card p-3.5 space-y-1">
              <span className="text-[10px] uppercase text-muted-foreground block">Billed / Shipped To</span>
              <div className="font-sans font-semibold text-foreground">
                {order.shippingAddress.recipientName}
              </div>
              <div className="font-sans text-muted-foreground text-[11px]">
                {order.shippingAddress.line1}
                {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""},{" "}
                {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}
              </div>
            </div>
          )}

          {/* Itemized Table */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase text-muted-foreground block">Purchased Hardware</span>
            <div className="rounded-xl border border-border divide-y divide-border/60 overflow-hidden bg-card">
              {order.items.map((item) => (
                <div key={item.id} className="p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0 font-sans">
                    <div className="font-medium text-foreground text-xs">{item.name}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">
                      Qty: {item.quantity} &bull; ₹{(item.unitPriceMinor / 100).toFixed(0)} each
                    </div>
                  </div>
                  <div className="font-bold text-foreground shrink-0">
                    ₹{(item.totalPriceMinor / 100).toFixed(0)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="rounded-xl border border-border bg-muted/40 p-3.5 space-y-1.5">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>₹{(order.subtotalMinor / 100).toFixed(0)}</span>
            </div>
            {order.discountMinor > 0 && (
              <div className="flex justify-between text-teal-600 dark:text-teal-400">
                <span>Discount Applied</span>
                <span>-₹{(order.discountMinor / 100).toFixed(0)}</span>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground">
              <span>Fulfillment &amp; Courier</span>
              <span>
                {order.shippingMinor > 0 ? `₹${(order.shippingMinor / 100).toFixed(0)}` : "FREE"}
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Taxes (GST Included)</span>
              <span>₹{(order.taxMinor / 100).toFixed(0)}</span>
            </div>
            <Separator className="my-1.5" />
            <div className="flex justify-between text-sm font-bold text-foreground">
              <span>Total Paid</span>
              <span>₹{(order.totalMinor / 100).toFixed(0)}</span>
            </div>
          </div>

          <p className="text-[10px] text-center text-muted-foreground/80 leading-snug">
            This is a computer-generated tax receipt from VaahanSafe Technologies Pvt. Ltd. No signature required.
          </p>
        </div>

        {/* ACTIONS */}
        <div className="p-4 border-t border-border/80 bg-card/60 flex items-center justify-between gap-3">
          <Button variant="outline" size="sm" onClick={onClose} className="font-mono text-xs">
            Close
          </Button>

          <Button
            size="sm"
            onClick={handlePrint}
            className="bg-[#cc785c] hover:bg-[#a9583e] text-white font-mono text-xs gap-1.5"
          >
            <VaahanIcon name="download" className="size-3.5" />
            <span>Print / Save Receipt</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
