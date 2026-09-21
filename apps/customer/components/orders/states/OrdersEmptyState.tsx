"use client";

import Link from "next/link";
import { Button } from "@vaahansafe/ui/components";
import { VaahanIcon } from "@vaahansafe/icons";

export function OrdersEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/60 px-6 py-16 text-center shadow-xs">
      <div className="flex size-14 items-center justify-center rounded-2xl border border-[#cc785c]/30 bg-[#cc785c]/10 text-[#cc785c]">
        <VaahanIcon name="package" className="size-7" />
      </div>

      <div className="mt-4 font-mono text-[10px] uppercase tracking-[0.24em] text-[#cc785c]">
        Hardware Fulfillment
      </div>

      <h3 className="mt-1 font-serif text-xl font-medium tracking-tight text-foreground">
        No QR Kit Orders Yet
      </h3>

      <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
        Physical VaahanSafe QR hardware orders will appear here once placed. Each order provides end-to-end courier fulfillment tracking directly to your doorstep.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button asChild className="bg-[#cc785c] hover:bg-[#a9583e] text-white font-mono text-xs uppercase tracking-wider h-10 px-5">
          <Link href="/qr/buy">
            <span>Get a QR Kit</span>
            <VaahanIcon name="arrow-right" className="size-3.5 ml-1.5" />
          </Link>
        </Button>

        <Button asChild variant="outline" className="border-border hover:bg-muted font-mono text-xs uppercase tracking-wider h-10 px-4">
          <Link href="/qr/activate">
            <span>Activate Retail QR</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
