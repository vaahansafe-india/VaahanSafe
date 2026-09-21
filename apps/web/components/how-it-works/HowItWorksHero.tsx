import * as React from "react";
import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";
import { getActivateUrl, getCustomerUrl } from "@vaahansafe/config";

interface JourneyNode {
  index: string;
  label: string;
  detail: string;
  active?: boolean;
}

const MASTER_JOURNEY_NODES: readonly JourneyNode[] = [
  { index: "01", label: "Vehicle", detail: "Physical asset" },
  { index: "02", label: "QR", detail: "Visible doorway" },
  { index: "03", label: "Identity", detail: "Permanent record", active: true },
  { index: "04", label: "Safety View", detail: "Selective projection" },
  { index: "05", label: "Connection", detail: "Roadside relay" },
];

export function HowItWorksHero() {
  const customerUrl = getCustomerUrl();
  const activateUrl = getActivateUrl();

  return (
    <section
      aria-labelledby="how-it-works-hero-heading"
      className="
        relative isolate overflow-hidden
        border-b border-border
        bg-background
        pt-12 pb-16
        sm:pt-16 sm:pb-20
        lg:pt-20 lg:pb-24
        dark:border-border
        dark:bg-zinc-950
      "
    >
      {/* Registration background geometry */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <span
          className="
            absolute -left-[240px] -top-[240px]
            h-[580px] w-[580px]
            rounded-full
            border border-[#09090b]/[0.03]
            dark:border-white/[0.025]
          "
        />
        <span
          className="
            absolute right-[8%] top-[20%]
            hidden h-1.5 w-1.5
            rounded-full bg-[#cc785c]/40
            lg:block
          "
        />
        <span
          className="
            absolute left-[6%] bottom-[15%]
            hidden h-1 w-1
            rounded-full bg-[#5db8a6]/40
            lg:block
          "
        />
      </div>

      <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10">
        {/* Eyebrow & technical index rail */}
        <div className="flex flex-wrap items-center gap-3 font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground dark:text-zinc-500">
          <span className="flex items-center gap-1.5 text-[#cc785c]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
            PRODUCT / HOW IT WORKS
          </span>
          <span className="h-3 w-px bg-[#e4e4e7] dark:bg-white/[0.1]" />
          <span>JOURNEY ARCHITECTURE</span>
        </div>

        {/* Display Headline */}
        <div className="mt-8 max-w-[880px]">
          <h1
            id="how-it-works-hero-heading"
            className="
              font-serif
              text-[2.75rem]
              font-normal
              leading-[1.02]
              tracking-[-0.04em]
              text-foreground
              sm:text-5xl
              md:text-6xl
              lg:text-[4.6rem]
              dark:text-zinc-50
            "
          >
            From your vehicle{" "}
            <br className="hidden sm:block" />
            to a{" "}
            <span className="text-[#cc785c]">
              useful connection.
            </span>
          </h1>

          <p className="mt-6 max-w-[660px] text-sm leading-relaxed text-[#3f3f46] sm:text-base sm:leading-8 dark:text-zinc-400">
            VaahanSafe connects a physical QR on your vehicle to a digital
            safety identity and the information you choose to make available
            when it is scanned.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href={`${customerUrl}/order`}
              className="
                inline-flex h-11 items-center justify-center gap-2
                rounded-md bg-[#cc785c] px-6
                font-mono text-[11px] font-medium uppercase tracking-[0.14em]
                text-white transition-colors
                hover:bg-[#a9583e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cc785c]
              "
            >
              <span>Get VaahanSafe</span>
              <VaahanIcon name="arrow-right" size={12} aria-hidden="true" />
            </a>

            <a
              href={activateUrl}
              className="
                inline-flex h-11 items-center justify-center gap-2
                rounded-md border border-border bg-background px-5
                font-mono text-[11px] font-medium uppercase tracking-[0.14em]
                text-[#18181b] transition-colors
                hover:border-[#cc785c]/40 hover:bg-muted hover:text-[#cc785c]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cc785c]
                dark:border-white/[0.1] dark:bg-zinc-900 dark:text-[#ece8e1]
                dark:hover:border-[#cc785c]/40 dark:hover:bg-zinc-800
              "
            >
              <span>Activate Retail QR</span>
              <VaahanIcon name="arrow-right" size={12} aria-hidden="true" />
            </a>
          </div>
        </div>

        {/* Master Relationship Rail: VEHICLE → QR → IDENTITY → SAFETY VIEW → CONNECTION */}
        <div className="mt-14 border-t border-border pt-8 dark:border-white/[0.08] lg:mt-18">
          <div className="flex items-center justify-between pb-4 font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground dark:text-zinc-500">
            <span>Master System Sequence</span>
            <span className="text-[#cc785c]">01 to 05</span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-5 lg:gap-4">
            {MASTER_JOURNEY_NODES.map((node, i) => (
              <div
                key={node.index}
                className={`
                  relative rounded-xl border p-4 transition-all
                  ${
                    node.active
                      ? "border-[#cc785c]/30 bg-[#cc785c]/[0.05] dark:border-[#cc785c]/40 dark:bg-[#cc785c]/[0.08]"
                      : "border-border bg-muted/60 dark:border-white/[0.06] dark:bg-zinc-900"
                  }
                `}
              >
                <div className="flex items-center justify-between font-mono text-[8px] text-muted-foreground">
                  <span className={node.active ? "text-[#cc785c]" : ""}>
                    {node.index}
                  </span>
                  {i < MASTER_JOURNEY_NODES.length - 1 && (
                    <span className="hidden text-[#b0aaa2] sm:block">→</span>
                  )}
                </div>

                <div className="mt-2 font-serif text-lg font-medium text-foreground dark:text-zinc-50">
                  {node.label}
                </div>

                <div className="mt-1 font-mono text-[8px] uppercase tracking-[0.14em] text-muted-foreground dark:text-muted-foreground">
                  {node.detail}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
