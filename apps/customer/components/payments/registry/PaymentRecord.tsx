"use client";

import { VaahanIcon } from "@vaahansafe/icons";
import { Badge, Button } from "@vaahansafe/ui";
import { PaymentReference } from "./PaymentReference";
import type { PaymentRecordItem } from "@/lib/payments-types";
import { formatDateIst } from "@/lib/datetime";

interface PaymentRecordProps {
  payment: PaymentRecordItem;
  onViewDetails: (payment: PaymentRecordItem) => void;
  onViewInvoice: (payment: PaymentRecordItem) => void;
  onRetryPayment?: (payment: PaymentRecordItem) => void;
}

export function PaymentRecord({
  payment,
  onViewDetails,
  onViewInvoice,
  onRetryPayment,
}: PaymentRecordProps) {
  const formattedDate = formatDateIst(payment.confirmedAt || payment.createdAt);

  const formattedAmount = `₹${(payment.amountMinor / 100).toLocaleString("en-IN")}`;

  const isConfirmed = payment.status === "SUCCESS";
  const isPending = payment.status === "PENDING";
  const isFailed = payment.status === "FAILED";

  return (
    <div
      onClick={() => onViewDetails(payment)}
      className="group relative rounded-2xl border border-border bg-card p-4 sm:p-5 transition-all hover:border-[#cc785c]/50 hover:shadow-xs cursor-pointer space-y-4"
    >
      {/* Top Header / Meta Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">{formattedDate}</span>
          <span className="h-1 w-1 rounded-full bg-border" />
          <PaymentReference reference={payment.paymentReference} copyValue={payment.providerPaymentId || payment.id} />
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`font-mono text-[10px] font-semibold tracking-wider uppercase transition-colors ${
              isConfirmed
                ? "border-[#5db8a6]/40 bg-[#5db8a6]/10 text-[#5db8a6] hover:bg-[#5db8a6]/15 hover:text-[#5db8a6]"
                : isPending
                ? "border-[#e8a55a]/40 bg-[#e8a55a]/10 text-[#e8a55a] hover:bg-[#e8a55a]/15 hover:text-[#e8a55a]"
                : "border-[#c64545]/40 bg-[#c64545]/10 text-[#c64545] hover:bg-[#c64545]/15 hover:text-[#c64545]"
            }`}
          >
            {isConfirmed && <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-[#5db8a6]" />}
            {payment.statusLabel}
          </Badge>
        </div>
      </div>

      {/* Primary Financial Content Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-12 sm:items-center">
        {/* Amount & Purpose (4 cols) */}
        <div className="sm:col-span-4 space-y-1">
          <div className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {formattedAmount}
          </div>
          <div className="text-xs text-muted-foreground">
            {payment.purposeLabel}
          </div>
        </div>

        {/* Order & Vehicle Provenance (5 cols) */}
        <div className="sm:col-span-5 space-y-1 text-xs">
          <div className="flex items-center gap-1.5 font-mono">
            <VaahanIcon name="package" size={13} className="text-[#cc785c] shrink-0" />
            <span className="text-muted-foreground">Order:</span>
            <span className="font-semibold text-foreground">{payment.orderNumber}</span>
          </div>

          {payment.vehicle && (
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
              <VaahanIcon name="vehicle" size={13} className="text-[#5db8a6] shrink-0" />
              <span>{payment.vehicle.plateNumber}</span>
              <span className="text-muted-foreground/60">({payment.vehicle.makeModel})</span>
            </div>
          )}
        </div>

        {/* Action Controls (3 cols) */}
        <div className="sm:col-span-3 flex sm:justify-end items-center gap-2 pt-2 sm:pt-0 border-t border-border/40 sm:border-0">
          {payment.isInvoiceAvailable ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onViewInvoice(payment);
              }}
              className="font-mono text-xs border-border hover:border-[#cc785c]/50 hover:bg-muted gap-1.5 h-8 px-2.5"
            >
              <VaahanIcon name="receipt" size={12} className="text-[#cc785c]" />
              <span>Invoice</span>
            </Button>
          ) : isFailed && onRetryPayment ? (
            <Button
              type="button"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onRetryPayment(payment);
              }}
              className="bg-[#cc785c] hover:bg-[#a9583e] text-white font-mono text-xs h-8 px-2.5"
            >
              <span>Retry</span>
            </Button>
          ) : null}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(payment);
            }}
            className="font-mono text-xs hover:text-[#cc785c] hover:bg-transparent p-0 h-8 px-2 gap-1"
          >
            <span>Details</span>
            <VaahanIcon name="arrow-right" size={12} />
          </Button>
        </div>
      </div>
    </div>
  );
}
