"use client";

import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

export function QrPlacementGuide() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs">
      <div className="flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.2em] text-[#cc785c]">
        <VaahanIcon name="shield" size={13} aria-hidden="true" />
        <span>BEST PRACTICES</span>
      </div>

      <h3 className="mt-1 font-serif text-xl font-medium text-foreground">
        Place It Right.
      </h3>

      <p className="mt-1 text-xs text-muted-foreground">
        Optimal physical sticker placement ensures fast, reliable scanning by first responders and passersby without obstructing driver visibility.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Four-Wheelers */}
        <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5">
          <div className="flex items-center gap-2">
            <VaahanIcon name="car" size={16} className="text-[#cc785c]" />
            <span className="font-mono text-xs font-bold text-foreground">
              Cars & SUVs
            </span>
          </div>
          <p className="mt-2 text-[11.5px] text-muted-foreground leading-relaxed">
            Mount on the <strong>lower passenger-side corner of the front windshield</strong> or lower-left corner from outside. Clean the glass surface thoroughly before peeling.
          </p>
        </div>

        {/* Two-Wheelers */}
        <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5">
          <div className="flex items-center gap-2">
            <VaahanIcon name="bike" size={16} className="text-[#cc785c]" />
            <span className="font-mono text-xs font-bold text-foreground">
              Bikes & Scooters
            </span>
          </div>
          <p className="mt-2 text-[11.5px] text-muted-foreground leading-relaxed">
            Mount on the <strong>front visor, front mudguard, or fork leg</strong>. Ensure the surface is free of oil, dust, and wax for the UV adhesive to cure permanently.
          </p>
        </div>
      </div>
    </div>
  );
}

export function QrHelpSurface() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs">
      <div className="flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.2em] text-[#cc785c]">
        <VaahanIcon name="phone" size={13} aria-hidden="true" />
        <span>SUPPORT & SAFETY</span>
      </div>

      <h3 className="mt-1 font-serif text-xl font-medium text-foreground">
        Need Help?
      </h3>

      <div className="mt-4 space-y-3 text-xs text-muted-foreground">
        <div className="flex items-start gap-2.5">
          <span className="font-mono font-bold text-foreground">Q:</span>
          <span>
            <strong>Where do I find my retail activation code?</strong> It is beneath the scratch-off silver panel on the back of your retail pack card.
          </span>
        </div>
        <div className="flex items-start gap-2.5">
          <span className="font-mono font-bold text-foreground">Q:</span>
          <span>
            <strong>What if my sticker is damaged or peeling?</strong> You can request a replacement via <a href="/qr/replace" className="text-[#cc785c] underline font-medium">Replace QR</a> without losing your emergency contacts or profile.
          </span>
        </div>
        <div className="flex items-start gap-2.5">
          <span className="font-mono font-bold text-foreground">Q:</span>
          <span>
            <strong>Is my personal phone exposed when someone scans?</strong> No. VaahanSafe uses a private telecommunication relay to protect your phone number.
          </span>
        </div>
      </div>
    </div>
  );
}
