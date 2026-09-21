"use client";

import Link from "next/link";
import { Button } from "@vaahansafe/ui/components";
import { VaahanIcon } from "@vaahansafe/icons";
import { ProductMedia } from "./media/ProductMedia";

export function OrdersHero() {
  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card/95 to-background p-4 sm:p-6 lg:p-8 shadow-xs">
      {/* Background ambient lighting */}
      <div className="absolute -right-16 -top-16 size-80 rounded-full bg-[#cc785c]/5 blur-3xl pointer-events-none" />

      <div className="relative grid grid-cols-1 items-center gap-6 sm:gap-8 lg:grid-cols-12 lg:gap-8">
        {/* LEFT COLUMN: Editorial & Signals (55-60%) */}
        <div className="lg:col-span-7 space-y-4 sm:space-y-5">
          <div className="space-y-1.5 sm:space-y-2">
            <div className="inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[#cc785c]">
              <span className="size-1.5 rounded-full bg-[#cc785c]" />
              <span>Hardware Fulfillment</span>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-4xl xl:text-5xl font-medium tracking-tight text-foreground">
              Orders &amp; Shipments
            </h1>

            <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-xl leading-relaxed">
              Track your VaahanSafe physical QR hardware kit from confirmed purchase to front-door courier delivery and vehicle connection.
            </p>
          </div>

          {/* Factual Signals - Chips on mobile, inline bullet on desktop */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 pt-0.5 text-xs text-muted-foreground font-mono">
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-muted/50 sm:bg-transparent px-2.5 sm:px-0 py-1 sm:py-0 border border-border/60 sm:border-0 text-[11px] sm:text-xs">
              <VaahanIcon name="check" className="size-3 sm:size-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
              <span>Payment Verified</span>
            </div>
            <span className="hidden sm:inline text-border">&bull;</span>
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-muted/50 sm:bg-transparent px-2.5 sm:px-0 py-1 sm:py-0 border border-border/60 sm:border-0 text-[11px] sm:text-xs">
              <VaahanIcon name="truck" className="size-3 sm:size-3.5 text-[#cc785c] shrink-0" />
              <span>Trackable Courier</span>
            </div>
            <span className="hidden sm:inline text-border">&bull;</span>
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-muted/50 sm:bg-transparent px-2.5 sm:px-0 py-1 sm:py-0 border border-border/60 sm:border-0 text-[11px] sm:text-xs">
              <VaahanIcon name="qr" className="size-3 sm:size-3.5 text-[#cc785c] shrink-0" />
              <span>Activation After Delivery</span>
            </div>
          </div>

          {/* Sequence Breadcrumb */}
          <div className="hidden sm:flex items-center gap-2 pt-1 text-[11px] font-mono text-muted-foreground/80 overflow-x-auto">
            <span className="text-foreground font-medium">Order</span>
            <span>&rarr;</span>
            <span className="text-foreground font-medium">Physical Kit</span>
            <span>&rarr;</span>
            <span className="text-foreground font-medium">Shipment</span>
            <span>&rarr;</span>
            <span className="text-foreground font-medium">Vehicle</span>
            <span>&rarr;</span>
            <span className="text-[#cc785c] font-semibold">QR Activation</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Product Media & Quick CTA (40-45%) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="relative group">
            <ProductMedia
              variant="hero"
              alt="VaahanSafe Physical QR Kit with Vehicle Safety Sticker"
              priority
            />
            {/* Overlay badge indicating authentic kit */}
            <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 right-2 sm:right-3 flex items-center justify-between rounded-lg sm:rounded-xl border border-white/15 bg-black/75 px-2.5 sm:px-3.5 py-1.5 sm:py-2 backdrop-blur-md text-white text-[10px] sm:text-xs">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <span className="size-1.5 sm:size-2 rounded-full bg-teal-400 shrink-0" />
                <span className="font-mono text-[10px] sm:text-[11px] font-semibold truncate">
                  Tamper-Evident Safety Pack
                </span>
              </div>
              <span className="font-mono text-[9px] sm:text-[10px] text-white/70 shrink-0 ml-1.5">
                Genuine Kit
              </span>
            </div>
          </div>

          <div className="flex justify-end">
            <Button asChild size="sm" className="h-9 gap-1.5 bg-[#cc785c] hover:bg-[#a9583e] text-white font-mono text-xs uppercase tracking-wider w-full sm:w-auto">
              <Link href="/qr/buy">
                <span>+ Buy Another QR</span>
                <VaahanIcon name="arrow-right" className="size-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
