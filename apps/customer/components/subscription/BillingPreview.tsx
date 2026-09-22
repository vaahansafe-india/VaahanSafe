"use client";

import * as React from "react";
import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";
import { Badge } from "@vaahansafe/ui";
import type { BillingSummaryRecord } from "@/lib/subscription-types";

interface BillingPreviewProps {
  records: BillingSummaryRecord[];
  onViewRecord?: (record: BillingSummaryRecord) => void;
}

export function BillingPreview({ records, onViewRecord }: BillingPreviewProps) {
  const latestPayment = records[0];

  const formatDate = (isoString?: string) => {
    if (!isoString) return "—";
    try {
      return new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(isoString));
    } catch {
      return isoString;
    }
  };

  return (
    <section 
      aria-label="Billing & Payments Preview" 
      className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-2xs"
    >
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#cc785c] font-semibold">
              Financial & Invoices
            </span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span className="font-mono text-xs text-muted-foreground">
              Gateway Verified
            </span>
          </div>
          <h3 className="font-serif text-xl sm:text-2xl font-medium tracking-tight text-foreground">
            Billing & Payments
          </h3>
        </div>

        <Link
          href="/payments"
          className="inline-flex items-center gap-1 text-xs font-mono font-medium text-[#cc785c] hover:underline"
        >
          <span>All Payments</span>
          <VaahanIcon name="arrow-right" size={11} />
        </Link>
      </div>

      {!latestPayment ? (
        <div className="py-6 text-center text-xs text-muted-foreground font-mono">
          No payment history recorded yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 pt-1">
          {/* Recent Payment Card */}
          <div className="flex flex-col justify-between p-3.5 sm:p-4 rounded-xl border border-border/80 bg-background space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Most Recent Payment
              </span>
              <Badge
                variant="outline"
                className={`font-mono text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 ${
                  latestPayment.status === "PAID"
                    ? "border-[#5db8a6]/40 bg-[#5db8a6]/10 text-[#5db8a6] hover:bg-[#5db8a6]/15 hover:text-[#5db8a6]"
                    : "border-border bg-muted text-muted-foreground hover:bg-muted"
                }`}
              >
                {latestPayment.status === "PAID" ? "CONFIRMED" : latestPayment.status}
              </Badge>
            </div>

            <div>
              <div className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                ₹{(latestPayment.amountMinor / 100).toFixed(0)}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {latestPayment.itemDescription} • {formatDate(latestPayment.confirmedAt || latestPayment.createdAt)}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-2.5 text-xs font-mono text-muted-foreground">
              <span className="truncate max-w-[200px]">Order: {latestPayment.orderNumber}</span>
              {onViewRecord && (
                <button
                  type="button"
                  onClick={() => onViewRecord(latestPayment)}
                  className="text-[#cc785c] hover:underline inline-flex items-center gap-1 active:scale-[0.98]"
                >
                  <span>Receipt</span>
                  <VaahanIcon name="chevron-right" size={11} />
                </button>
              )}
            </div>
          </div>

          {/* Payment Method & Security Assurance */}
          <div className="flex flex-col justify-between p-3.5 sm:p-4 rounded-xl border border-border/80 bg-background space-y-3">
            <div className="space-y-1">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Payment Infrastructure
              </span>
              <div className="font-mono text-xs font-bold text-foreground flex items-center gap-1.5 pt-1">
                <VaahanIcon name="shield" size={14} className="text-[#5db8a6] shrink-0" />
                <span>Authoritative Gateway Settlement</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                Payments are verified via cryptographic server webhooks. No credit card or banking details are stored on VaahanSafe servers.
              </p>
            </div>

            <div className="border-t border-border/60 pt-2.5 flex items-center justify-between text-xs font-mono text-muted-foreground">
              <span>Tax Invoices Generated</span>
              <Link href="/payments" className="text-foreground hover:underline">
                View statement →
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
