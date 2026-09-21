import { VaahanIcon } from "@vaahansafe/icons";
import { Badge } from "@vaahansafe/ui/components";

export function PhysicalDigitalComparison() {
  return (
    <section className="py-20 md:py-28 border-t border-border/40 bg-muted/20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16 md:mb-20">
          <Badge
            variant="outline"
            className="mb-4 text-xs font-mono tracking-wider uppercase border-primary/20 text-primary bg-primary/5"
          >
            Dual Presentation Models
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Physical Hardware + Digital Pass
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Not two competing products. Two manifestations of the exact same VaahanSafe identity
            ledger—engineered for maximum physical durability and digital convenience.
          </p>
        </div>

        {/* 2-Column Comparative Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Physical Sticker Card */}
          <div className="p-8 rounded-2xl border-2 border-border/80 bg-card flex flex-col justify-between shadow-sm hover:border-primary/40 transition-colors">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <VaahanIcon name="shield" size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground">
                      Physical Automotive Sticker
                    </h3>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      Permanent Windshield Hardware
                    </span>
                  </div>
                </div>
                <Badge variant="outline" className="font-mono text-[10px] uppercase border-primary/30 text-primary">
                  PRIMARY HARDWARE
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Engineered for permanent roadside visibility. Always scannable by anyone outside
                the vehicle, even when the vehicle is locked, unattended, or battery is drained.
              </p>

              <ul className="space-y-3.5 text-xs sm:text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#22D3A7]/20 text-primary flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                    ✓
                  </span>
                  <span>
                    <strong className="text-foreground">Weather-Shielded:</strong> Polycarbonate construction resists 70°C summer dashboard heat and torrential monsoons.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#22D3A7]/20 text-primary flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                    ✓
                  </span>
                  <span>
                    <strong className="text-foreground">Tamper-Proof Scratch Layer:</strong> Ensures zero pre-activation cloning or store shelf skimming.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#22D3A7]/20 text-primary flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                    ✓
                  </span>
                  <span>
                    <strong className="text-foreground">Zero Battery Requirement:</strong> Passive high-contrast optical reflectivity requires no vehicle power.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#22D3A7]/20 text-primary flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                    ✓
                  </span>
                  <span>
                    <strong className="text-foreground">Flexible Placement:</strong> Front windshield, rear glass, motorcycle tank, or helmet shell.
                  </span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground font-mono">
              <span>Acquisition: Retail or Online</span>
              <span className="text-primary font-semibold">Available Nationwide</span>
            </div>
          </div>

          {/* Digital QR Pass Card */}
          <div className="p-8 rounded-2xl border-2 border-border/80 bg-card flex flex-col justify-between shadow-sm hover:border-[#22D3A7]/40 transition-colors">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-[#22D3A7]/10 flex items-center justify-center text-primary">
                    <VaahanIcon name="qr-scan" size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground">
                      Digital QR Identity Pass
                    </h3>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      Connected Mobile Wallet
                    </span>
                  </div>
                </div>
                <Badge variant="outline" className="font-mono text-[10px] uppercase border-[#22D3A7]/40 text-[#16A36A] dark:text-[#22D3A7]">
                  SMARTPHONE PASS
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Instant digital presentation of your vehicle safety identity. Stored in your smartphone
                wallet for rapid verification, temporary vehicle loans, or backup triage.
              </p>

              <ul className="space-y-3.5 text-xs sm:text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#22D3A7]/20 text-primary flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                    ✓
                  </span>
                  <span>
                    <strong className="text-foreground">Instant Issue:</strong> Generated in real time immediately after online onboarding or retail activation.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#22D3A7]/20 text-primary flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                    ✓
                  </span>
                  <span>
                    <strong className="text-foreground">Sync with Physical:</strong> Any changes to emergency contacts in the customer app sync simultaneously.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#22D3A7]/20 text-primary flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                    ✓
                  </span>
                  <span>
                    <strong className="text-foreground">Mobile Wallet Compatible:</strong> Ready for Apple Wallet and Google Wallet on supported plans.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#22D3A7]/20 text-primary flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                    ✓
                  </span>
                  <span>
                    <strong className="text-foreground">Emergency Sharing:</strong> Conveniently text or AirDrop your vehicle identity to a friend borrowing your car.
                  </span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground font-mono">
              <span>Delivery: Instant in App</span>
              <span className="text-[#16A36A] dark:text-[#22D3A7] font-semibold">Included with Account</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
