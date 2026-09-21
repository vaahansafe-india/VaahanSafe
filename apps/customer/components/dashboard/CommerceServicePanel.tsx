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
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Subscription & Protection Plan */}
      <div className="flex flex-col justify-between rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div>
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-[#5db8a6]" />
              <h3 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-foreground">
                SERVICE ENTITLEMENT &bull; COVERAGE
              </h3>
            </div>
            <Link
              href="/subscription"
              className="font-mono text-[11px] font-medium text-[#cc785c] hover:underline"
            >
              Plan details →
            </Link>
          </div>

          <div className="mt-4 flex items-start justify-between">
            <div>
              <div className="font-serif text-xl font-medium text-foreground">
                {subscription?.planName || "Standard Protection Shield"}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                Automated 24/7 SMS & WhatsApp golden-hour incident dispatch
              </div>
            </div>

            <span
              className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold ${
                subscription?.status === "ACTIVE"
                  ? "bg-[#5db8a6]/10 text-[#5db8a6]"
                  : "bg-[#e8a55a]/10 text-[#e8a55a]"
              }`}
            >
              {subscription?.status || "ACTIVE"}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3 text-xs">
            <div>
              <span className="font-mono text-[10px] uppercase text-muted-foreground">
                RENEWAL CYCLE:
              </span>
              <div className="font-mono font-medium text-foreground">
                {subscription?.expiresAt
                  ? subscription.expiresAt.slice(0, 10)
                  : "Annual Coverage"}
              </div>
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase text-muted-foreground">
                AUTO-RENEW:
              </span>
              <div className="font-mono font-medium text-foreground">
                {subscription?.autoRenew ? "Enabled" : "Manual Renewal"}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-border pt-3">
          <span className="font-mono text-[10px] text-muted-foreground">
            PROTECTION STATUS: ACTIVE
          </span>
          <Link
            href="/subscription"
            className="rounded-xl border border-border bg-muted/40 px-3 py-1.5 font-mono text-xs font-medium text-foreground hover:bg-muted"
          >
            Manage Coverage
          </Link>
        </div>
      </div>

      {/* Orders & Fulfilment */}
      <div className="flex flex-col justify-between rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div>
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-[#cc785c]" />
              <h3 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-foreground">
                COMMERCE &amp; FULFILMENT
              </h3>
            </div>
            <Link
              href="/orders"
              className="font-mono text-[11px] font-medium text-[#cc785c] hover:underline"
            >
              All orders ({orders.length}) →
            </Link>
          </div>

          <div className="mt-4">
            {orders.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No orders placed yet. Purchase additional QR stickers or replacement kits anytime.
              </div>
            ) : (
              <div className="divide-y divide-border rounded-xl border border-border bg-card text-xs">
                {orders.slice(0, 3).map((o) => (
                  <div key={o.id} className="flex items-center justify-between p-3">
                    <div>
                      <div className="font-mono font-bold text-foreground">
                        {o.orderNumber}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {o.createdAt ? o.createdAt.slice(0, 10) : "Recorded"}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-bold text-foreground">
                        ₹{(o.totalMinor / 100).toFixed(0)}
                      </div>
                      <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[9px] uppercase text-muted-foreground">
                        {o.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-border pt-3">
          <span className="font-mono text-[10px] text-muted-foreground">
            DOORSTEP COURIER DISPATCH
          </span>
          <Link
            href="/qr/buy"
            className="rounded-xl bg-[#cc785c] px-3.5 py-1.5 font-mono text-xs font-semibold text-white hover:bg-[#a9583e]"
          >
            Order New QR Kit
          </Link>
        </div>
      </div>
    </div>
  );
}
