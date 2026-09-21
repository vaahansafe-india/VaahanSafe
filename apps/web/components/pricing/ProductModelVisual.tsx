import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

export function ProductModelVisual() {
  return (
    <section
      aria-labelledby="product-model-heading"
      className="
        border-b border-border
        bg-background
        py-16 sm:py-20 lg:py-24
        dark:border-border
        dark:bg-zinc-950
      "
    >
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10">
        <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground dark:text-zinc-500">
          <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
          <span>02 / Product Model</span>
        </div>

        <div className="mt-4 max-w-[720px]">
          <h2
            id="product-model-heading"
            className="
              font-serif text-3xl font-normal tracking-[-0.03em]
              text-foreground sm:text-4xl lg:text-5xl
              dark:text-zinc-50
            "
          >
            The two halves of the system.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base dark:text-zinc-400">
            Every vehicle protection flow balances physical presence on the vehicle with cloud services configured behind it. One without the other is incomplete.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-stretch">
          {/* LEFT: 01 / VEHICLE IDENTITY */}
          <div
            className="
              flex flex-col justify-between
              rounded-2xl border border-border
              bg-muted/80 p-6 sm:p-8
              lg:col-span-5
              dark:border-white/[0.08] dark:bg-zinc-900
            "
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#cc785c]">
                  01 / Vehicle Identity
                </span>
                <span className="rounded bg-[#e4e4e7] px-2 py-0.5 font-mono text-[9px] text-muted-foreground dark:bg-white/[0.08] dark:text-zinc-400">
                  Physical Asset
                </span>
              </div>

              <h3 className="mt-4 font-serif text-2xl text-foreground dark:text-zinc-50">
                The Physical QR Decal
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm dark:text-zinc-400">
                Affixed securely to the vehicle windshield or quarter glass. Provides an immediate entry point that anyone can scan without installing an app.
              </p>

              {/* Synthetic Decal Representation */}
              <div className="mt-6 rounded-xl border border-border bg-white p-5 dark:border-white/[0.08] dark:bg-zinc-950">
                <div className="flex items-center justify-between border-b border-[#f0eae1] pb-3 dark:border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-[#cc785c] text-white">
                      <VaahanIcon name="qr-code" size={14} aria-hidden="true" />
                    </div>
                    <span className="font-mono text-[11px] font-semibold tracking-wider text-foreground dark:text-zinc-50">
                      VAAHANSAFE
                    </span>
                  </div>
                  <span className="font-mono text-[9px] text-muted-foreground">
                    DECAL HARDWARE
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-4">
                  {/* Visual QR Specimen */}
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-border bg-background p-2 dark:border-white/[0.1] dark:bg-zinc-900">
                    <div className="grid h-full w-full grid-cols-4 gap-1 p-1">
                      <div className="rounded-sm bg-[#09090b] dark:bg-background" />
                      <div className="rounded-sm bg-[#09090b] dark:bg-background" />
                      <div className="rounded-sm bg-[#cc785c]" />
                      <div className="rounded-sm bg-[#09090b] dark:bg-background" />
                      <div className="rounded-sm bg-[#09090b] dark:bg-background" />
                      <div className="rounded-sm bg-transparent" />
                      <div className="rounded-sm bg-[#09090b] dark:bg-background" />
                      <div className="rounded-sm bg-[#09090b] dark:bg-background" />
                      <div className="rounded-sm bg-[#cc785c]" />
                      <div className="rounded-sm bg-[#09090b] dark:bg-background" />
                      <div className="rounded-sm bg-[#09090b] dark:bg-background" />
                      <div className="rounded-sm bg-transparent" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                      Identity Code
                    </div>
                    <div className="font-mono text-sm font-semibold tracking-wider text-foreground dark:text-zinc-50">
                      VS-7F3K-9021
                    </div>
                    <div className="font-mono text-[9px] text-[#5db8a6]">
                      ● Status: Active & Attached
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-border pt-4 font-mono text-[10px] text-muted-foreground dark:border-white/[0.08] dark:text-zinc-400">
              Purpose: Connects the physical vehicle to its digital safety record.
            </div>
          </div>

          {/* MIDDLE: CONNECTOR */}
          <div className="flex items-center justify-center lg:col-span-2">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white font-mono text-xs font-semibold text-[#cc785c] shadow-sm dark:border-white/[0.1] dark:bg-zinc-900">
                +
              </div>
              <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground">
                Bound Together
              </span>
            </div>
          </div>

          {/* RIGHT: 02 / SERVICES */}
          <div
            className="
              flex flex-col justify-between
              rounded-2xl border border-border
              bg-muted/80 p-6 sm:p-8
              lg:col-span-5
              dark:border-white/[0.08] dark:bg-zinc-900
            "
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#cc785c]">
                  02 / Cloud Services
                </span>
                <span className="rounded bg-[#e4e4e7] px-2 py-0.5 font-mono text-[9px] text-muted-foreground dark:bg-white/[0.08] dark:text-zinc-400">
                  Software Layer
                </span>
              </div>

              <h3 className="mt-4 font-serif text-2xl text-foreground dark:text-zinc-50">
                The Safety & Protection Plan
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm dark:text-zinc-400">
                Defines what occurs when the QR is scanned, who receives instant notifications, how many emergency contacts are connected, and what support channels exist.
              </p>

              {/* Service Categories Grid */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border bg-white p-3.5 dark:border-white/[0.08] dark:bg-zinc-950">
                  <div className="font-mono text-[8px] uppercase tracking-wider text-[#cc785c]">
                    Privacy
                  </div>
                  <div className="mt-1 font-mono text-xs font-medium text-foreground dark:text-zinc-50">
                    Safety Profile Controls
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Control emergency & medical fields displayed.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-white p-3.5 dark:border-white/[0.08] dark:bg-zinc-950">
                  <div className="font-mono text-[8px] uppercase tracking-wider text-[#cc785c]">
                    Routing
                  </div>
                  <div className="mt-1 font-mono text-xs font-medium text-foreground dark:text-zinc-50">
                    Contact Relay
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Connect bystander to emergency contacts directly.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-white p-3.5 dark:border-white/[0.08] dark:bg-zinc-950">
                  <div className="font-mono text-[8px] uppercase tracking-wider text-[#cc785c]">
                    Telemetry
                  </div>
                  <div className="mt-1 font-mono text-xs font-medium text-foreground dark:text-zinc-50">
                    Scan Activity
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Incident notification & scan timeline alerts.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-white p-3.5 dark:border-white/[0.08] dark:bg-zinc-950">
                  <div className="font-mono text-[8px] uppercase tracking-wider text-[#cc785c]">
                    Care
                  </div>
                  <div className="mt-1 font-mono text-xs font-medium text-foreground dark:text-zinc-50">
                    QR Replacement
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Damage and windshield replacement workflows.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-border pt-4 font-mono text-[10px] text-muted-foreground dark:border-white/[0.08] dark:text-zinc-400">
              Purpose: Determines the applicable services and protective features around the identity.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
