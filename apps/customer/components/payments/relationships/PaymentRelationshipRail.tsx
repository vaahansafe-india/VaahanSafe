"use client";

import { VaahanIcon } from "@vaahansafe/icons";
import type { PaymentRecordItem } from "@/lib/payments-types";

interface PaymentRelationshipRailProps {
  payment: PaymentRecordItem;
}

export function PaymentRelationshipRail({ payment }: PaymentRelationshipRailProps) {
  const formattedAmount = `₹${(payment.amountMinor / 100).toLocaleString("en-IN")}`;

  return (
    <div className="rounded-xl border border-border bg-background p-4 sm:p-5 space-y-4 font-mono text-xs">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/70 pb-2">
        <span>Payment &rarr; Service Provenance</span>
        <span className="text-[#5db8a6] font-semibold">Authoritative Chain</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center sm:text-left">
        {/* Step 1: Payment */}
        <div className="rounded-lg border border-border/80 bg-card p-3 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase">
            <span>01. Payment</span>
            <VaahanIcon name="payment" size={13} className="text-[#cc785c]" />
          </div>
          <div className="font-bold text-foreground text-sm">{formattedAmount}</div>
          <div className="text-[10px] text-[#5db8a6] font-semibold uppercase">{payment.status}</div>
        </div>

        {/* Step 2: Order */}
        <div className="rounded-lg border border-border/80 bg-card p-3 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase">
            <span>02. Order</span>
            <VaahanIcon name="package" size={13} className="text-[#cc785c]" />
          </div>
          <div className="font-semibold text-foreground text-xs truncate" title={payment.orderNumber}>
            {payment.orderNumber}
          </div>
          <div className="text-[10px] text-muted-foreground truncate">{payment.purposeLabel}</div>
        </div>

        {/* Step 3: Hardware / QR */}
        <div className="rounded-lg border border-border/80 bg-card p-3 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase">
            <span>03. QR Hardware</span>
            <VaahanIcon name="qr" size={13} className="text-[#cc785c]" />
          </div>
          <div className="font-bold text-[#cc785c] text-xs">
            {payment.qrSticker?.visibleCode || "Kit In Fulfillment"}
          </div>
          <div className="text-[10px] text-muted-foreground">
            {payment.qrSticker?.status || "Hardware Entitled"}
          </div>
        </div>

        {/* Step 4: Vehicle */}
        <div className="rounded-lg border border-border/80 bg-card p-3 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase">
            <span>04. Vehicle</span>
            <VaahanIcon name="vehicle" size={13} className="text-[#5db8a6]" />
          </div>
          <div className="font-bold text-foreground text-xs">
            {payment.vehicle?.plateNumber || "Pending Binding"}
          </div>
          <div className="text-[10px] text-muted-foreground truncate">
            {payment.vehicle?.makeModel || "Unassigned"}
          </div>
        </div>
      </div>
    </div>
  );
}
