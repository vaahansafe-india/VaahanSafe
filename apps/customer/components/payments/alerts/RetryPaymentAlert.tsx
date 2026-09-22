"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@vaahansafe/ui";
import type { PaymentRecordItem } from "@/lib/payments-types";

interface RetryPaymentAlertProps {
  payment: PaymentRecordItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmRetry: (payment: PaymentRecordItem) => void;
  isRetrying?: boolean;
}

export function RetryPaymentAlert({
  payment,
  isOpen,
  onClose,
  onConfirmRetry,
  isRetrying = false,
}: RetryPaymentAlertProps) {
  if (!payment) return null;

  const formattedAmount = `₹${(payment.amountMinor / 100).toLocaleString("en-IN")}`;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="bg-card font-sans border-border max-w-md">
        <AlertDialogHeader className="space-y-2">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#cc785c]">
            Payment Re-Authorization
          </div>
          <AlertDialogTitle className="font-serif text-xl font-medium text-foreground">
            Retry Incomplete Payment?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
            A new, authoritative secure payment session will be initialized for this order. Existing unconfirmed attempts will be safely superseded.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="rounded-xl border border-border bg-background p-3.5 space-y-1 text-xs font-mono">
          <div className="flex justify-between text-muted-foreground">
            <span>Order Reference:</span>
            <span className="font-bold text-foreground">{payment.orderNumber}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Payable Amount:</span>
            <span className="font-bold text-[#cc785c]">{formattedAmount}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Product Description:</span>
            <span className="text-foreground truncate max-w-[180px]">{payment.productDescription}</span>
          </div>
        </div>

        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel onClick={onClose} className="font-mono text-xs">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onConfirmRetry(payment)}
            disabled={isRetrying}
            className="bg-[#cc785c] hover:bg-[#a9583e] text-white font-mono text-xs"
          >
            {isRetrying ? "Preparing Checkout..." : "Continue to Payment"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
