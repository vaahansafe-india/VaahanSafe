"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@vaahansafe/ui/components";
import { VaahanIcon } from "@vaahansafe/icons";
import { toast } from "sonner";
import type { OrderListItem } from "@/lib/orders-types";
import { cancelOrderAction } from "@/lib/orders-actions";

interface CancelOrderAlertProps {
  order: OrderListItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CancelOrderAlert({
  order,
  isOpen,
  onClose,
  onSuccess,
}: CancelOrderAlertProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!order) return null;

  const handleConfirmCancel = async () => {
    try {
      setIsSubmitting(true);
      const res = await cancelOrderAction(order.id);
      if (res.success) {
        toast.success(res.message || "Order cancelled successfully.");
        onSuccess();
        onClose();
      } else {
        toast.error(res.error || "Failed to cancel order.");
      }
    } catch (err: any) {
      toast.error(err?.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="max-w-md font-sans bg-background border-border">
        <AlertDialogHeader className="space-y-2">
          <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <VaahanIcon name="alert" className="size-5" />
          </div>

          <AlertDialogTitle className="font-serif text-lg font-medium text-foreground">
            Cancel Order {order.orderNumber}?
          </AlertDialogTitle>

          <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Are you sure you want to cancel this order? Hardware preparation and shipment allocation will be stopped immediately. If your payment was already confirmed, a refund request will be initiated according to policy.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="rounded-xl border border-border bg-card p-3.5 space-y-1.5 font-mono text-xs">
          <div className="flex justify-between text-muted-foreground">
            <span>Order Reference:</span>
            <span className="font-bold text-foreground">{order.orderNumber}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Total Value:</span>
            <span className="text-foreground">₹{(order.totalMinor / 100).toFixed(0)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Payment State:</span>
            <span className="text-foreground font-semibold">{order.paymentStatus}</span>
          </div>
        </div>

        <AlertDialogFooter className="pt-2">
          <AlertDialogCancel disabled={isSubmitting} className="font-mono text-xs">
            Keep Order
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirmCancel();
            }}
            disabled={isSubmitting}
            className="bg-destructive hover:bg-destructive/90 text-white font-mono text-xs"
          >
            {isSubmitting ? "Cancelling..." : "Confirm Cancellation"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
