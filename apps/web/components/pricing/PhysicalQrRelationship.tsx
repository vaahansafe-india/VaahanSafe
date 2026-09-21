import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

export function PhysicalQrRelationship() {
  return (
    <section
      aria-labelledby="physical-relationship-heading"
      className="
        border-b border-border
        bg-muted/50
        py-16 sm:py-20
        dark:border-border
        dark:bg-zinc-900/50
      "
    >
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10">
        <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground dark:text-zinc-500">
          <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
          <span>06 / Decal Hardware & Enrollment</span>
        </div>

        <div className="mt-4 max-w-[760px]">
          <h2
            id="physical-relationship-heading"
            className="
              font-serif text-3xl font-normal tracking-[-0.03em]
              text-foreground sm:text-4xl
              dark:text-zinc-50
            "
          >
            How the physical decal pairs with your plan.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base dark:text-zinc-400">
            We keep the physical vehicle identity straightforward and unencumbered. Understanding the relationship ensures clarity throughout ownership.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-background p-6 dark:border-white/[0.08] dark:bg-zinc-950">
            <div className="font-mono text-[10px] uppercase tracking-wider text-[#cc785c]">
              Initial Order
            </div>
            <h3 className="mt-2 font-serif text-xl text-foreground dark:text-zinc-50">
              Hardware Bundled
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground dark:text-zinc-400">
              When ordering online, your initial package includes the manufactured automotive QR decal paired with the baseline Essential Safety software entitlement.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-background p-6 dark:border-white/[0.08] dark:bg-zinc-950">
            <div className="font-mono text-[10px] uppercase tracking-wider text-[#cc785c]">
              Multiple Vehicles
            </div>
            <h3 className="mt-2 font-serif text-xl text-foreground dark:text-zinc-50">
              One Account, Separate Identities
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground dark:text-zinc-400">
              A single owner account can manage multiple vehicle decals. Each car or two-wheeler receives its own unique QR code and individual safety settings.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-background p-6 dark:border-white/[0.08] dark:bg-zinc-950">
            <div className="font-mono text-[10px] uppercase tracking-wider text-[#cc785c]">
              Hardware Replacement
            </div>
            <h3 className="mt-2 font-serif text-xl text-foreground dark:text-zinc-50">
              Hardware Decoupled From Account
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground dark:text-zinc-400">
              If a windshield is replaced, you do not lose your account or configured safety profile. A fresh decal can be ordered and safely paired to your vehicle profile.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
