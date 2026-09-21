import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";
import { Badge, Button } from "@vaahansafe/ui/components";
import { getCustomerUrl } from "@vaahansafe/config";

export function PricingPreview() {
  const customerUrl = getCustomerUrl();

  const plans = [
    {
      name: "Physical QR Kit",
      tagline: "The complete hardware + safety protection pack for one vehicle.",
      features: [
        "1x Automotive-grade UV-sealed exterior sticker",
        "Permanent QR identifier + scratch activation code",
        "Unlimited emergency finder scans without app install",
        "Privacy-masked family call & SMS relays",
        "Full garage management in app.vaahansafe.com",
      ],
      badge: "MOST POPULAR",
      isFeatured: true,
    },
    {
      name: "Family / Multi-Vehicle",
      tagline: "Unified garage safety for households with multiple cars and bikes.",
      features: [
        "Multiple paired automotive QR stickers",
        "Shared family emergency contact directory",
        "Single billing & unified renewal date",
        "Independent privacy toggles per vehicle",
        "Priority sticker replacement guarantee",
      ],
      badge: "GARAGE PACK",
      isFeatured: false,
    },
    {
      name: "Replacement Protection",
      tagline: "Zero-friction sticker handover for cracked glass or vehicle upgrades.",
      features: [
        "Doorstep dispatch of new replacement hardware",
        "Immediate retirement of old sticker into safe REPLACED state",
        "Seamless transfer of active vehicle profile & contacts",
        "No paperwork or police reports required",
      ],
      badge: "LIFECYCLE ADDON",
      isFeatured: false,
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
            Transparent Plans & Hardware
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Simple, Honest Safety Protection
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Every plan includes our industrial-grade hardware, privacy-masked cloud relays,
            and complete owner governance. No hidden platform surcharges or surprise billing.
          </p>
        </div>

        {/* 3 Plan Structural Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`p-7 rounded-2xl flex flex-col justify-between transition-all ${
                plan.isFeatured
                  ? "bg-card border-2 border-primary shadow-xl relative scale-100 md:-translate-y-2"
                  : "bg-card border border-border shadow-sm hover:border-primary/40"
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono font-semibold tracking-wider text-primary uppercase">
                    {plan.name}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-mono ${
                      plan.isFeatured
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {plan.badge}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  {plan.tagline}
                </p>

                {/* Architectural pricing notice */}
                <div className="py-3 px-4 rounded-xl bg-muted/40 border border-border mb-6">
                  <span className="text-xs font-mono text-muted-foreground block uppercase">
                    Pricing Model
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    Hardware + Safety Entitlement
                  </span>
                </div>

                {/* Features List */}
                <ul className="space-y-3 text-xs sm:text-sm text-muted-foreground">
                  {plan.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2.5">
                      <VaahanIcon name="check" size={15} className="text-[#22D3A7] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <div className="mt-8 pt-6 border-t border-border">
                <Button
                  asChild
                  className={`w-full ${
                    plan.isFeatured
                      ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
                      : "bg-muted text-foreground hover:bg-muted/80"
                  }`}
                >
                  <a href={customerUrl} target="_blank" rel="noopener noreferrer">
                    <span>View Plan Options</span>
                    <VaahanIcon name="arrow-right" size={14} className="ml-1.5" />
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing Policy Footnote */}
        <div className="mt-12 text-center text-xs text-muted-foreground max-w-xl mx-auto">
          <span>Looking for detailed pricing breakdown and enterprise fleet tiers? </span>
          <Link href="/pricing" className="text-primary font-semibold hover:underline inline-flex items-center gap-1">
            Browse complete pricing guide
            <VaahanIcon name="arrow-right" size={12} />
          </Link>
        </div>
      </div>
    </section>
  );
}
