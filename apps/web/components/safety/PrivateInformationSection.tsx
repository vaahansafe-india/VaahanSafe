import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

export function PrivateInformationSection() {
  return (
    <section
      aria-labelledby="private-info-heading"
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
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          {/* Left: Explanatory Context */}
          <div>
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
              02 / Absolute Privacy
            </span>

            <h2
              id="private-info-heading"
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
              Some information
              <br />
              stays private.
            </h2>

            <p className="mt-5 text-sm leading-relaxed text-[#3f3f46] sm:text-base sm:leading-7 dark:text-zinc-400">
              VaahanSafe treats your account management data with strict confidentiality.
              Details used to bill, ship decals, or maintain your account credentials are
              isolated by default and are never broadcast on the public QR view.
            </p>

            <p className="mt-4 text-xs leading-relaxed text-muted-foreground sm:text-sm sm:leading-6 dark:text-muted-foreground">
              Whether someone scans your vehicle in a parking lot or on an open highway,
              they can never deduce where you reside, your private inbox, or your payment credentials.
            </p>
          </div>

          {/* Right: Private Fields Matrix */}
          <div className="rounded-2xl border border-border bg-muted p-6 dark:border-white/[0.08] dark:bg-zinc-900 sm:p-8">
            <div className="flex items-center justify-between font-mono text-[8px] uppercase tracking-[0.18em] text-muted-foreground">
              <span>Private Account Tier</span>
              <span>NEVER EXPOSED</span>
            </div>

            <div className="mt-6 space-y-3 font-mono text-[11px]">
              <div className="flex items-center justify-between rounded-xl border border-border bg-background p-4 dark:border-white/[0.06] dark:bg-zinc-950">
                <div className="flex items-center gap-2.5">
                  <VaahanIcon name="lock" size={13} className="text-muted-foreground" aria-hidden="true" />
                  <span className="font-medium text-foreground dark:text-zinc-50">Residential Address</span>
                </div>
                <span className="rounded bg-[#e4e4e7]/60 px-2 py-0.5 text-[8px] text-muted-foreground dark:bg-white/[0.08] dark:text-muted-foreground">
                  Private
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border bg-background p-4 dark:border-white/[0.06] dark:bg-zinc-950">
                <div className="flex items-center gap-2.5">
                  <VaahanIcon name="lock" size={13} className="text-muted-foreground" aria-hidden="true" />
                  <span className="font-medium text-foreground dark:text-zinc-50">Account Email</span>
                </div>
                <span className="rounded bg-[#e4e4e7]/60 px-2 py-0.5 text-[8px] text-muted-foreground dark:bg-white/[0.08] dark:text-muted-foreground">
                  Private
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border bg-background p-4 dark:border-white/[0.06] dark:bg-zinc-950">
                <div className="flex items-center gap-2.5">
                  <VaahanIcon name="lock" size={13} className="text-muted-foreground" aria-hidden="true" />
                  <span className="font-medium text-foreground dark:text-zinc-50">Account Information &amp; Billing</span>
                </div>
                <span className="rounded bg-[#e4e4e7]/60 px-2 py-0.5 text-[8px] text-muted-foreground dark:bg-white/[0.08] dark:text-muted-foreground">
                  Private
                </span>
              </div>
            </div>

            <p className="mt-6 font-mono text-[8px] uppercase tracking-wider text-muted-foreground">
              * Note: Owner display name may be optionally configured if you wish emergency responders to address you correctly.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
