"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@vaahansafe/ui/components";
import { VaahanIcon } from "@vaahansafe/icons";
import { IdentityObject } from "./identity-object";

export function SafetyIdentityHero() {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28">
      {/* Background Subtle Geometric Route Trace Grid (No distracting gradient blobs) */}
      <div
        className="absolute inset-0 -z-10 opacity-[0.035] dark:opacity-[0.05] pointer-events-none bg-[radial-gradient(#0D4844_1px,transparent_1px)] [background-size:24px_24px]"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          {/* LEFT EDITORIAL COLUMN (54% on desktop) */}
          <div className="space-y-8 lg:col-span-7">
            {/* Technical Overline Badge */}
            <div className="inline-flex items-center gap-2 rounded-md bg-accent/60 px-3 py-1 text-xs font-mono font-semibold uppercase tracking-wider text-accent-foreground border border-accent">
              <VaahanIcon name="shield" size={13} className="text-primary" />
              <span>VAHANSAFE &bull; VEHICLE SAFETY IDENTITY</span>
            </div>

            {/* Main Headline */}
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl leading-[1.08]">
                Your vehicle has an identity. <br className="hidden sm:inline" />
                <span className="text-primary dark:text-[#45C3B3]">
                  Make it useful when it matters.
                </span>
              </h1>

              {/* Supporting Statement */}
              <p className="max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
                A permanent QR connects your vehicle to a controlled emergency profile,
                approved contacts and the VaahanSafe safety network. Accessible immediately to any
                bystander without exposing your personal phone number or private account.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Button asChild size="default" className="shadow-sm font-semibold h-11 px-6">
                <Link href="#get-vaahansafe" className="inline-flex items-center gap-2">
                  <span>Get VaahanSafe</span>
                  <VaahanIcon name="arrow-right" size={16} />
                </Link>
              </Button>

              <Button asChild variant="outline" size="default" className="h-11 px-5 border-border">
                <Link href="#how-it-works" className="inline-flex items-center gap-2">
                  <VaahanIcon name="route" size={16} className="text-primary" />
                  <span>See How It Works</span>
                </Link>
              </Button>
            </div>

            {/* Trust & Technical Guarantees Sub-bar */}
            <div className="pt-4 border-t border-border/80">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-foreground flex-shrink-0">
                    <VaahanIcon name="qr-scan" size={12} />
                  </div>
                  <span className="font-medium text-foreground">No app required to scan</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-foreground flex-shrink-0">
                    <VaahanIcon name="lock" size={12} />
                  </div>
                  <span className="font-medium text-foreground">Privacy-controlled profile</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-foreground flex-shrink-0">
                    <VaahanIcon name="qr" size={12} />
                  </div>
                  <span className="font-medium text-foreground">Physical + digital QR</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT PRODUCT ARTIFACT COLUMN (46% on desktop) */}
          <div className="lg:col-span-5 flex items-center justify-center">
            <IdentityObject />
          </div>
        </div>
      </div>
    </section>
  );
}
