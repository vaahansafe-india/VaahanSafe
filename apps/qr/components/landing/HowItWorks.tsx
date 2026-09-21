import React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

export function HowItWorks() {
  const steps = [
    {
      num: "01",
      tag: "ATTACH",
      title: "Vehicle Association",
      desc: "A genuine VaahanSafe physical QR identity is securely paired with a verified vehicle through our retail activation gate.",
      meta: "Physical Binding",
    },
    {
      num: "02",
      tag: "SCAN",
      title: "Universal Camera Scan",
      desc: "Anyone with a smartphone camera can scan the physical sticker. No special app, login, or registration is required to view.",
      meta: "Zero App Download",
    },
    {
      num: "03",
      tag: "RESOLVE",
      title: "Authoritative Edge Verification",
      desc: "VaahanSafe's Cloudflare runtime resolves the opaque ID, validates lifecycle state, and enforces active service entitlement.",
      meta: "Cloudflare D1 & Rules",
    },
    {
      num: "04",
      tag: "CONNECT",
      title: "Controlled Safety Relay",
      desc: "When active, the finder accesses only owner-whitelisted emergency information, safety notes, and direct contact call triggers.",
      meta: "Protected Projection",
    },
  ];

  return (
    <section id="how-it-works" className="w-full py-16 sm:py-24 border-b border-border/80 bg-card/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-primary font-semibold">
            <span>01</span>
            <span>&bull;</span>
            <span>Resolution Architecture</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-foreground leading-[1.15]">
            From a physical vehicle <br />
            to a <span className="italic text-primary font-medium">useful connection.</span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Every step in the VaahanSafe QR journey is designed for roadside speed, absolute privacy, and total reliability.
          </p>
        </div>

        {/* Desktop Milestone Visual Sequence */}
        <div className="hidden lg:grid grid-cols-4 gap-6 relative">
          {/* Horizontal Connecting Guideline */}
          <div className="absolute top-5 left-8 right-8 h-px bg-border/80 z-0" />

          {steps.map((s) => (
            <div key={s.num} className="relative z-10 space-y-4 pt-1">
              <div className="flex items-center gap-3">
                <span className="size-8 rounded-full bg-background border-2 border-primary text-primary font-mono text-xs font-bold flex items-center justify-center shadow-xs">
                  {s.num}
                </span>
                <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground font-semibold">
                  {s.tag}
                </span>
              </div>

              <div className="p-5 rounded-2xl border border-border/80 bg-background space-y-2 h-[calc(100%-48px)] flex flex-col justify-between">
                <div className="space-y-2">
                  <h3 className="font-serif text-lg font-medium text-foreground tracking-tight">
                    {s.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {s.desc}
                  </p>
                </div>
                <div className="pt-3 border-t border-border/60">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                    {s.meta}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile & Tablet Vertical Timeline (<1024px) */}
        <div className="lg:hidden space-y-6 relative pl-6 border-l-2 border-primary/30">
          {steps.map((s) => (
            <div key={s.num} className="relative space-y-2">
              {/* Timeline Indicator Dot */}
              <span className="absolute -left-[31px] top-1 size-4 rounded-full bg-background border-2 border-primary" />

              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-primary">{s.num}</span>
                <span className="text-muted-foreground text-xs">&bull;</span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                  {s.tag}
                </span>
              </div>

              <div className="p-4 rounded-xl border border-border/80 bg-background space-y-1.5 shadow-xs">
                <h3 className="font-serif text-base font-medium text-foreground tracking-tight">
                  {s.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {s.desc}
                </p>
                <div className="pt-2 border-t border-border/60">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                    {s.meta}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
