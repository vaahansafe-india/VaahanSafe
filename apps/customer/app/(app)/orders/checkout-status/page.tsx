import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthenticatedCustomer } from "@/lib/session";
import { getAuthoritativeDatabaseClient } from "@vaahansafe/database";
import { Card, Badge } from "@vaahansafe/ui/components";
import {
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
} from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Payment Verification — VaahanSafe",
  description: "Authoritative server verification of transaction status.",
};

interface CheckoutStatusPageProps {
  searchParams: Promise<{
    order_id?: string;
  }>;
}

export default async function CheckoutStatusPage({
  searchParams,
}: CheckoutStatusPageProps) {
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
    [order_id, order_id, auth.user.id],
  );
  const order = orders[0];

  if (!order) {
    redirect("/orders");
  }

  // Reading the return page never confirms payments or allocates QR inventory.

  // Authoritative status evaluation
  const isPaid =
    order.status === "PAID" ||
    order.status === "FULFILLED" ||
    order.status === "FULFILMENT_PENDING";
  const isFailed =
    order.status === "PAYMENT_FAILED" ||
    order.status === "CANCELLED" ||
    order.status === "EXPIRED";

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
              ? "Payment confirmed"
              : isFailed
                ? "Payment Incomplete or Cancelled"
                : "Confirming your payment"}
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            {isPaid
              ? "Your payment is confirmed. View your order for fulfillment progress. QR services become available after your QR is assigned and its activation requirements are complete."
              : isFailed
                ? "Payment is incomplete or the order was cancelled. If your account was debited, check the order status or contact support before paying again."
                : "We're waiting for secure confirmation from Razorpay. Refresh the status shortly. Please avoid making another payment while confirmation is pending."}
          </p>
        </div>

        {/* Order Details Badge */}
        <div className="rounded-xl border border-border bg-muted/40 p-4 text-left font-mono text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Order Reference:</span>
            <span className="font-bold text-foreground">
              {order.order_number}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Amount:</span>
            <span className="font-bold text-foreground">
              ₹{(order.total_minor / 100).toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Order status:</span>
            <Badge
              variant={
                isPaid ? "default" : isFailed ? "destructive" : "outline"
              }
            >
              {order.status.replaceAll("_", " ").toLowerCase()}
            </Badge>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
          {isPaid ? (
            <>
              <Link
                href={`/orders/${encodeURIComponent(order.id)}`}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#cc785c] px-6 font-mono text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#b5654b] transition-colors shadow-xs"
              >
                <span>View order</span>
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
          <span>Payment status verified securely</span>
        </div>
      </Card>
    </div>
  );
}
