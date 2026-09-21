"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, Badge, Button, Separator } from "@vaahansafe/ui";
import { VaahanIcon } from "@vaahansafe/icons";
import { PaymentRelationshipRail } from "../relationships/PaymentRelationshipRail";
import { PaymentVerificationTimeline } from "../relationships/PaymentVerificationTimeline";
import type { PaymentRecordItem } from "@/lib/payments-types";

interface PaymentDetailsSheetProps {
  payment: PaymentRecordItem | null;
  isOpen: boolean;
  onClose: () => void;
  onViewInvoice: (payment: PaymentRecordItem) => void;
}

export function PaymentDetailsSheet({
  payment,
  isOpen,
  onClose,
  onViewInvoice,
}: PaymentDetailsSheetProps) {
  if (!payment) return null;

  const formattedDate = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(payment.confirmedAt || payment.createdAt));

  const formattedAmount = `₹${(payment.amountMinor / 100).toLocaleString("en-IN")}`;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto bg-card p-4 sm:p-6 space-y-6">
        {/* HEADER */}
        <SheetHeader className="border-b border-border pb-4 pr-12 text-left space-y-1">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#cc785c]">
            <span>Payment Dossier</span>
            <span>&bull;</span>
            <span>{formattedDate}</span>
          </div>

          <div className="flex flex-wrap items-baseline justify-between gap-2 pt-1">
            <SheetTitle className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {formattedAmount}
            </SheetTitle>
            <Badge
              variant="outline"
              className={`font-mono text-xs font-semibold transition-colors ${
                payment.status === "SUCCESS"
                  ? "border-[#5db8a6]/40 bg-[#5db8a6]/10 text-[#5db8a6] hover:bg-[#5db8a6]/15 hover:text-[#5db8a6]"
                  : payment.status === "PENDING"
                  ? "border-[#e8a55a]/40 bg-[#e8a55a]/10 text-[#e8a55a] hover:bg-[#e8a55a]/15 hover:text-[#e8a55a]"
                  : "border-[#c64545]/40 bg-[#c64545]/10 text-[#c64545] hover:bg-[#c64545]/15 hover:text-[#c64545]"
              }`}
            >
              {payment.statusLabel}
            </Badge>
          </div>

          <SheetDescription className="text-xs text-muted-foreground">
            Authoritative financial transaction connected to order {payment.orderNumber}.
          </SheetDescription>
        </SheetHeader>

        {/* 1. RELATIONSHIP PIPELINE */}
        <div className="space-y-2">
          <PaymentRelationshipRail payment={payment} />
        </div>

        {/* 2. ACTIONS STRIP */}
        <div className="flex items-center gap-3">
          {payment.isInvoiceAvailable && (
            <Button
              type="button"
              onClick={() => {
                onClose();
                onViewInvoice(payment);
              }}
              className="w-full bg-[#cc785c] hover:bg-[#a9583e] text-white font-mono text-xs font-semibold uppercase tracking-wider h-10 gap-2"
            >
              <VaahanIcon name="receipt" size={14} />
              <span>View Commercial Document</span>
            </Button>
          )}
        </div>

        <Separator className="border-border/60" />

        {/* 3. VERIFICATION TIMELINE */}
        <div className="rounded-xl border border-border bg-background p-4 sm:p-5">
          <PaymentVerificationTimeline milestones={payment.timeline} />
        </div>

        {/* 4. FINANCIAL BREAKDOWN */}
        <div className="rounded-xl border border-border bg-background p-4 sm:p-5 space-y-3 font-mono text-xs">
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Commercial Accounting Breakdown
          </div>

          <div className="space-y-1.5 text-muted-foreground">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{(payment.subtotalMinor / 100).toLocaleString("en-IN")}</span>
            </div>
            {payment.discountMinor > 0 && (
              <div className="flex justify-between text-[#5db8a6]">
                <span>Discount</span>
                <span>-₹{(payment.discountMinor / 100).toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Delivery &amp; Courier</span>
              <span>{payment.shippingMinor > 0 ? `₹${(payment.shippingMinor / 100).toLocaleString("en-IN")}` : "FREE"}</span>
            </div>
            {payment.taxMinor > 0 && (
              <div className="flex justify-between">
                <span>Taxes</span>
                <span>₹{(payment.taxMinor / 100).toLocaleString("en-IN")}</span>
              </div>
            )}
            <Separator className="my-1.5" />
            <div className="flex justify-between text-sm font-bold text-foreground">
              <span>Total Settled</span>
              <span className="text-[#cc785c]">
                ₹{(payment.totalMinor / 100).toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        {/* 5. SAFE REFERENCES GRID */}
        <div className="rounded-xl border border-border bg-background p-4 space-y-2 text-xs font-mono">
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Authoritative References
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1 text-muted-foreground">
            <div>
              <span className="text-[10px] block">Order Reference</span>
              <span className="font-bold text-foreground truncate block">{payment.orderNumber}</span>
            </div>
            <div>
              <span className="text-[10px] block">Gateway Payment ID</span>
              <span className="text-foreground truncate block" title={payment.providerPaymentId || ""}>
                {payment.providerPaymentId || "Cashfree Validated"}
              </span>
            </div>
            <div>
              <span className="text-[10px] block">Payment Method</span>
              <span className="text-foreground">{payment.paymentMethod || "UPI / NetBanking"}</span>
            </div>
            <div>
              <span className="text-[10px] block">Attempt Number</span>
              <span className="text-foreground">#{payment.attemptNumber}</span>
            </div>
          </div>
        </div>

        {/* 6. BILLING & DELIVERY DESTINATION */}
        {payment.billingAddress && (
          <div className="rounded-xl border border-border bg-background p-4 space-y-1 text-xs">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Customer Destination Snapshot
            </div>
            <div className="font-semibold text-foreground">
              {payment.billingAddress.recipientName}
            </div>
            <div className="text-muted-foreground leading-snug">
              {payment.billingAddress.line1}
              {payment.billingAddress.line2 ? `, ${payment.billingAddress.line2}` : ""},{" "}
              {payment.billingAddress.city}, {payment.billingAddress.state} - {payment.billingAddress.postalCode}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
