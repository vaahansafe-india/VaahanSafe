"use client";

import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";
import { Button } from "@vaahansafe/ui";

export function PaymentsEmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card p-8 sm:p-12 text-center space-y-5">
      <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-border bg-background text-[#cc785c] shadow-xs">
        <VaahanIcon name="payment" size={24} />
      </div>

      <div className="space-y-1.5 max-w-md mx-auto">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#cc785c]">
          Financial Ledger
        </div>
        <h3 className="font-serif text-2xl font-medium text-foreground">
          No Payment Records Yet
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Verified VaahanSafe payments, subscription renewals, and official commercial documents will appear here once an order checkout is completed.
        </p>
      </div>

      <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="sm" className="bg-[#cc785c] hover:bg-[#a9583e] text-white font-mono text-xs h-9 px-4">
          <Link href="/qr/buy">
            <span>Order QR Safety Kit</span>
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="border-border font-mono text-xs h-9 px-4">
          <Link href="/subscription">
            <span>Explore Service Plans</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
