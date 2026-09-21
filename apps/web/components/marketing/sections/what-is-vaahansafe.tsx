import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { Badge } from "@vaahansafe/ui/components";

export function WhatIsVaahanSafe() {
  return (
    <section id="product" className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Header */}
        <div className="max-w-3xl space-y-4">
          <Badge variant="outline" className="font-mono text-xs uppercase tracking-wider font-semibold">
            01 &bull; System Architecture
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground">
            What is VaahanSafe?
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            VaahanSafe separates your private account from your public vehicle identity. We turn
            any vehicle into an active safety node that protects drivers, alerts family during emergencies,
            and allows direct bystander relays—without ever revealing your home address or private phone number.
          </p>
        </div>

        {/* 3-Tier Architecture Visualization */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
          {/* Node 1: Physical Vehicle Hardware */}
          <div className="relative rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-4 shadow-xs">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <VaahanIcon name="car" size={24} className="text-primary" />
            </div>
            <div className="space-y-2">
              <span className="font-mono text-xs font-semibold text-primary uppercase tracking-wider">
                Layer 01 &bull; Asset
              </span>
              <h3 className="text-xl font-semibold text-foreground">Physical Vehicle</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your car, motorcycle, or commercial fleet. Identified by registration number, make,
                model, and color, stored securely in your private account.
              </p>
            </div>
            <div className="pt-4 border-t border-border/80 flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
              Private & encrypted in D1
            </div>
          </div>

          {/* Node 2: Permanent QR Identity */}
          <div className="relative rounded-2xl border-2 border-primary/40 bg-card p-6 sm:p-8 space-y-4 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <VaahanIcon name="qr" size={24} />
            </div>
            <div className="space-y-2">
              <span className="font-mono text-xs font-semibold text-[#22D3A7] uppercase tracking-wider">
                Layer 02 &bull; Bridge
              </span>
              <h3 className="text-xl font-semibold text-foreground">Permanent QR Identity</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                A globally unique locator (e.g. <code className="font-mono text-foreground font-semibold">VS-7F3K-9021</code>).
                Weather-resistant, UV-bonded, and permanently assigned to your vehicle.
              </p>
            </div>
            <div className="pt-4 border-t border-border/80 flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-[#22D3A7]" />
              Single permanent identifier
            </div>
          </div>

          {/* Node 3: Controlled Emergency Profile */}
          <div className="relative rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-4 shadow-xs">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <VaahanIcon name="emergency" size={24} className="text-primary" />
            </div>
            <div className="space-y-2">
              <span className="font-mono text-xs font-semibold text-primary uppercase tracking-wider">
                Layer 03 &bull; Projection
              </span>
              <h3 className="text-xl font-semibold text-foreground">Controlled Safety Profile</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The public emergency view resolved when scanned. Projects only owner-approved contacts,
                safe medical tags (e.g. blood group), and instant masked call actions.
              </p>
            </div>
            <div className="pt-4 border-t border-border/80 flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
              Owner-governed public view
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
