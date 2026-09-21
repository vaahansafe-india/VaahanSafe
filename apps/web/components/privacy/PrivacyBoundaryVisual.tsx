import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

export function PrivacyBoundaryVisual() {
  return (
    <section
      aria-labelledby="privacy-boundary-heading"
      className="
        relative border-b border-border
        bg-muted
        py-12 sm:py-16
        dark:border-border
        dark:bg-[#1c1b18]
      "
    >
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10">
        {/* Boundary Title & Meta */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
            <h2
              id="privacy-boundary-heading"
              className="font-mono text-[8px] font-medium uppercase tracking-[0.2em] text-muted-foreground dark:text-zinc-400"
            >
              Information Boundary Architecture
            </h2>
          </div>

          <span className="font-mono text-[7px] uppercase tracking-[0.16em] text-muted-foreground dark:text-zinc-500">
            Private Account → Owner Control → Public Safety View
          </span>
        </div>

        {/* 3-Tier Boundary Card */}
        <div
          className="
            grid overflow-hidden
            rounded-[20px]
            border border-border
            bg-background
            shadow-sm
            md:grid-cols-[1.1fr_0.9fr_1.1fr]
            dark:border-white/[0.08]
            dark:bg-zinc-950
          "
        >
          {/* TIER 1: PRIVATE ACCOUNT */}
          <div className="flex flex-col justify-between p-6 sm:p-7 border-b border-border md:border-b-0 md:border-r dark:border-white/[0.08]">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[6px] tracking-[0.16em] text-muted-foreground dark:text-zinc-500">
                  01 / ACCOUNT DOMAIN
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.04] px-2 py-0.5 font-mono text-[7px] font-medium uppercase tracking-[0.14em] text-muted-foreground dark:bg-white/[0.06] dark:text-zinc-400">
                  <VaahanIcon name="lock" size={9} aria-hidden="true" />
                  Private
                </span>
              </div>

              <h3 className="mt-3 font-serif text-xl font-normal text-foreground dark:text-zinc-50">
                Private Account
              </h3>

              <p className="mt-2 text-xs leading-relaxed text-muted-foreground dark:text-muted-foreground">
                Your fundamental account records remain strictly isolated. They are never exposed to QR finders or public viewers.
              </p>

              {/* Private Fields */}
              <ul className="mt-5 space-y-2 border-t border-border/60 pt-4 text-xs dark:border-white/[0.06]">
                <li className="flex items-center gap-2 text-[#3f3f46] dark:text-zinc-200">
                  <span className="h-1 w-1 rounded-full bg-[#a1a1aa]" />
                  <span>Residential delivery address</span>
                </li>
                <li className="flex items-center gap-2 text-[#3f3f46] dark:text-zinc-200">
                  <span className="h-1 w-1 rounded-full bg-[#a1a1aa]" />
                  <span>Account email address</span>
                </li>
                <li className="flex items-center gap-2 text-[#3f3f46] dark:text-zinc-200">
                  <span className="h-1 w-1 rounded-full bg-[#a1a1aa]" />
                  <span>Authentication credentials & logs</span>
                </li>
                <li className="flex items-center gap-2 text-[#3f3f46] dark:text-zinc-200">
                  <span className="h-1 w-1 rounded-full bg-[#a1a1aa]" />
                  <span>Billing history & payment tokens</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 font-mono text-[7px] tracking-[0.12em] text-muted-foreground/70 dark:text-zinc-500">
              STATUS: ARCHITECTURALLY CONCEALED
            </div>
          </div>

          {/* TIER 2: YOUR CONTROLS */}
          <div
            className="
              flex flex-col justify-between p-6 sm:p-7
              border-b border-border md:border-b-0 md:border-r
              bg-[#fdfbf7]
              dark:border-white/[0.08] dark:bg-[#1e1c19]
            "
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[6px] tracking-[0.16em] text-[#cc785c]">
                  02 / CONTROL BRIDGE
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#cc785c]/10 px-2 py-0.5 font-mono text-[7px] font-medium uppercase tracking-[0.14em] text-[#cc785c]">
                  <VaahanIcon name="shield" size={9} aria-hidden="true" />
                  Owner Control
                </span>
              </div>

              <h3 className="mt-3 font-serif text-xl font-normal text-foreground dark:text-zinc-50">
                Your Choices
              </h3>

              <p className="mt-2 text-xs leading-relaxed text-muted-foreground dark:text-muted-foreground">
                You decide which supported safety information crosses into the public projection.
              </p>

              {/* Control Actions */}
              <div className="mt-5 space-y-2 border-t border-border/60 pt-4 text-xs dark:border-white/[0.06]">
                <div className="flex items-start gap-2 text-[#3f3f46] dark:text-zinc-200">
                  <VaahanIcon name="arrow-right" size={11} className="mt-0.5 shrink-0 text-[#cc785c]" />
                  <span>Choose supported emergency contacts</span>
                </div>
                <div className="flex items-start gap-2 text-[#3f3f46] dark:text-zinc-200">
                  <VaahanIcon name="arrow-right" size={11} className="mt-0.5 shrink-0 text-[#cc785c]" />
                  <span>Toggle medical blood group visibility</span>
                </div>
                <div className="flex items-start gap-2 text-[#3f3f46] dark:text-zinc-200">
                  <VaahanIcon name="arrow-right" size={11} className="mt-0.5 shrink-0 text-[#cc785c]" />
                  <span>Enable masked voice / SMS relay options</span>
                </div>
                <div className="flex items-start gap-2 text-[#3f3f46] dark:text-zinc-200">
                  <VaahanIcon name="arrow-right" size={11} className="mt-0.5 shrink-0 text-[#cc785c]" />
                  <span>Update or pause projection anytime</span>
                </div>
              </div>
            </div>

            <div className="mt-6 font-mono text-[7px] tracking-[0.12em] text-[#cc785c]">
              POLICY: ZERO DEFAULT EXPOSURE
            </div>
          </div>

          {/* TIER 3: PUBLIC SAFETY VIEW */}
          <div
            className="
              flex flex-col justify-between p-6 sm:p-7
              bg-[#09090b] text-[#fafafa]
            "
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[6px] tracking-[0.16em] text-[#5db8a6]">
                  03 / RESOLVER PROJECTION
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#5db8a6]/15 px-2 py-0.5 font-mono text-[7px] font-medium uppercase tracking-[0.14em] text-[#5db8a6]">
                  <VaahanIcon name="qr" size={9} aria-hidden="true" />
                  Public View
                </span>
              </div>

              <h3 className="mt-3 font-serif text-xl font-normal text-[#fafafa]">
                Public Safety View
              </h3>

              <p className="mt-2 text-xs leading-relaxed text-[#a1a1aa]">
                Only the designated safety details are projected when someone scans the vehicle&apos;s physical QR code.
              </p>

              {/* Public Elements */}
              <ul className="mt-5 space-y-2 border-t border-white/[0.08] pt-4 text-xs">
                <li className="flex items-center gap-2 text-[#f4f4f5]">
                  <span className="h-1 w-1 rounded-full bg-[#5db8a6]" />
                  <span>Vehicle context (make, model, type)</span>
                </li>
                <li className="flex items-center gap-2 text-[#f4f4f5]">
                  <span className="h-1 w-1 rounded-full bg-[#5db8a6]" />
                  <span>Selected emergency contact relay</span>
                </li>
                <li className="flex items-center gap-2 text-[#f4f4f5]">
                  <span className="h-1 w-1 rounded-full bg-[#5db8a6]" />
                  <span>Blood group (if optional entry provided)</span>
                </li>
                <li className="flex items-center gap-2 text-[#f4f4f5]">
                  <span className="h-1 w-1 rounded-full bg-[#5db8a6]" />
                  <span>Critical safety or medical notes</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 font-mono text-[7px] tracking-[0.12em] text-[#5db8a6]">
              SURFACE: qr.vaahansafe.com
            </div>
          </div>
        </div>

        {/* Core takeaway banner */}
        <div className="mt-6 flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3 text-xs text-muted-foreground dark:border-white/[0.08] dark:bg-zinc-950 dark:text-zinc-400">
          <div className="flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
            <span>
              <strong>Key Assurance:</strong> A QR scan reveals the configured safety view—never your private address, login details, or billing account.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
