import * as React from "react";
import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";

export function PlanRelationshipCard() {
  return (
    <div className="my-8 overflow-hidden rounded-xl border border-border bg-background p-6 sm:p-8 dark:border-white/[0.08] dark:bg-zinc-950">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-mono text-[7px] uppercase tracking-[0.2em] text-[#cc785c]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
          <span>Product Distinction</span>
        </div>

        <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.14em] text-[#cc785c]">
          QR IDENTITY ≠ SUBSCRIPTION
        </span>
      </div>

      <h3 className="mt-3 font-serif text-xl font-normal text-foreground sm:text-2xl dark:text-zinc-50">
        The vehicle QR identity and paid services are separate concepts.
      </h3>

      <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm sm:leading-7 dark:text-zinc-400">
        Your physical decal anchors the vehicle identity to the platform, while optional service subscriptions unlock active notification and emergency relay capabilities.
      </p>

      {/* Visual Separation Diagram */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-muted/60 p-4 dark:border-white/[0.06] dark:bg-zinc-900">
          <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted-foreground dark:text-zinc-500">
            Hardware Decal
          </span>
          <p className="mt-1 font-mono text-sm font-semibold text-foreground dark:text-zinc-50">
            Vehicle Identity (e.g. VS-7F3K-9021)
          </p>
          <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground dark:text-zinc-400">
            <li>• Physical QR sticker affixed to vehicle</li>
            <li>• Unique cryptographic locator token</li>
            <li>• Baseline roadside safety view profile</li>
          </ul>
        </div>

        <div className="rounded-lg border border-[#cc785c]/30 bg-muted/60 p-4 dark:border-[#cc785c]/20 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-[#cc785c]">
              Software Layer
            </span>
            <span className="font-mono text-[8px] text-[#5db8a6]">Active Feature Matrix</span>
          </div>
          <p className="mt-1 font-mono text-sm font-semibold text-foreground dark:text-zinc-50">
            Services & Active Subscription
          </p>
          <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground dark:text-zinc-400">
            <li>• Automated emergency relay calls & SMS</li>
            <li>• Real-time owner notification alerts</li>
            <li>• Multi-contact priority escalation</li>
          </ul>
        </div>
      </div>

      {/* Pricing & Policy Footer */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4 dark:border-white/[0.06]">
        <div className="text-xs text-muted-foreground dark:text-zinc-400">
          For current subscription tiers, renewal terms, and bundled features, view our{" "}
          <Link
            href="/#pricing"
            className="font-medium text-[#cc785c] underline hover:text-[#a9583e]"
          >
            pricing directory
          </Link>
          .
        </div>

        <div className="font-mono text-[7px] uppercase tracking-[0.14em] text-muted-foreground dark:text-zinc-500">
          PRODUCT + LEGAL CONFIRMATION REQUIRED FOR POST-EXPIRY RETENTION
        </div>
      </div>
    </div>
  );
}
