"use client";

import React, { useState } from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { Badge } from "@vaahansafe/ui/components";

export function PublicViewDemo() {
  const [demoClicked, setDemoClicked] = useState(false);

  function handleDemoCall(e: React.MouseEvent) {
    e.preventDefault();
    setDemoClicked(true);
    setTimeout(() => setDemoClicked(false), 3000);
  }

  return (
    <section className="w-full py-16 sm:py-24 border-b border-border/80 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-primary font-semibold">
            <span>02</span>
            <span>&bull;</span>
            <span>Finder Experience</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-foreground leading-[1.15]">
            What someone sees <br />
            when they <span className="italic text-primary font-medium">scan the QR.</span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            The scanner views a dignified, minimal emergency card with zero login or app install.
            Only owner-approved fields are rendered.
          </p>
        </div>

        {/* Demo Composition: Side-by-Side Architectural Contrast */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Owner Privacy Rulebook (Desktop 5 cols) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="p-6 rounded-2xl border border-border/80 bg-card space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border/70">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
                  Owner-Controlled Boundary
                </span>
                <Badge variant="outline" className="font-mono text-[9px] uppercase tracking-wider">
                  Configured by Owner
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                The vehicle owner decides which emergency fields are projected publicly. All other account information is blocked server-side.
              </p>

              <div className="space-y-2.5 font-mono text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                  <span className="flex items-center gap-2">
                    <VaahanIcon name="check" size={14} className="text-emerald-600" />
                    <span>Emergency Contact Call Trigger</span>
                  </span>
                  <span className="text-[10px] uppercase font-bold">Enabled</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                  <span className="flex items-center gap-2">
                    <VaahanIcon name="check" size={14} className="text-emerald-600" />
                    <span>Blood Group Identification</span>
                  </span>
                  <span className="text-[10px] uppercase font-bold">Enabled</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                  <span className="flex items-center gap-2">
                    <VaahanIcon name="check" size={14} className="text-emerald-600" />
                    <span>Safety & Medical Notes</span>
                  </span>
                  <span className="text-[10px] uppercase font-bold">Enabled</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-destructive/5 border border-destructive/20 text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <VaahanIcon name="error" size={14} className="text-destructive/70" />
                    <span>Residential Address & Billing</span>
                  </span>
                  <span className="text-[10px] uppercase text-destructive font-bold">Blocked</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-destructive/5 border border-destructive/20 text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <VaahanIcon name="error" size={14} className="text-destructive/70" />
                    <span>Primary Account Email & Password</span>
                  </span>
                  <span className="text-[10px] uppercase text-destructive font-bold">Blocked</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Public View Mockup (Desktop 6-7 cols) */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-sm rounded-2xl border-2 border-border/90 bg-[#FAF9F5] p-5 shadow-lg space-y-4 select-none">
              {/* Card Top Pill */}
              <div className="flex items-center justify-between pb-2 border-b border-[#E6DFD8]">
                <div className="flex items-center gap-1.5">
                  <VaahanIcon name="shield" size={14} className="text-[#CC785C]" />
                  <span className="font-serif text-xs font-bold text-[#141413]">
                    VAAHANSAFE
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="font-mono text-[9px] uppercase tracking-wider text-emerald-700 border-emerald-600/30 bg-emerald-500/5"
                >
                  Active Pass
                </Badge>
              </div>

              {/* ID & Vehicle Info */}
              <div className="space-y-1">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#6C6A64] block">
                  Public Safety Identity
                </span>
                <span className="font-mono text-sm font-bold text-[#141413] block">
                  VS-7F3K-9021
                </span>
                <p className="font-serif text-base font-medium text-[#141413]">
                  Hyundai Creta &bull; Polar White
                </p>
              </div>

              {/* Projected Medical Fields */}
              <div className="p-3.5 rounded-xl bg-white border border-[#E6DFD8] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase text-[#6C6A64]">
                    Blood Group
                  </span>
                  <Badge variant="destructive" className="font-mono text-xs font-bold bg-red-600 px-2 py-0.5">
                    O+
                  </Badge>
                </div>
                <div className="pt-2 border-t border-[#E6DFD8]/60 space-y-1">
                  <span className="font-mono text-[9px] uppercase text-[#6C6A64]">
                    Owner Safety Notes
                  </span>
                  <p className="text-xs text-[#3D3D3A] leading-relaxed">
                    No known drug allergies. Penicillin safe.
                  </p>
                </div>
              </div>

              {/* Primary Contact Action Button */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-[#141413] font-semibold">Sunita K.</span>
                  <span className="font-mono text-[10px] text-[#6C6A64]">Spouse &bull; Priority 1</span>
                </div>

                <button
                  type="button"
                  onClick={handleDemoCall}
                  className="w-full h-12 rounded-xl bg-[#CC785C] text-white font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#A9583E] active:scale-[0.99] transition-all shadow-xs cursor-pointer"
                >
                  <VaahanIcon name="phone" size={16} />
                  <span>Call Primary Contact</span>
                </button>

                {demoClicked && (
                  <p className="text-[10px] font-mono text-[#CC785C] text-center animate-in fade-in">
                    Demonstration only. No phone call placed.
                  </p>
                )}
              </div>

              {/* Footer Notice */}
              <div className="pt-2 border-t border-[#E6DFD8] text-center">
                <span className="font-mono text-[9px] uppercase tracking-wider text-[#6C6A64]">
                  PUBLIC VIEW / DEMONSTRATION &bull; NON-FUNCTIONAL
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
