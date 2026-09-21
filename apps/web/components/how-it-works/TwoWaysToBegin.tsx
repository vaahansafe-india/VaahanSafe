import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

export function TwoWaysToBegin() {
  return (
    <section
      aria-labelledby="acquisition-heading"
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
            07 / Getting Started
          </span>

          <h2
            id="acquisition-heading"
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
            Two ways to begin.
            <br />
            One QR infrastructure.
          </h2>

          <p className="mt-5 text-sm leading-relaxed text-[#3f3f46] sm:text-base sm:leading-7 dark:text-zinc-400">
            Whether you order directly online or pick up a packaged kit from an
            authorized retail partner, the vehicle identity resolves through the
            identical reliable architecture.
          </p>
        </div>

        {/* Dual Channels Grid */}
        <div className="mt-14 grid gap-8 md:grid-cols-2">
          {/* Channel A: Online Direct */}
          <div className="rounded-2xl border border-border bg-muted p-8 dark:border-white/[0.08] dark:bg-zinc-900">
            <div className="flex items-center justify-between font-mono text-[8px] uppercase tracking-[0.18em] text-[#cc785c]">
              <span>Channel 01</span>
              <span>Online Direct</span>
            </div>

            <h3 className="mt-4 font-serif text-2xl font-normal text-foreground dark:text-zinc-50">
              Order Online
            </h3>

            <p className="mt-2 text-xs leading-relaxed text-muted-foreground dark:text-muted-foreground">
              Create an account, configure your vehicle, and receive your paired
              QR decal directly at your doorstep.
            </p>

            {/* Step rail */}
            <div className="mt-8 space-y-3 font-mono text-[10px]">
              <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-3 text-[#3f3f46] dark:border-white/[0.06] dark:bg-zinc-950 dark:text-zinc-400">
                <span className="text-[#cc785c]">01</span>
                <span>Create your VaahanSafe account</span>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-3 text-[#3f3f46] dark:border-white/[0.06] dark:bg-zinc-950 dark:text-zinc-400">
                <span className="text-[#cc785c]">02</span>
                <span>Enter vehicle details &amp; emergency contacts</span>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-3 text-[#3f3f46] dark:border-white/[0.06] dark:bg-zinc-950 dark:text-zinc-400">
                <span className="text-[#cc785c]">03</span>
                <span>Receive paired physical QR decal</span>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-3 text-[#3f3f46] dark:border-white/[0.06] dark:bg-zinc-950 dark:text-zinc-400">
                <span className="text-[#cc785c]">04</span>
                <span>Affix to vehicle windshield or bodywork</span>
              </div>
            </div>
          </div>

          {/* Channel B: Retail Pack */}
          <div className="rounded-2xl border border-border bg-muted p-8 dark:border-white/[0.08] dark:bg-zinc-900">
            <div className="flex items-center justify-between font-mono text-[8px] uppercase tracking-[0.18em] text-[#5db8a6]">
              <span>Channel 02</span>
              <span>Retail Pack</span>
            </div>

            <h3 className="mt-4 font-serif text-2xl font-normal text-foreground dark:text-zinc-50">
              Activate Retail Kit
            </h3>

            <p className="mt-2 text-xs leading-relaxed text-muted-foreground dark:text-muted-foreground">
              Purchased in-store from a dealer, accessory shop, or service center.
              Activate it instantly using the concealed scratch code.
            </p>

            {/* Step rail */}
            <div className="mt-8 space-y-3 font-mono text-[10px]">
              <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-3 text-[#3f3f46] dark:border-white/[0.06] dark:bg-zinc-950 dark:text-zinc-400">
                <span className="text-[#5db8a6]">01</span>
                <span>Obtain packaged retail sticker pack</span>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-3 text-[#3f3f46] dark:border-white/[0.06] dark:bg-zinc-950 dark:text-zinc-400">
                <span className="text-[#5db8a6]">02</span>
                <span>Scan QR &amp; reveal scratch activation secret</span>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-3 text-[#3f3f46] dark:border-white/[0.06] dark:bg-zinc-950 dark:text-zinc-400">
                <span className="text-[#5db8a6]">03</span>
                <span>Verify code &amp; bind to your vehicle profile</span>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-3 text-[#3f3f46] dark:border-white/[0.06] dark:bg-zinc-950 dark:text-zinc-400">
                <span className="text-[#5db8a6]">04</span>
                <span>Identity is immediately activated and live</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 rounded-xl border border-border bg-background p-4 text-center font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground dark:border-white/[0.06] dark:bg-zinc-950 dark:text-muted-foreground">
          TWO ACQUISITION CHANNELS &bull; ONE UNIFIED VEHICLE IDENTITY INFRASTRUCTURE
        </div>
      </div>
    </section>
  );
}
