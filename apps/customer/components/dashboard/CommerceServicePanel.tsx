"use client";

import * as React from "react";
import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";
import type {
  DashboardSubscriptionSummary,
  DashboardOrderSummary,
} from "@/lib/dashboard-types";

interface CommerceServicePanelProps {
  subscription: DashboardSubscriptionSummary | null;
  orders: DashboardOrderSummary[];
}

export function CommerceServicePanel({
  subscription,
  orders,
}: CommerceServicePanelProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-2 w-full max-w-full">
      {/* Subscription & Protection Plan */}
      <div className="flex flex-col justify-between rounded-2xl sm:rounded-3xl border border-border bg-card p-4 sm:p-6 lg:p-7 shadow-sm w-full max-w-full overflow-hidden">
        <div>
          <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex h-2 w-2 shrink-0 rounded-full bg-[#5db8a6]" />
              <h3 className="font-mono text-[11px] sm:text-xs font-bold uppercase tracking-[0.16em] sm:tracking-[0.2em] text-foreground truncate">
                SERVICE ENTITLEMENT &bull; COVERAGE
              </h3>
            </div>
            <Link
              href="/subscription"
              className="font-mono text-[11px] font-medium text-[#cc785c] hover:underline shrink-0"
            >
              Plan details →
            </Link>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="font-serif text-lg sm:text-xl font-medium text-foreground leading-snug">
                {subscription?.planName || "Standard Protection Shield"}
              </div>
              <div className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Automated 24/7 SMS &amp; WhatsApp golden-hour incident dispatch
              </div>
            </div>

            <span
              className={`inline-flex items-center gap-1.5 self-start rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold shrink-0 ${
                subscription?.status === "ACTIVE"
                  ? "bg-[#5db8a6]/10 text-[#5db8a6]"
                  : "bg-[#e8a55a]/10 text-[#e8a55a]"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              <span>{subscription?.status || "ACTIVE"}</span>
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 border-t border-border pt-3.5 text-xs">
            <div className="space-y-1 min-w-0">
              <span className="block font-mono text-[10px] uppercase tracking-wider text-muted-foreground truncate">
                RENEWAL CYCLE:
              </span>
              <div className="font-mono font-medium text-foreground text-xs sm:text-sm truncate">
                {subscription?.expiresAt
                  ? subscription.expiresAt.slice(0, 10)
                  : "Annual Coverage"}
              </div>
            </div>
            <div className="space-y-1 min-w-0">
              <span className="block font-mono text-[10px] uppercase tracking-wider text-muted-foreground truncate">
                AUTO-RENEW:
              </span>
              <div className="font-mono font-medium text-foreground text-xs sm:text-sm truncate">
                {subscription?.autoRenew ? "Enabled" : "Manual Renewal"}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border pt-3.5">
          <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-wider text-muted-foreground">
            PROTECTION STATUS: ACTIVE
          </span>
          <Link
            href="/subscription"
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-border bg-muted/40 px-4 py-2 font-mono text-xs font-medium text-foreground hover:bg-muted transition-colors text-center"
          >
            Manage Coverage
          </Link>
        </div>
      </div>

      {/* Orders & Fulfilment */}
      <div className="flex flex-col justify-between rounded-2xl sm:rounded-3xl border border-border bg-card p-4 sm:p-6 lg:p-7 shadow-sm w-full max-w-full overflow-hidden">
        <div>
          <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex h-2 w-2 shrink-0 rounded-full bg-[#cc785c]" />
              <h3 className="font-mono text-[11px] sm:text-xs font-bold uppercase tracking-[0.16em] sm:tracking-[0.2em] text-foreground truncate">
                COMMERCE &amp; FULFILMENT
              </h3>
            </div>
            <Link
              href="/orders"
              className="font-mono text-[11px] font-medium text-[#cc785c] hover:underline shrink-0"
            >
              All orders ({orders.length}) →
            </Link>
          </div>

          <div className="mt-4">
            {orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-center px-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60 text-[#cc785c] mb-2.5">
                  <VaahanIcon name="cart" size={18} />
                </div>
                <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                  No orders placed yet. Purchase additional QR stickers or replacement kits anytime.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border rounded-xl border border-border bg-muted/10 text-xs overflow-hidden">
                {orders.slice(0, 3).map((o) => {
                  const statusTone =
                    o.status === "PAID" || o.status === "DELIVERED"
                      ? "bg-[#5db8a6]/10 text-[#5db8a6]"
                      : o.status === "CANCELLED" || o.status === "FAILED"
                      ? "bg-[#c64545]/10 text-[#c64545]"
                      : "bg-[#e8a55a]/10 text-[#e8a55a]";

                  return (
                    <div
                      key={o.id}
                      className="flex items-center justify-between gap-3 p-3 transition-colors hover:bg-muted/20"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-mono font-bold text-foreground text-xs sm:text-sm truncate">
                          {o.orderNumber}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          {o.createdAt ? o.createdAt.slice(0, 10) : "Recorded"}
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex flex-col items-end gap-1">
                        <div className="font-mono font-bold text-foreground text-xs sm:text-sm">
                          ₹{(o.totalMinor / 100).toFixed(0)}
                        </div>
                        <span
                          className={`rounded px-1.5 py-0.5 font-mono text-[9px] uppercase font-semibold ${statusTone}`}
                        >
                          {o.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border pt-3.5">
          <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-wider text-muted-foreground">
            DOORSTEP COURIER DISPATCH
          </span>
          <Link
            href="/qr/buy"
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-[#cc785c] px-4 py-2 font-mono text-xs font-semibold text-white hover:bg-[#a9583e] transition-colors text-center shadow-xs"
          >
            Order New QR Kit
          </Link>
        </div>
      </div>
    </div>
  );
}
