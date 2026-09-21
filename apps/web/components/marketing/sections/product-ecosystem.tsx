import { VaahanIcon } from "@vaahansafe/icons";
import { Badge } from "@vaahansafe/ui/components";

export function ProductEcosystem() {
  return (
    <section className="py-20 md:py-28 border-t border-border/40 bg-background relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16 md:mb-20">
          <Badge
            variant="outline"
            className="mb-4 text-xs font-mono tracking-wider uppercase border-primary/20 text-primary bg-primary/5"
          >
            Unified Architecture
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            The VaahanSafe Ecosystem
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            More than just a barcode. An interconnected mesh connecting physical automotive
            identifiers, edge resolvers, family relays, and lifecycle management.
          </p>
        </div>

        {/* Connected System Architecture Diagram */}
        <div className="relative rounded-3xl border-2 border-border/80 bg-card/60 p-6 sm:p-10 shadow-xl backdrop-blur-sm">
          {/* Subtle grid background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none rounded-3xl" />

          {/* Core Central Node: Vehicle Safety Identity */}
          <div className="max-w-xl mx-auto text-center p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-primary/10 to-primary/5 border-2 border-primary/40 shadow-lg relative mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-mono font-semibold mb-3">
              <VaahanIcon name="shield" size={14} />
              CORE SYSTEM ANCHOR
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              Vehicle Safety Identity
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              The permanent edge registry record that unifies the vehicle, physical hardware, and emergency safety policies.
            </p>
            <div className="mt-4 flex items-center justify-center gap-3 font-mono text-xs text-primary">
              <span>VS-7F3K-9021</span>
              <span>•</span>
              <span>DL 01 •••• 9021</span>
              <span>•</span>
              <span>Cloudflare D1 Ledger</span>
            </div>
          </div>

          {/* 3 Radiating Systems Grid: Physical Layer, Safety Layer, Governance Layer */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Column 1: Hardware & Presence Layer */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <VaahanIcon name="qr" size={18} className="text-primary" />
                <h4 className="font-semibold text-sm uppercase tracking-wider text-foreground">
                  01. Presence Layer
                </h4>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-2 font-medium text-sm text-foreground">
                  <VaahanIcon name="shield" size={15} className="text-primary" />
                  Physical UV Sticker
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Weather-sealed windshield sticker with tamper-evident scratch code.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-2 font-medium text-sm text-foreground">
                  <VaahanIcon name="qr-scan" size={15} className="text-primary" />
                  Digital QR Pass
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Apple Wallet & Android pass for emergency backup and digital verification.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-2 font-medium text-sm text-foreground">
                  <VaahanIcon name="car" size={15} className="text-primary" />
                  Vehicle Registry
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Multi-vehicle garage management for cars, motorbikes, and commercial fleets.
                </p>
              </div>
            </div>

            {/* Column 2: Emergency & Triage Layer */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <VaahanIcon name="emergency" size={18} className="text-primary" />
                <h4 className="font-semibold text-sm uppercase tracking-wider text-foreground">
                  02. Safety & Relay Layer
                </h4>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-2 font-medium text-sm text-foreground">
                  <VaahanIcon name="phone" size={15} className="text-primary" />
                  Emergency Contact Relays
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Masked voice calls and SMS broadcast to designated family members.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-2 font-medium text-sm text-foreground">
                  <VaahanIcon name="info" size={15} className="text-primary" />
                  Triage Medical Profile
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Opt-in blood group, drug allergy alerts, and emergency hospital instructions.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-2 font-medium text-sm text-foreground">
                  <VaahanIcon name="activity" size={15} className="text-primary" />
                  Audit Scan History
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Real-time owner notifications whenever a bystander scans the vehicle tag.
                </p>
              </div>
            </div>

            {/* Column 3: Governance & Lifecycle Layer */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <VaahanIcon name="settings" size={18} className="text-primary" />
                <h4 className="font-semibold text-sm uppercase tracking-wider text-foreground">
                  03. Lifecycle Layer
                </h4>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-2 font-medium text-sm text-foreground">
                  <VaahanIcon name="dashboard" size={15} className="text-primary" />
                  Customer Application
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Dedicated web console (<code className="font-mono text-[10px]">app.vaahansafe.com</code>) for managing privacy rules.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-2 font-medium text-sm text-foreground">
                  <VaahanIcon name="credit-card" size={15} className="text-primary" />
                  Subscriptions & Plans
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Entitlement renewals, multi-year plans, and Cashfree-backed auto-invoicing.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-2 font-medium text-sm text-foreground">
                  <VaahanIcon name="refresh" size={15} className="text-primary" />
                  Tamper Replacement
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Zero-downtime key rotation if windshield is broken or sticker damaged.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
