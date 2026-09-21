import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

export function RenewalAndExpiryPolicy() {
  return (
    <section
      aria-labelledby="renewal-policy-heading"
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
          <span>08 / Continuity & Terms</span>
        </div>

        <div className="mt-4 max-w-[760px]">
          <h2
            id="renewal-policy-heading"
            className="
              font-serif text-3xl font-normal tracking-[-0.03em]
              text-foreground sm:text-4xl
              dark:text-zinc-50
            "
          >
            Renewal, cancellation, and identity continuity.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base dark:text-zinc-400">
            We operate with strict transparency. Understanding what happens when a subscription period ends avoids unexpected roadside surprises.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-background p-6 dark:border-white/[0.08] dark:bg-zinc-950">
            <div className="font-mono text-[10px] uppercase tracking-wider text-[#cc785c]">
              Core Protection Stays
            </div>
            <h3 className="mt-2 font-serif text-xl text-foreground dark:text-zinc-50">
              Decal Remains Scannable
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground dark:text-zinc-400">
              If an optional premium subscription expires, your vehicle QR does not break. Baseline emergency identity resolution and configured primary contact capability remain intact.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-background p-6 dark:border-white/[0.08] dark:bg-zinc-950">
            <div className="font-mono text-[10px] uppercase tracking-wider text-[#cc785c]">
              Extended Features Pause
            </div>
            <h3 className="mt-2 font-serif text-xl text-foreground dark:text-zinc-50">
              Graceful Downgrade
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground dark:text-zinc-400">
              Cascading multi-contact escalation, automated instant SMS alerts, and deep historical telemetry temporarily pause until renewed, without wiping your saved settings.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-background p-6 dark:border-white/[0.08] dark:bg-zinc-950">
            <div className="font-mono text-[10px] uppercase tracking-wider text-[#cc785c]">
              Owner Control
            </div>
            <h3 className="mt-2 font-serif text-xl text-foreground dark:text-zinc-50">
              Manage Anytime
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground dark:text-zinc-400">
              Subscriptions can be modified, upgraded, or managed from your private customer dashboard without needing to re-apply or physically touch your vehicle decal.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
