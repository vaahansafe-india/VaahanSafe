"use client";

import { PaymentRecord } from "./PaymentRecord";
import { PaymentsFilteredEmptyState } from "../states/PaymentsFilteredEmptyState";
import type { PaymentRecordItem } from "@/lib/payments-types";

interface PaymentRegistryProps {
  payments: PaymentRecordItem[];
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onViewDetails: (payment: PaymentRecordItem) => void;
  onViewInvoice: (payment: PaymentRecordItem) => void;
  onRetryPayment?: (payment: PaymentRecordItem) => void;
}

export function PaymentRegistry({
  payments,
  hasActiveFilters,
  onClearFilters,
  onViewDetails,
  onViewInvoice,
  onRetryPayment,
}: PaymentRegistryProps) {
  if (payments.length === 0) {
    return <PaymentsFilteredEmptyState onClearFilters={onClearFilters} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between font-mono text-xs text-muted-foreground border-b border-border/70 pb-2">
        <span className="uppercase tracking-wider">
          Financial Event Registry ({payments.length} {payments.length === 1 ? "Record" : "Records"})
        </span>
        <span className="text-[10px] hidden sm:inline">
          Server-Validated Cloudflare D1 Transactions
        </span>
      </div>

      <div className="space-y-3">
        {payments.map((p) => (
          <PaymentRecord
            key={p.id}
            payment={p}
            onViewDetails={onViewDetails}
            onViewInvoice={onViewInvoice}
            onRetryPayment={onRetryPayment}
          />
        ))}
      </div>
    </div>
  );
}
