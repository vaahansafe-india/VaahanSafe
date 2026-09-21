import { VaahanIcon } from "@vaahansafe/icons";
import { Badge } from "@vaahansafe/ui/components";

export function EmergencyScanExperience() {
  return (
    <section className="py-20 md:py-28 border-t border-border/40 bg-muted/20 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16 md:mb-20">
          <Badge
            variant="outline"
            className="mb-4 text-xs font-mono tracking-wider uppercase border-primary/20 text-primary bg-primary/5"
          >
            Zero-Friction Bystander Flow
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            What a Finder Sees During an Emergency
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            In an accident or urgent parking blockage, every second counts.
            The VaahanSafe emergency view loads instantly on any mobile browser—without logins,
            app installs, or marketing popups.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left: Product Rules & Design Invariants */}
          <div className="lg:col-span-6 space-y-6">
            <div className="border border-border bg-card rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <VaahanIcon name="shield" size={18} className="text-primary" />
                Principles of the Finder Experience
              </h3>
              <ul className="mt-4 space-y-3.5 text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#22D3A7]/20 text-primary flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                    ✓
                  </span>
                  <span>
                    <strong className="text-foreground font-semibold">Zero App Download or Login:</strong>
                    Works via native camera scan on iOS, Android, and KaiOS web browsers.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#22D3A7]/20 text-primary flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                    ✓
                  </span>
                  <span>
                    <strong className="text-foreground font-semibold">Critical Vehicle Data:</strong>
                    Displays EV/Diesel/Petrol badge, which informs first responders of electrical or fire hazards.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#22D3A7]/20 text-primary flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                    ✓
                  </span>
                  <span>
                    <strong className="text-foreground font-semibold">Privacy Masked Calling:</strong>
                    Finder calls are connected via secure cloud relays or pre-approved emergency contacts without revealing owner mobile numbers.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#22D3A7]/20 text-primary flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                    ✓
                  </span>
                  <span>
                    <strong className="text-foreground font-semibold">No Commercial Obstruction:</strong>
                    Zero upsells, zero cookie barriers, zero marketing banners. Only safety-critical actions.
                  </span>
                </li>
              </ul>
            </div>

            {/* Contrast Callout */}
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                <VaahanIcon name="activity" size={20} />
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-snug">
                Optimized for Indian network conditions (sub-500ms TTFB across 4G/3G cells) using Cloudflare Singapore & Mumbai edge nodes.
              </p>
            </div>
          </div>

          {/* Right: Mobile Viewport Rendering (Synthetic Finder Screen) */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-sm bg-background border-4 border-muted rounded-[36px] shadow-2xl p-4 sm:p-5 relative overflow-hidden">
              {/* Smartphone Top Notch / Speaker */}
              <div className="w-28 h-4 bg-muted rounded-full mx-auto mb-4" />

              {/* Finder App Simulation Header */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-primary">
                      <VaahanIcon name="shield" size={14} />
                    </div>
                    <span className="font-bold text-xs tracking-wider">
                      VAHAN<span className="text-[#22D3A7]">SAFE</span>
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono border-primary/20 text-primary">
                    EMERGENCY VIEW
                  </Badge>
                </div>

                {/* Emergency Vehicle Card */}
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-muted-foreground">
                        Identified Vehicle
                      </span>
                      <h4 className="font-bold text-sm text-foreground">
                        Tata Safari (Dark Edition)
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-foreground text-background font-mono text-xs font-bold">
                      DL 01 •••• 9021
                    </span>
                  </div>
                  <div className="mt-2.5 flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
                    <span className="px-1.5 py-0.5 bg-background rounded border border-border">Diesel</span>
                    <span className="px-1.5 py-0.5 bg-background rounded border border-border">Oberon Black</span>
                    <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded border border-emerald-500/20 font-semibold">Active Tag</span>
                  </div>
                </div>

                {/* Action Buttons: 2 Direct Taps */}
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    className="w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:bg-primary/90 transition-all"
                  >
                    <VaahanIcon name="phone" size={16} />
                    <span>Call Emergency Contact (Spouse)</span>
                  </button>

                  <button
                    type="button"
                    className="w-full py-2.5 px-4 rounded-xl bg-card border border-border text-foreground font-medium text-xs flex items-center justify-center gap-2 hover:bg-muted transition-colors"
                  >
                    <VaahanIcon name="notification" size={14} className="text-muted-foreground" />
                    <span>Notify Owner (Parking / Obstruction)</span>
                  </button>
                </div>

                {/* Emergency Medical Note */}
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-semibold text-xs mb-1">
                    <VaahanIcon name="info" size={14} />
                    <span>Blood Group: O+ (Opt-in Shared)</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    Penicillin safe. In an emergency, please notify Apollo or nearest triage center.
                  </p>
                </div>

                {/* Footer Assurance */}
                <div className="text-center pt-2 pb-1 border-t border-border/60">
                  <span className="text-[10px] text-muted-foreground font-mono">
                    Protected by VaahanSafe Cloud Relay • Zero Logins
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
