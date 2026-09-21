import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

export function ActivationProofBoundary() {
  return (
    <section
      aria-labelledby="activation-proof-heading"
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
        <div className="rounded-2xl border border-border bg-muted p-8 dark:border-white/[0.08] dark:bg-zinc-900 sm:p-12">
          <div className="max-w-2xl">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#cc785c]">
              06 / Ownership Protection
            </span>

            <h2
              id="activation-proof-heading"
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
              Public QR ≠ Activation Proof
            </h2>

            <p className="mt-5 text-sm leading-relaxed text-[#3f3f46] sm:text-base sm:leading-7 dark:text-zinc-400">
              Scanning a decal code in a parking garage or on the street does not
              transfer ownership or allow a stranger to claim your vehicle.
            </p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-background p-6 dark:border-white/[0.06] dark:bg-zinc-950">
              <div className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground">
                What The Public QR Does
              </div>
              <div className="mt-2 font-serif text-lg text-foreground dark:text-zinc-50">
                Opens The Safety View
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground dark:text-muted-foreground">
                Permits roadside discovery, displays approved context, and facilitates
                immediate contact with designated individuals during an emergency.
              </p>
            </div>

            <div className="rounded-xl border border-[#cc785c]/30 bg-background p-6 dark:border-[#cc785c]/40 dark:bg-zinc-950">
              <div className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#cc785c]">
                What Requires Verification
              </div>
              <div className="mt-2 font-serif text-lg text-[#cc785c]">
                Activation &amp; Vehicle Pairing
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground dark:text-zinc-400">
                Requires holding the physical retail pack&apos;s concealed scratch secret or
                completing authenticated direct order fulfillment in your account.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
