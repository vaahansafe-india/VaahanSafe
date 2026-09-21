import { VaahanIcon } from "@vaahansafe/icons";
import { Badge } from "@vaahansafe/ui/components";

export function PhysicalStickerAnatomy() {
  return (
    <section className="py-20 md:py-28 border-t border-border/40 bg-muted/20 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16 md:mb-20">
          <Badge
            variant="outline"
            className="mb-4 text-xs font-mono tracking-wider uppercase border-primary/20 text-primary bg-primary/5"
          >
            Engineered Automotive Hardware
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Anatomy of a VaahanSafe Sticker
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Not a fragile paper printout. Every VaahanSafe physical unit is an
            industrial-grade, weather-sealed automotive identifier built with dual-layer
            security separation.
          </p>
        </div>

        {/* Sticker Anatomy Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left: Interactive Sticker Mockup */}
          <div className="lg:col-span-7 flex justify-center">
            <div className="relative w-full max-w-md bg-card rounded-2xl border-2 border-border/80 shadow-2xl p-6 md:p-8 overflow-hidden backdrop-blur-sm">
              {/* Automotive spec badge */}
              <div className="flex items-center justify-between border-b border-border/60 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#22D3A7] animate-pulse" />
                  <span className="text-xs font-mono font-semibold tracking-wider text-foreground">
                    VAHANSAFE AUTOMOTIVE SPEC
                  </span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground uppercase">
                  Class 1 Weather-Resistant
                </span>
              </div>

              {/* Central Sticker Rendering */}
              <div className="relative bg-black text-white rounded-xl p-6 shadow-inner border border-white/10 flex flex-col gap-6">
                {/* Brand Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#22D3A7]/20 border border-[#22D3A7]/50 flex items-center justify-center">
                      <VaahanIcon name="shield" size={16} className="text-[#22D3A7]" />
                    </div>
                    <span className="font-bold text-sm tracking-wider uppercase">
                      VAHAN<span className="text-[#22D3A7]">SAFE</span>
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                    AUTOMOTIVE IDENTITY
                  </span>
                </div>

                {/* QR & Visible Code Row */}
                <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-lg bg-zinc-900/90 border border-zinc-800">
                  {/* High-Contrast Permanent QR Frame */}
                  <div className="relative w-28 h-28 shrink-0 bg-white p-2 rounded-lg shadow-md flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      {/* Corner locator squares */}
                      <rect x="5" y="5" width="28" height="28" fill="#0D4844" rx="3" />
                      <rect x="11" y="11" width="16" height="16" fill="white" />
                      <rect x="15" y="15" width="8" height="8" fill="#0D4844" />

                      <rect x="67" y="5" width="28" height="28" fill="#0D4844" rx="3" />
                      <rect x="73" y="11" width="16" height="16" fill="white" />
                      <rect x="77" y="15" width="8" height="8" fill="#0D4844" />

                      <rect x="5" y="67" width="28" height="28" fill="#0D4844" rx="3" />
                      <rect x="11" y="73" width="16" height="16" fill="white" />
                      <rect x="15" y="77" width="8" height="8" fill="#0D4844" />

                      {/* Mock QR data bits */}
                      <rect x="38" y="8" width="6" height="6" fill="#0D4844" />
                      <rect x="48" y="14" width="6" height="6" fill="#0D4844" />
                      <rect x="58" y="8" width="6" height="6" fill="#0D4844" />
                      <rect x="38" y="24" width="6" height="6" fill="#0D4844" />
                      <rect x="48" y="24" width="6" height="6" fill="#0D4844" />
                      <rect x="8" y="38" width="6" height="6" fill="#0D4844" />
                      <rect x="20" y="44" width="6" height="6" fill="#0D4844" />
                      <rect x="38" y="38" width="8" height="8" fill="#0D4844" />
                      <rect x="52" y="38" width="6" height="6" fill="#0D4844" />
                      <rect x="64" y="44" width="6" height="6" fill="#0D4844" />
                      <rect x="78" y="38" width="6" height="6" fill="#0D4844" />
                      <rect x="88" y="44" width="6" height="6" fill="#0D4844" />
                      <rect x="38" y="54" width="6" height="6" fill="#0D4844" />
                      <rect x="50" y="60" width="6" height="6" fill="#0D4844" />
                      <rect x="64" y="54" width="6" height="6" fill="#0D4844" />
                      <rect x="78" y="60" width="6" height="6" fill="#0D4844" />
                      <rect x="38" y="74" width="6" height="6" fill="#0D4844" />
                      <rect x="52" y="74" width="6" height="6" fill="#0D4844" />
                      <rect x="66" y="74" width="6" height="6" fill="#0D4844" />
                      <rect x="46" y="86" width="6" height="6" fill="#0D4844" />
                      <rect x="60" y="86" width="6" height="6" fill="#0D4844" />
                      <rect x="80" y="86" width="6" height="6" fill="#0D4844" />
                    </svg>
                  </div>

                  {/* Public ID & Guidance */}
                  <div className="flex-1 text-center sm:text-left space-y-1.5">
                    <span className="text-[10px] font-mono tracking-wider uppercase text-zinc-400">
                      Permanent Public Identifier
                    </span>
                    <div className="font-mono text-base font-bold text-white tracking-widest bg-black/40 px-2.5 py-1 rounded border border-zinc-700 inline-block">
                      VS-7F3K-9021
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-tight">
                      Scan with any smartphone camera during emergencies or parking assistance.
                    </p>
                  </div>
                </div>

                {/* Scratch Security Activation Zone */}
                <div className="border border-dashed border-zinc-700 rounded-lg p-3 bg-zinc-950/60 relative">
                  <div className="flex items-center justify-between text-[11px] mb-1.5">
                    <span className="text-zinc-400 font-mono flex items-center gap-1.5">
                      <VaahanIcon name="lock" size={12} className="text-[#22D3A7]" />
                      RETAIL ACTIVATION COATING
                    </span>
                    <span className="text-[10px] font-mono text-[#22D3A7] bg-[#22D3A7]/10 px-1.5 py-0.5 rounded">
                      SEPARATE SECRET
                    </span>
                  </div>

                  {/* Scratch Overlay Surface (Simulated) */}
                  <div className="h-9 rounded bg-gradient-to-r from-zinc-700 via-zinc-600 to-zinc-700 border border-zinc-500/60 flex items-center justify-center px-4 relative overflow-hidden select-none">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-black" />
                    <span className="font-mono text-xs font-semibold tracking-widest text-zinc-200">
                      •••• •••• •••• (SCRATCH TO ACTIVATE)
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1.5 text-center">
                    Scratch code is used only once during retail activation. Never public.
                  </p>
                </div>

                {/* Footer Tagline */}
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 border-t border-zinc-800/80 pt-2">
                  <span>qr.vaahansafe.com/7F3K9021</span>
                  <span>IP68 UV-STABILIZED</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Architectural Breakdown Cards */}
          <div className="lg:col-span-5 space-y-5">
            {/* Feature 1 */}
            <div className="p-5 rounded-xl border border-border/80 bg-card hover:border-primary/40 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary">
                  <VaahanIcon name="qr" size={20} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    1. Permanent QR Identifier
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    A fixed public locator that connects directly to the VaahanSafe
                    edge resolver without exposing owner identities or account records.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="p-5 rounded-xl border border-border/80 bg-card hover:border-primary/40 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary">
                  <VaahanIcon name="id-card" size={20} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    2. Human-Readable Support Code
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    Formatted as <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-foreground font-semibold">VS-7F3K-9021</code>.
                    Enables manual entry and phone assistance when smartphone camera optics are impaired.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="p-5 rounded-xl border border-border/80 bg-card hover:border-primary/40 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary">
                  <VaahanIcon name="lock" size={20} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    3. Scratch-Off Activation Secret
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    Concealed under an opaque scratch barrier. Guarantees that retail
                    distributors or bystanders cannot claim ownership prior to purchase.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="p-5 rounded-xl border border-border/80 bg-card hover:border-primary/40 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary">
                  <VaahanIcon name="shield" size={20} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    4. Industrial UV & Weather Shield
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    Automotive-grade polycarbonate film rated for Indian sun, monsoon rains,
                    high-pressure pressure washes, and continuous road vibrations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
