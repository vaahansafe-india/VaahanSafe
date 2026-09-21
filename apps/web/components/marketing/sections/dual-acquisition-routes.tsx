import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { Badge } from "@vaahansafe/ui/components";

export function DualAcquisitionRoutes() {
  return (
    <section id="dual-routes" className="py-20 lg:py-28 bg-muted/20 border-y border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Header */}
        <div className="max-w-3xl space-y-4">
          <Badge variant="outline" className="font-mono text-xs uppercase tracking-wider font-semibold">
            02 &bull; Acquisition Model
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground">
            Two Acquisition Channels. <br />
            One Unbroken Infrastructure.
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Whether you purchase a pre-printed sticker package at a roadside automotive retailer or order
            directly online, every unit converges on the identical Cloudflare D1 identity and public safety resolver.
          </p>
        </div>

        {/* Dual Convergence Flowchart */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Channel A: Physical Retail (5 cols) */}
          <div className="lg:col-span-5 rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold text-primary uppercase tracking-wider">
                Route A &bull; Retail Distribution
              </span>
              <Badge variant="secondary" className="font-mono text-xs">Offline</Badge>
            </div>

            <h3 className="text-xl font-semibold text-foreground">Over-The-Counter Retail</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Factory-manufactured print lots shipped to automotive shops, service centers, and distributors.
            </p>

            {/* Stepper */}
            <ol className="space-y-4 text-xs font-mono text-muted-foreground border-l border-border pl-4">
              <li className="relative">
                <span className="absolute -left-[21px] top-0.5 h-2 w-2 rounded-full bg-primary" />
                <span className="text-foreground font-semibold">1. Purchase Package:</span> Buy sticker package at verified auto store.
              </li>
              <li className="relative">
                <span className="absolute -left-[21px] top-0.5 h-2 w-2 rounded-full bg-primary" />
                <span className="text-foreground font-semibold">2. Scratch Code:</span> Reveal silver scratch-off security secret.
              </li>
              <li className="relative">
                <span className="absolute -left-[21px] top-0.5 h-2 w-2 rounded-full bg-primary" />
                <span className="text-foreground font-semibold">3. Scan & Activate:</span> Authenticate on <span className="text-foreground">activate.vaahansafe.com</span>.
              </li>
              <li className="relative">
                <span className="absolute -left-[21px] top-0.5 h-2 w-2 rounded-full bg-primary" />
                <span className="text-foreground font-semibold">4. Link Vehicle:</span> Connect your vehicle & configure contacts.
              </li>
            </ol>
          </div>

          {/* Convergence Bridge (2 cols) */}
          <div className="lg:col-span-2 flex flex-col items-center justify-center gap-3 text-center py-4">
            <div className="hidden lg:flex flex-col items-center gap-2">
              <span className="h-12 w-0.5 bg-gradient-to-b from-border via-primary to-[#22D3A7]" />
              <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary flex items-center justify-center text-primary">
                <VaahanIcon name="arrow-right" size={18} />
              </div>
              <span className="h-12 w-0.5 bg-gradient-to-b from-[#22D3A7] via-primary to-border" />
            </div>
            <span className="font-mono text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              CONVERGES ON D1
            </span>
          </div>

          {/* Channel B: Online Physical / Digital (5 cols) */}
          <div className="lg:col-span-5 rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold text-primary uppercase tracking-wider">
                Route B &bull; Direct E-Commerce
              </span>
              <Badge variant="secondary" className="font-mono text-xs">Online</Badge>
            </div>

            <h3 className="text-xl font-semibold text-foreground">Direct Online Order</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Order through <span className="text-foreground">vaahansafe.com</span> or the customer application with doorstep parcel delivery.
            </p>

            {/* Stepper */}
            <ol className="space-y-4 text-xs font-mono text-muted-foreground border-l border-border pl-4">
              <li className="relative">
                <span className="absolute -left-[21px] top-0.5 h-2 w-2 rounded-full bg-[#22D3A7]" />
                <span className="text-foreground font-semibold">1. Account Onboarding:</span> Sign up with mobile OTP & add vehicle.
              </li>
              <li className="relative">
                <span className="absolute -left-[21px] top-0.5 h-2 w-2 rounded-full bg-[#22D3A7]" />
                <span className="text-foreground font-semibold">2. Order & Payment:</span> Checkout via secure Cashfree gateway.
              </li>
              <li className="relative">
                <span className="absolute -left-[21px] top-0.5 h-2 w-2 rounded-full bg-[#22D3A7]" />
                <span className="text-foreground font-semibold">3. Stock Reservation:</span> Pre-printed QR claimed race-safely from warehouse.
              </li>
              <li className="relative">
                <span className="absolute -left-[21px] top-0.5 h-2 w-2 rounded-full bg-[#22D3A7]" />
                <span className="text-foreground font-semibold">4. Doorstep Delivery:</span> Dispatched to your verified address.
              </li>
            </ol>
          </div>
        </div>

        {/* Convergence Unified Terminal Banner */}
        <div className="rounded-2xl border-2 border-primary/50 bg-primary/5 p-6 lg:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-[#22D3A7]" />
              <h4 className="text-lg font-semibold text-foreground">Single Authoritative Destination</h4>
            </div>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Both paths result in the exact same security guarantee: an active, authenticated
              record in <code className="font-mono text-foreground font-semibold">qr_stickers</code> linked to an active vehicle assignment.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Badge variant="signature" className="font-mono text-xs px-3 py-1 font-bold">
              ACTIVE VAHANSAFE IDENTITY
            </Badge>
          </div>
        </div>
      </div>
    </section>
  );
}
