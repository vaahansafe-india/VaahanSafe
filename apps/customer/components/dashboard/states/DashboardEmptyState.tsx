"use client";

import * as React from "react";
import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";

export function DashboardEmptyState() {
  return (
    <div className="flex min-h-[500px] flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card p-8 text-center sm:p-12">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#cc785c]/10 text-[#cc785c] ring-1 ring-[#cc785c]/20">
        <VaahanIcon name="vehicle" size={32} />
      </div>

      <div className="mt-6 font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-[#cc785c]">
        VEHICLE IDENTITY COMMAND SURFACE
      </div>

      <h2 className="mt-2 font-serif text-3xl font-normal text-foreground sm:text-4xl">
        Register your primary vehicle.
      </h2>

      <p className="mt-3 max-w-md text-xs sm:text-sm text-muted-foreground leading-relaxed">
        Connect your car, motorcycle, or commercial vehicle to generate your authoritative VaahanSafe safety identity, pair your QR sticker, and establish your emergency contact network.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/vehicles/new"
          className="inline-flex items-center gap-2 rounded-xl bg-[#cc785c] px-6 py-3 font-mono text-xs font-semibold text-white shadow-xs transition-all hover:bg-[#a9583e] hover:shadow-sm"
        >
          <VaahanIcon name="vehicle" size={15} />
          <span>Register First Vehicle →</span>
        </Link>

        <Link
          href="/qr/activate"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 font-mono text-xs font-medium text-foreground transition-all hover:bg-muted"
        >
          <VaahanIcon name="qr-scan" size={15} />
          <span>Activate Retail QR Kit</span>
        </Link>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-4 text-left sm:grid-cols-3 max-w-2xl border-t border-border pt-8">
        <div className="space-y-1">
          <div className="font-mono text-xs font-bold text-foreground">01. Vehicle Identity</div>
          <div className="text-[11px] text-muted-foreground">
            Official identity record tied to Indian transport registration.
          </div>
        </div>
        <div className="space-y-1">
          <div className="font-mono text-xs font-bold text-foreground">02. Cryptographic QR</div>
          <div className="text-[11px] text-muted-foreground">
            Tamper-evident physical safety sticker with zero exposed personal phone numbers.
          </div>
        </div>
        <div className="space-y-1">
          <div className="font-mono text-xs font-bold text-foreground">03. Emergency Protocol</div>
          <div className="text-[11px] text-muted-foreground">
            Automated SMS and WhatsApp dispatch to priority responders during golden-hour incidents.
          </div>
        </div>
      </div>
    </div>
  );
}
