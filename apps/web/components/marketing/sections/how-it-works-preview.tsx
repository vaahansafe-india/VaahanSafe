import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";
import { Badge, Button } from "@vaahansafe/ui/components";

export function HowItWorksPreview() {
  const steps = [
    {
      step: "01",
      title: "Get Your VaahanSafe Identifier",
      desc: "Pick up an authentic retail sticker kit at an automotive partner, or order doorstep delivery online through your customer account.",
      icon: "shopping-cart",
      tag: "Retail or Online",
    },
    {
      step: "02",
      title: "Link to Your Vehicle",
      desc: "Scan the QR code, reveal your private scratch code, and link the physical sticker permanently to your car, bike, or commercial fleet.",
      icon: "car",
      tag: "Instant Pairing",
    },
    {
      step: "03",
      title: "Configure Safety Controls",
      desc: "Designate family emergency contacts, select masked calling preferences, and optionally add medical triage guidance.",
      icon: "shield",
      tag: "Owner-Governed",
    },
    {
      step: "04",
      title: "Affix to Vehicle",
      desc: "Apply the UV-resistant, weather-sealed automotive sticker to your front windshield, rear glass, or helmet visor.",
      icon: "qr",
      tag: "Weather-Sealed",
    },
    {
      step: "05",
      title: "Instant Bystander Scan",
      desc: "If an incident or parking obstruction occurs, any finder scans the QR to reach emergency relays immediately—without an app or login.",
      icon: "phone",
      tag: "Zero-Login Access",
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
            Streamlined Operational Workflow
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            How VaahanSafe Works
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            From factory-sealed sticker to roadside protection in five simple steps.
            Engineered to eliminate friction for both vehicle owners and emergency responders.
          </p>
        </div>

        {/* 5-Step Horizontal / Stacked Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {steps.map((item, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl border border-border bg-card hover:border-primary/40 transition-all flex flex-col justify-between group shadow-sm hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-2xl font-black text-primary/30 group-hover:text-primary transition-colors">
                    {item.step}
                  </span>
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <VaahanIcon name={item.icon as any} size={18} />
                  </div>
                </div>

                <span className="inline-block text-[10px] font-mono uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded mb-2">
                  {item.tag}
                </span>

                <h3 className="font-bold text-base text-foreground mb-2 leading-snug">
                  {item.title}
                </h3>

                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-border/60 flex items-center text-xs font-medium text-primary">
                <span>Step {item.step} Completed</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer CTA linking to /how-it-works */}
        <div className="mt-14 text-center">
          <Button variant="outline" asChild className="border-border hover:bg-card">
            <Link href="/how-it-works" className="flex items-center gap-2">
              <span>Explore Detailed Dual-Channel Activation Guide</span>
              <VaahanIcon name="arrow-right" size={15} />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
