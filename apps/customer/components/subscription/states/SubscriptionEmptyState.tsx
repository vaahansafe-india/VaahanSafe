"use client";

import * as React from "react";
import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";

export function SubscriptionEmptyState() {
  return (
    <div className="space-y-6">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#cc785c]">
          Services / Subscription
        </div>
        <h1 className="mt-1 font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          Your VaahanSafe services.
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          See the services connected to your vehicle identities, manage your plan, and understand what is currently enabled.
        </p>
      </div>

      <div className="rounded-3xl border border-border bg-card p-8 sm:p-12 text-center max-w-xl mx-auto space-y-5 shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#cc785c]/10 text-[#cc785c]">
          <VaahanIcon name="vehicle" size={28} />
        </div>

        <div className="space-y-2">
          <span className="font-mono text-[11px] uppercase tracking-widest text-[#cc785c] font-semibold">
            Registration Required
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-medium text-foreground">
            Your service starts with a vehicle.
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Add a vehicle to generate your VaahanSafe safety identity and connect it to available emergency resolution services and plans.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/vehicles"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#cc785c] px-6 font-mono text-xs font-semibold uppercase tracking-wider text-white shadow-xs hover:bg-[#a9583e] transition-all"
          >
            <VaahanIcon name="vehicle" size={14} />
            <span>Add Vehicle →</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
