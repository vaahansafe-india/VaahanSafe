import { VaahanIcon } from "@vaahansafe/icons";
import { Badge } from "@vaahansafe/ui/components";

export function ReplacementWorkflow() {
  const steps = [
    {
      num: "01",
      title: "Windshield Damage or Lost Sticker",
      desc: "If your car glass is replaced, sticker is scratched, or vehicle is repainted, flag the unit for replacement directly from your garage console.",
      icon: "alert",
    },
    {
      num: "02",
      title: "One-Click Security Verification",
      desc: "Authenticate via your verified mobile number (MSG91 OTP) to confirm replacement authorization without tedious manual paperwork.",
      icon: "lock",
    },
    {
      num: "03",
      title: "Instant New Hardware Dispatch",
      desc: "A brand-new automotive sticker is dispatched immediately from the pre-generated regional inventory pool to your doorstep.",
      icon: "truck-delivery",
    },
    {
      num: "04",
      title: "Zero-Downtime Safe Handover",
      desc: "The previous QR is retired into 'REPLACED' state. All vehicle configurations, emergency contacts, and active plans carry forward untouched.",
      icon: "refresh",
    },
  ];

  return (
    <section className="py-20 md:py-28 border-t border-border/40 bg-muted/20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16 md:mb-20">
          <Badge
            variant="outline"
            className="mb-4 text-xs font-mono tracking-wider uppercase border-primary/20 text-primary bg-primary/5"
          >
            Tamper & Glass Replacement Assurance
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Seamless Hardware Replacement
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Broken windshields and vehicle upgrades happen. VaahanSafe lets you transition
            to a new physical identifier in minutes while safely decommissioning the old tag.
          </p>
        </div>

        {/* 4-Phase Transition Diagram */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl border border-border bg-card flex flex-col justify-between shadow-sm relative group hover:border-primary/40 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-2xl font-black text-primary/30 group-hover:text-primary transition-colors">
                    {step.num}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <VaahanIcon name={step.icon as any} size={20} />
                  </div>
                </div>

                <h3 className="font-bold text-base text-foreground mb-2 leading-snug">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {step.desc}
                </p>
              </div>

              <div className="pt-4 mt-6 border-t border-border/60 flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
                <VaahanIcon name="check" size={13} className="text-[#22D3A7]" />
                <span>Encrypted Edge Audit</span>
              </div>
            </div>
          ))}
        </div>

        {/* Safety Callout Banner */}
        <div className="mt-12 max-w-4xl mx-auto p-5 rounded-2xl bg-card border-2 border-primary/30 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <VaahanIcon name="shield" size={20} />
            </div>
            <div>
              <h4 className="font-bold text-sm text-foreground">
                What happens to your old discarded sticker?
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                The retired QR immediately enters the <code className="font-mono text-primary font-semibold">REPLACED</code> state. Anyone scanning it sees a decommission notice. Zero contacts or private records are ever exposed.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-mono font-semibold shrink-0">
            FRAUD PROTECTED
          </span>
        </div>
      </div>
    </section>
  );
}
