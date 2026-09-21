"use client";

import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

export function SubscriptionErrorState() {
  return (
    <div className="space-y-6">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#cc785c]">
          Services / Subscription
        </div>
        <h1 className="mt-1 font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          Your VaahanSafe services.
        </h1>
      </div>

      <div className="rounded-3xl border border-border bg-card p-8 sm:p-12 text-center max-w-lg mx-auto space-y-5 shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#c64545]/10 text-[#c64545]">
          <VaahanIcon name="warning" size={28} />
        </div>

        <div className="space-y-2">
          <span className="font-mono text-[11px] uppercase tracking-widest text-[#c64545] font-semibold">
            Service Unavailable
          </span>
          <h2 className="font-serif text-2xl font-medium text-foreground">
            We couldn&apos;t load your service details.
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Please refresh the page or try again in a few moments. Your vehicle identity and emergency profiles remain active.
          </p>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#cc785c] px-5 font-mono text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#a9583e] transition-colors"
          >
            <VaahanIcon name="loading" size={13} />
            <span>Retry Query</span>
          </button>
        </div>
      </div>
    </div>
  );
}
