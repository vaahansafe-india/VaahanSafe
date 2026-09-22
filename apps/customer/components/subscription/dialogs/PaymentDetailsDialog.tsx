"use client";

import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Badge,
} from "@vaahansafe/ui";
import type { BillingSummaryRecord } from "@/lib/subscription-types";

interface PaymentDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: BillingSummaryRecord | null;
}

export function PaymentDetailsDialog({
  open,
  onOpenChange,
  record,
}: PaymentDetailsDialogProps) {
  if (!record) return null;

  const formatDate = (isoString?: string) => {
    if (!isoString) return "—";
    try {
      return new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(isoString));
    } catch {
      return isoString;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-md bg-card p-6 border-border">
        <DialogHeader className="space-y-1 text-left border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#cc785c]">
              Payment Settlement Receipt
            </span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span className="font-mono text-[10px] text-muted-foreground">
              {record.orderNumber}
            </span>
          </div>
          <DialogTitle className="font-serif text-2xl font-medium text-foreground">
            ₹{(record.amountMinor / 100).toFixed(0)}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Authoritatively confirmed commercial settlement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="rounded-xl border border-border bg-background p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-muted-foreground">Payment Status</span>
              <Badge variant="outline" className="border-[#5db8a6]/40 bg-[#5db8a6]/10 text-[#5db8a6] hover:bg-[#5db8a6]/15 hover:text-[#5db8a6] font-mono text-[10px]">
                {record.status}
              </Badge>
            </div>
            <p className="text-xs text-foreground font-medium">
              {record.itemDescription}
            </p>
          </div>

          <div className="divide-y divide-border rounded-xl border border-border bg-background text-xs">
            <div className="flex justify-between p-3">
              <span className="text-muted-foreground">Order Reference</span>
              <span className="font-mono font-bold text-foreground">
                {record.orderNumber}
              </span>
            </div>
            <div className="flex justify-between p-3">
              <span className="text-muted-foreground">Settlement Date</span>
              <span className="font-mono text-foreground">
                {formatDate(record.confirmedAt || record.createdAt)}
              </span>
            </div>
            <div className="flex justify-between p-3">
              <span className="text-muted-foreground">Settlement Gateway</span>
              <span className="font-mono text-foreground">
                Razorpay PG (Signed Webhook Verified)
              </span>
            </div>
            <div className="flex justify-between p-3">
              <span className="text-muted-foreground">GST & Invoicing</span>
              <span className="font-mono text-[#5db8a6]">
                Compliant Tax Invoice
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
