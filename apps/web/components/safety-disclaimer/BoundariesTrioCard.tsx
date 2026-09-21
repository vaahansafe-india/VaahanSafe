import * as React from "react";

export function BoundariesTrioCard() {
  return (
    <div className="my-8 overflow-hidden rounded-xl border border-border bg-muted p-6 sm:p-8 dark:border-white/[0.08] dark:bg-zinc-900">
      <div className="flex items-center gap-2 font-mono text-[7px] uppercase tracking-[0.2em] text-[#cc785c]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
        <span>Structural Boundaries</span>
      </div>

      <h3 className="mt-3 font-serif text-xl font-normal text-foreground sm:text-2xl dark:text-zinc-50">
        Three definitive boundaries of the platform.
      </h3>

      <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm sm:leading-7 dark:text-zinc-400">
        To ensure transparency and prevent medical or legal misunderstandings, VaahanSafe maintains three strict category distinctions:
      </p>

      {/* 3 Boundary Boxes */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-background p-4 dark:border-white/[0.06] dark:bg-zinc-950">
          <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.14em] text-[#cc785c]">
            Boundary 01
          </span>
          <p className="mt-1 font-mono text-xs font-semibold text-foreground dark:text-zinc-50">
            Safety Information ≠ Medical Record
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground dark:text-zinc-400">
            User-entered blood group and medical notes are informational indicators only. They do not constitute verified clinical electronic health records.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-background p-4 dark:border-white/[0.06] dark:bg-zinc-950">
          <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.14em] text-[#cc785c]">
            Boundary 02
          </span>
          <p className="mt-1 font-mono text-xs font-semibold text-foreground dark:text-zinc-50">
            VaahanSafe ID ≠ Government Identity
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground dark:text-zinc-400">
            The safety QR decal is an independent safety identification service. It does not replace HSRP number plates, RTO registration certificates, or driving licenses.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-background p-4 dark:border-white/[0.06] dark:bg-zinc-950">
          <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.14em] text-[#cc785c]">
            Boundary 03
          </span>
          <p className="mt-1 font-mono text-xs font-semibold text-foreground dark:text-zinc-50">
            Contact Option ≠ Emergency Dispatch
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground dark:text-zinc-400">
            Tapping an emergency contact dials a civilian phone number over telecom networks. It does not dispatch emergency response units, ambulances, or police.
          </p>
        </div>
      </div>
    </div>
  );
}
