import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

export function DecalIncludedBaseline() {
  return (
    <section
      aria-labelledby="baseline-heading"
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
          <span>03 / Baseline Entitlement</span>
        </div>

        <div className="mt-4 max-w-[760px]">
          <h2
            id="baseline-heading"
            className="
              font-serif text-3xl font-normal tracking-[-0.03em]
              text-foreground sm:text-4xl
              dark:text-zinc-50
            "
          >
            What every vehicle owner receives.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base dark:text-zinc-400">
            Every VaahanSafe order pairs a durable physical vehicle decal with a digital safety record. Regardless of extended tier selection, every vehicle receives core safety capabilities from day one.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-background p-6 dark:border-white/[0.08] dark:bg-zinc-950">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#cc785c]/10 text-[#cc785c]">
              <VaahanIcon name="qr-code" size={16} aria-hidden="true" />
            </div>
            <h3 className="mt-4 font-mono text-sm font-semibold text-foreground dark:text-zinc-50">
              Physical Decal Asset
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground dark:text-zinc-400">
              Exterior/interior windshield automotive decal with tamper-resistant substrate and high-contrast scannability.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-background p-6 dark:border-white/[0.08] dark:bg-zinc-950">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#5db8a6]/15 text-[#5db8a6]">
              <VaahanIcon name="shield" size={16} aria-hidden="true" />
            </div>
            <h3 className="mt-4 font-mono text-sm font-semibold text-foreground dark:text-zinc-50">
              Verified Vehicle Identity
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground dark:text-zinc-400">
              Unique alphanumeric identity code linked directly to your vehicle registration in your private owner portal.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-background p-6 dark:border-white/[0.08] dark:bg-zinc-950">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#cc785c]/10 text-[#cc785c]">
              <VaahanIcon name="eye" size={16} aria-hidden="true" />
            </div>
            <h3 className="mt-4 font-mono text-sm font-semibold text-foreground dark:text-zinc-50">
              Public Safety View
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground dark:text-zinc-400">
              Configurable mobile page accessible by any standard smartphone camera. No app download required for the bystander.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-background p-6 dark:border-white/[0.08] dark:bg-zinc-950">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#5db8a6]/15 text-[#5db8a6]">
              <VaahanIcon name="phone" size={16} aria-hidden="true" />
            </div>
            <h3 className="mt-4 font-mono text-sm font-semibold text-foreground dark:text-zinc-50">
              Emergency Contact Relay
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground dark:text-zinc-400">
              Direct one-tap connection to your primary emergency contact without publishing your personal phone number to bystanders.
            </p>
          </div>
        </div>

        {/* Clear Policy Boundary Notice */}
        <div className="mt-8 rounded-xl border border-border bg-background p-5 dark:border-white/[0.08] dark:bg-zinc-950">
          <div className="flex items-start gap-3">
            <VaahanIcon name="info" size={16} className="shrink-0 text-muted-foreground mt-0.5" aria-hidden="true" />
            <div className="text-xs leading-relaxed text-muted-foreground dark:text-zinc-400">
              <strong className="font-semibold text-foreground dark:text-zinc-50">
                Physical Stewardship Notice:
              </strong>{" "}
              VaahanSafe decals are manufactured for automotive exposure, but we do not make unsupported claims of indefinite or unconditional lifetime durability. Windshield replacement, extreme impacts, or chemical abrasion may require a replacement decal through our established continuity process.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
