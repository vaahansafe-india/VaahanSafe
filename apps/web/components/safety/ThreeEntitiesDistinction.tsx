import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

export function ThreeEntitiesDistinction() {
  return (
    <section
      aria-labelledby="three-entities-heading"
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
            05 / Conceptual Taxonomy
          </span>

          <h2
            id="three-entities-heading"
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
            Three distinct things.
            <br />
            Often confused.
          </h2>

          <p className="mt-5 text-sm leading-relaxed text-[#3f3f46] sm:text-base sm:leading-7 dark:text-zinc-400">
            To build trust, we design clean separations between account ownership,
            the vehicle&apos;s permanent identity, and the momentary safety view.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {/* Entity A: Account */}
          <div className="rounded-2xl border border-border bg-muted p-8 dark:border-white/[0.08] dark:bg-zinc-900">
            <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
              <VaahanIcon name="user" size={13} aria-hidden="true" />
              <span>01 / The Account</span>
            </div>

            <div className="mt-4 font-serif text-2xl text-foreground dark:text-zinc-50">
              Where You Manage
            </div>

            <p className="mt-3 text-xs leading-relaxed text-muted-foreground dark:text-muted-foreground">
              The private portal where the owner logs in, manages payment methods,
              updates phone numbers, and reviews vehicle protection statuses.
            </p>

            <div className="mt-6 border-t border-border pt-4 font-mono text-[8px] uppercase tracking-wider text-muted-foreground dark:border-white/[0.06]">
              Never accessible from a scan
            </div>
          </div>

          {/* Entity B: Identity */}
          <div className="rounded-2xl border border-[#cc785c]/30 bg-[#cc785c]/[0.03] p-8 dark:border-[#cc785c]/40 dark:bg-[#cc785c]/[0.05]">
            <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-[#cc785c]">
              <VaahanIcon name="qr" size={13} aria-hidden="true" />
              <span>02 / The Identity</span>
            </div>

            <div className="mt-4 font-serif text-2xl text-[#cc785c]">
              The Core Bond
            </div>

            <p className="mt-3 text-xs leading-relaxed text-muted-foreground dark:text-zinc-400">
              The authenticated record (VS-7F3K-9021) that links the physical machine
              to its assigned decals and configured safety rules.
            </p>

            <div className="mt-6 border-t border-[#cc785c]/20 pt-4 font-mono text-[8px] uppercase tracking-wider text-[#cc785c]">
              Persistent digital entity
            </div>
          </div>

          {/* Entity C: Safety View */}
          <div className="rounded-2xl border border-[#5db8a6]/30 bg-[#5db8a6]/[0.03] p-8 dark:border-[#5db8a6]/40 dark:bg-[#5db8a6]/[0.05]">
            <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-[#5db8a6]">
              <VaahanIcon name="shield" size={13} aria-hidden="true" />
              <span>03 / Safety View</span>
            </div>

            <div className="mt-4 font-serif text-2xl text-[#5db8a6]">
              The Roadside Projection
            </div>

            <p className="mt-3 text-xs leading-relaxed text-muted-foreground dark:text-zinc-400">
              The selected snapshot of context and contact buttons presented to a
              finder when they scan the physical QR decal on the car or bike.
            </p>

            <div className="mt-6 border-t border-[#5db8a6]/20 pt-4 font-mono text-[8px] uppercase tracking-wider text-[#5db8a6]">
              Ephemeral public view
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-border bg-background p-4 text-center font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground dark:border-white/[0.06] dark:bg-zinc-950 dark:text-muted-foreground">
          ACCOUNT &ne; VEHICLE IDENTITY &ne; PUBLIC SAFETY VIEW
        </div>
      </div>
    </section>
  );
}
