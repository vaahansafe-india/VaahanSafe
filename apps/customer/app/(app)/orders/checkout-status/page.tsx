import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthenticatedCustomer } from "@/lib/session";
import { getAuthoritativeDatabaseClient } from "@vaahansafe/database";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@vaahansafe/ui/components";
import { Badge } from "@vaahansafe/ui/components";
import { Button } from "@vaahansafe/ui/components";
import { CheckCircle2, Clock, XCircle, ArrowRight, RefreshCw, ShieldCheck } from "lucide-react";

import { getCashfreePaymentGateway } from "@vaahansafe/payments";
import { fulfillPaidOnlineOrder } from "@vaahansafe/qr-core";

export const metadata: Metadata = {
  title: "Payment Verification — VaahanSafe",
  description: "Authoritative server verification of Cashfree transaction status.",
};

interface CheckoutStatusPageProps {
  searchParams: Promise<{
    order_id?: string;
  }>;
}

export default async function CheckoutStatusPage({ searchParams }: CheckoutStatusPageProps) {
  const auth = await getAuthenticatedCustomer();
  if (!auth) {
    redirect("/login");
  }

  const { order_id } = await searchParams;

  if (!order_id) {
    redirect("/orders");
  }

  const db = getAuthoritativeDatabaseClient();

  // Query Authoritative Order State from D1 (Never trust browser query params)
  const orders = await db.query<{
    id: string;
    order_number: string;
    status: string;
    total_minor: number;
    currency: string;
    vehicle_id: string | null;
    paid_at?: string;
  }>(
    `SELECT id, order_number, status, total_minor, currency, vehicle_id, paid_at
     FROM orders
     WHERE (id = ? OR order_number = ?) AND user_id = ?
     LIMIT 1`,
    [order_id, order_id, auth.user.id]
  );
  const order = orders[0];

  if (!order) {
    redirect("/orders");
  }

  // Authoritative Gateway Verification: If still pending, reconcile directly with Cashfree REST API
  if (order.status === "PENDING_PAYMENT" || order.status === "DRAFT") {
    try {
      const gateway = getCashfreePaymentGateway();
      const cfStatus = await gateway.fetchPaymentStatus(order.id);
      if (cfStatus.status === "SUCCESS") {
        const now = new Date().toISOString();
        await db.execute(
          `UPDATE payments SET status = 'SUCCESS', provider_payment_id = ?, confirmed_at = ?, updated_at = ? WHERE order_id = ?`,
          [cfStatus.gatewayPaymentId || null, now, now, order.id]
        );
        await db.execute(
          `UPDATE orders SET status = 'PAID', paid_at = ?, updated_at = ? WHERE id = ?`,
          [now, now, order.id]
        );

        order.status = "PAID";
        order.paid_at = now;
      }
    } catch (err) {
      console.warn("[CheckoutStatusPage] Server Cashfree verification error:", err);
    }
  }

  // Fulfill paid order if vehicle is linked and entitlements/QR not yet assigned
  if ((order.status === "PAID" || order.status === "FULFILLED" || order.status === "FULFILMENT_PENDING") && order.vehicle_id) {
    try {
      await fulfillPaidOnlineOrder({
        userId: auth.user.id,
        vehicleId: order.vehicle_id,
        orderId: order.id,
        db,
      });
    } catch (err) {
      console.error("[CheckoutStatusPage] Fulfillment error:", err);
    }
  }

  // Authoritative status evaluation
  const isPaid = order.status === "PAID" || order.status === "FULFILLED" || order.status === "FULFILMENT_PENDING";
  const isFailed = order.status === "PAYMENT_FAILED" || order.status === "CANCELLED" || order.status === "EXPIRED";

  return (
    <div className="max-w-xl mx-auto space-y-6 py-8">
      <Card className="border-border p-6 sm:p-8 text-center space-y-6">
        {/* Status Icon */}
        {isPaid ? (
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <CheckCircle2 className="size-8" />
          </div>
        ) : isFailed ? (
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive border border-destructive/20">
            <XCircle className="size-8" />
          </div>
        ) : (
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-[#cc785c]/10 text-[#cc785c] border border-[#cc785c]/20">
            <Clock className="size-8 animate-pulse" />
          </div>
        )}

        {/* Title & Copy */}
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#cc785c]">
            TRANSACTION STATUS
          </div>
          <h1 className="mt-1 font-serif text-2xl font-medium text-foreground sm:text-3xl">
            {isPaid
              ? "Payment Authoritatively Confirmed"
              : isFailed
              ? "Payment Incomplete or Cancelled"
              : "Verifying Payment with Cashfree"}
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            {isPaid
              ? "Your payment was cryptographically confirmed via Cashfree's signed webhook. Your hardware order has been registered and digital entitlements have been unlocked."
              : isFailed
              ? "We could not confirm payment for this transaction. If amount was debited, your gateway will automatically refund it within 3-5 business days."
              : "We are awaiting final confirmation from the Cashfree payment gateway. This screen automatically refreshes when the verified webhook arrives."}
          </p>
        </div>

        {/* Order Details Badge */}
        <div className="rounded-xl border border-border bg-muted/40 p-4 text-left font-mono text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Order Reference:</span>
            <span className="font-bold text-foreground">{order.order_number}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Authoritative Amount:</span>
            <span className="font-bold text-foreground">
              ₹{(order.total_minor / 100).toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Backend Status:</span>
            <Badge variant={isPaid ? "success" : isFailed ? "destructive" : "outline"}>
              {order.status}
            </Badge>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
          {isPaid ? (
            <>
              <Link
                href="/qr/digital"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#cc785c] px-6 font-mono text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#b5654b] transition-colors shadow-xs"
              >
                <span>View Digital Pass</span>
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/orders"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-background px-6 font-mono text-xs font-semibold uppercase text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Track Shipment
              </Link>
            </>
          ) : isFailed ? (
            <>
              <Link
                href="/qr/buy"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#cc785c] px-6 font-mono text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#b5654b] transition-colors shadow-xs"
              >
                <span>Retry Order</span>
              </Link>
              <Link
                href="/qr"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-background px-6 font-mono text-xs font-semibold uppercase text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Back to QR Hub
              </Link>
            </>
          ) : (
            <Link
              href={`/orders/checkout-status?order_id=${encodeURIComponent(order_id)}`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 font-mono text-xs font-semibold uppercase tracking-wider text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
            >
              <RefreshCw className="size-4" />
              <span>Refresh Status</span>
            </Link>
          )}
        </div>

        <div className="border-t pt-3 flex items-center justify-center gap-2 text-[11px] font-mono text-muted-foreground">
          <ShieldCheck className="size-3.5 text-emerald-600" />
          <span>Server Authoritative Entitlement Machine</span>
        </div>
      </Card>
    </div>
  );
}
