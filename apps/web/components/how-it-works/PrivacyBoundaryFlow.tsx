import * as React from "react";
import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";

export function PrivacyBoundaryFlow() {
  return (
    <section
      aria-labelledby="privacy-boundary-heading"
      className="
        relative isolate overflow-hidden
        border-b border-border
        bg-background
        py-16
        sm:py-20
        lg:py-24
        dark:border-border
        dark:bg-zinc-950
      "
    >
      <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10">
        <div className="max-w-2xl">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#cc785c]">
            06 / Privacy Controls
          </span>

          <h2
            id="privacy-boundary-heading"
            className="
              mt-3 font-serif
              text-3xl font-normal leading-[1.1]
              tracking-[-0.03em]
              text-foreground
              sm:text-4xl
              lg:text-5xl
              dark:text-zinc-50
            "
          >
            A scan should never open your account.
          </h2>

          <p className="mt-5 text-sm leading-relaxed text-[#3f3f46] sm:text-base sm:leading-7 dark:text-zinc-400">
            VaahanSafe maintains a strict boundary between private account information
            and what is rendered during a public roadside scan.
          </p>
        </div>

        {/* 3-Tier Boundary Progression */}
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {/* Tier 1: Private Account */}
          <div className="rounded-2xl border border-border bg-muted p-6 dark:border-white/[0.08] dark:bg-zinc-900 sm:p-8">
            <div className="flex items-center justify-between font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground">
              <span>Private Account</span>
              <span className="text-[#c64545]">Never Public</span>
            </div>

            <div className="mt-6 space-y-3 font-mono text-[11px]">
              <div className="flex items-center justify-between rounded-lg border border-border bg-background p-3 dark:border-white/[0.06] dark:bg-zinc-950">
                <span className="text-[#3f3f46] dark:text-zinc-400">Residential Address</span>
                <span className="text-muted-foreground">Hidden</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border bg-background p-3 dark:border-white/[0.06] dark:bg-zinc-950">
                <span className="text-[#3f3f46] dark:text-zinc-400">Primary Account Email</span>
                <span className="text-muted-foreground">Hidden</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border bg-background p-3 dark:border-white/[0.06] dark:bg-zinc-950">
                <span className="text-[#3f3f46] dark:text-zinc-400">Billing & Payment Data</span>
                <span className="text-muted-foreground">Hidden</span>
              </div>
            </div>

            <p className="mt-6 text-xs text-muted-foreground dark:text-muted-foreground">
              Stored securely for customer management. Completely shielded from public QR scans.
            </p>
          </div>

          {/* Tier 2: Your Controls */}
          <div className="rounded-2xl border border-[#cc785c]/30 bg-[#cc785c]/[0.03] p-6 dark:border-[#cc785c]/40 dark:bg-[#cc785c]/[0.05] sm:p-8">
            <div className="flex items-center justify-between font-mono text-[8px] uppercase tracking-[0.16em] text-[#cc785c]">
              <span>Your Controls</span>
              <span>Owner Governed</span>
            </div>

            <div className="mt-6 space-y-3 font-mono text-[11px]">
              <div className="flex items-center justify-between rounded-lg border border-[#cc785c]/20 bg-background p-3 dark:border-white/[0.06] dark:bg-zinc-950">
                <span className="text-[#3f3f46] dark:text-zinc-400">Emergency Contacts</span>
                <span className="text-[#cc785c]">Selectable</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-[#cc785c]/20 bg-background p-3 dark:border-white/[0.06] dark:bg-zinc-950">
                <span className="text-[#3f3f46] dark:text-zinc-400">Medical & Blood Group</span>
                <span className="text-[#cc785c]">Optional</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-[#cc785c]/20 bg-background p-3 dark:border-white/[0.06] dark:bg-zinc-950">
                <span className="text-[#3f3f46] dark:text-zinc-400">Safety Notes</span>
                <span className="text-[#cc785c]">Customizable</span>
              </div>
            </div>

            <p className="mt-6 text-xs text-muted-foreground dark:text-muted-foreground">
              You determine the visibility of each attribute. Turn fields on or off whenever you want.
            </p>
          </div>

          {/* Tier 3: Public Safety View */}
          <div className="rounded-2xl border border-[#5db8a6]/30 bg-[#5db8a6]/[0.03] p-6 dark:border-[#5db8a6]/40 dark:bg-[#5db8a6]/[0.05] sm:p-8">
            <div className="flex items-center justify-between font-mono text-[8px] uppercase tracking-[0.16em] text-[#5db8a6]">
              <span>Public Safety View</span>
              <span>Roadside Projection</span>
            </div>

            <div className="mt-6 space-y-3 font-mono text-[11px]">
              <div className="flex items-center justify-between rounded-lg border border-[#5db8a6]/20 bg-background p-3 dark:border-white/[0.06] dark:bg-zinc-950">
                <span className="text-[#3f3f46] dark:text-zinc-400">Vehicle Code</span>
                <span className="text-[#5db8a6]">VS-7F3K-9021</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-[#5db8a6]/20 bg-background p-3 dark:border-white/[0.06] dark:bg-zinc-950">
                <span className="text-[#3f3f46] dark:text-zinc-400">Emergency Relay</span>
                <span className="text-[#5db8a6]">One-Tap Connect</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-[#5db8a6]/20 bg-background p-3 dark:border-white/[0.06] dark:bg-zinc-950">
                <span className="text-[#3f3f46] dark:text-zinc-400">Emergency Context</span>
                <span className="text-[#5db8a6]">Visible</span>
              </div>
            </div>

            <p className="mt-6 text-xs text-muted-foreground dark:text-muted-foreground">
              What the responder sees when they scan. Fast, clear, and privacy-respecting.
            </p>
          </div>
        </div>

        {/* Link to dedicated product safety page */}
        <div className="mt-12 flex justify-start">
          <Link
            href="/safety"
            className="
              inline-flex items-center gap-2 font-mono text-[11px]
              font-medium uppercase tracking-[0.14em] text-[#cc785c]
              hover:text-[#a9583e]
            "
          >
            <span>Explore Safety &amp; Privacy Architecture</span>
            <VaahanIcon name="arrow-right" size={12} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
