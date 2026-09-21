"use client";

import * as React from "react";
import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";
import { PhysicalQrObject } from "../primitives/PhysicalQrObject";
import { Check, ShieldCheck, Truck, Sparkles } from "lucide-react";
import type { QrBuyOffering } from "@/lib/qr-types";
import { cn } from "@vaahansafe/ui/lib/utils";

interface BuyQrExperienceProps {
  data: QrBuyOffering;
}

export function BuyQrExperience({ data }: BuyQrExperienceProps) {
  const [selectedVehicleId, setSelectedVehicleId] = React.useState(
    data.eligibleVehicles[0]?.id || ""
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const selectedVehicle = data.eligibleVehicles.find((v) => v.id === selectedVehicleId);

  const handleCheckout = () => {
    setIsSubmitting(true);
    const checkoutUrl = `/orders/new?product=${encodeURIComponent(data.productCode)}&vehicle=${encodeURIComponent(selectedVehicleId || "")}`;
    window.location.href = checkoutUrl;
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Breadcrumb back */}
      <Link
        href="/qr"
        className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-[#cc785c]"
      >
        <VaahanIcon name="arrow-left" size={13} aria-hidden="true" />
        <span>Back to My QR Hub</span>
      </Link>

      {/* Hero Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#cc785c]">
            ACQUIRE HARDWARE &bull; STEP 01
          </div>
          <h1 className="mt-1 font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
            Order Genuine QR Safety Kits
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
            Industrial UV-laminated weatherproof stickers with cryptographic identity routing, private owner telecommunication relays, and Pan-India doorstep delivery.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 font-mono text-xs">
          <Truck className="size-4 text-[#cc785c]" />
          <span className="text-muted-foreground">Pan-India Dispatch:</span>
          <span className="font-bold text-foreground">3–5 Business Days</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left 7 Columns: Product Specs & Vehicle Assignment */}
        <div className="lg:col-span-7 space-y-6">
          {/* Step 1: Vehicle Assignment */}
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-[#cc785c]">
                STEP 1: ASSIGN VEHICLE
              </div>
              <span className="font-mono text-[10px] text-muted-foreground">
                Optional Pre-linking
              </span>
            </div>
            <h3 className="mt-1 font-serif text-lg font-medium text-foreground">
              Which vehicle is this kit for?
            </h3>

            {data.eligibleVehicles.length > 0 ? (
              <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {data.eligibleVehicles.map((v) => {
                  const isSelected = v.id === selectedVehicleId;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVehicleId(v.id)}
                      className={cn(
                        "flex items-center justify-between rounded-xl border p-3 text-left transition-all",
                        isSelected
                          ? "border-[#cc785c] bg-[#cc785c]/5 ring-1 ring-[#cc785c]/30"
                          : "border-border bg-background/60 hover:bg-muted"
                      )}
                    >
                      <div>
                        <div className="font-mono text-xs font-bold text-foreground">
                          {v.maskedPlate}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {v.make} {v.model}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="flex size-5 items-center justify-center rounded-full bg-[#cc785c] text-white">
                          <Check className="size-3" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">
                You haven't registered any vehicles yet. You can order the kit now and link it to your vehicle when it arrives.
              </p>
            )}
          </div>

          {/* Product Details & Inclusions */}
          <div className="rounded-2xl border border-[#cc785c]/40 bg-card p-5 sm:p-6 shadow-xs ring-1 ring-[#cc785c]/20">
            <div className="flex items-center justify-between">
              <div className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-[#cc785c]">
                OFFICIAL HARDWARE PACK
              </div>
              <span className="rounded-full bg-[#cc785c] px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase text-white">
                Genuine Kit
              </span>
            </div>

            <h3 className="mt-2 font-serif text-2xl font-medium text-foreground">
              {data.name}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {data.description}
            </p>

            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-bold text-foreground">
                {data.priceFormatted}
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                / 1 Year Safety Identity
              </span>
            </div>

            <div className="mt-5 border-t border-border/80 pt-4">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Kit Inclusions & Protections
              </div>
              <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 text-xs text-muted-foreground">
                {data.inclusions.map((inc, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{inc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Industrial Hardware Specs */}
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <div className="flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.18em] text-[#cc785c]">
              <ShieldCheck className="size-4" />
              <span>MILITARY-GRADE AUTOMOTIVE VINYL</span>
            </div>
            <h4 className="mt-1 font-serif text-lg font-medium text-foreground">
              Engineered for the Indian Climate
            </h4>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs text-muted-foreground">
              <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                <div className="font-bold text-foreground">UV & Heat Proof</div>
                <div className="mt-0.5 text-[11px]">Resists 60°C windshield heat and continuous monsoons.</div>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                <div className="font-bold text-foreground">Tamper Evident</div>
                <div className="mt-0.5 text-[11px]">Subsurface print prevents scratching or code degradation.</div>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                <div className="font-bold text-foreground">Instant Camera Read</div>
                <div className="mt-0.5 text-[11px]">Optimized optical contrast for low-light smartphone scans.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Tangible Sticker Showcase & Order Summary */}
        <div className="lg:col-span-5 space-y-6">
          <div className="sticky top-6 space-y-6">
            <PhysicalQrObject
              publicId="VS-GENUINE"
              visibleCode="VS-ORDER-KIT"
              vehiclePlate={selectedVehicle?.maskedPlate}
              status="OFFICIAL HARDWARE"
              className="w-full shadow-lg"
            />

            {/* Order Checkout Card */}
            <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
              <h3 className="font-serif text-lg font-medium text-foreground">
                Order Summary
              </h3>

              <div className="mt-4 space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Selected Package</span>
                  <span className="font-bold text-foreground">{data.name}</span>
                </div>
                {selectedVehicle && (
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Pre-linked Vehicle</span>
                    <span className="font-mono text-foreground">{selectedVehicle.maskedPlate}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Hardware Shipping</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">FREE</span>
                </div>
                <div className="border-t border-border/80 pt-2.5 flex items-baseline justify-between">
                  <span className="font-serif text-base font-medium text-foreground">Total Payable</span>
                  <span className="font-mono text-2xl font-bold text-foreground">
                    {data.priceFormatted}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCheckout}
                disabled={isSubmitting}
                className="mt-6 flex w-full h-11 items-center justify-center gap-2 rounded-xl bg-[#cc785c] font-mono text-xs font-semibold uppercase tracking-wider text-white transition-all hover:bg-[#b5654b] shadow-xs disabled:opacity-50"
              >
                <Sparkles className="size-4" />
                <span>{isSubmitting ? "Proceeding..." : "Proceed to Secure Checkout"}</span>
              </button>

              <div className="mt-3 text-center font-mono text-[10px] text-muted-foreground">
                Secured by Cashfree &bull; GST Invoice Provided
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
