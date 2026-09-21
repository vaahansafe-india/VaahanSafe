import { VaahanIcon } from "@vaahansafe/icons";
import { Badge, Button } from "@vaahansafe/ui/components";
import { getCustomerUrl, getActivateUrl } from "@vaahansafe/config";

export function FinalCta() {
  const customerUrl = getCustomerUrl();
  const activateUrl = getActivateUrl();

  return (
    <section className="py-20 md:py-28 border-t border-border/40 bg-gradient-to-b from-muted/30 via-background to-background relative overflow-hidden">
      {/* Background Accent Mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(13,72,68,0.12),transparent)] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
        {/* Identity Badge */}
        <Badge
          variant="outline"
          className="mb-6 text-xs font-mono tracking-wider uppercase border-primary/20 text-primary bg-primary/5 px-3 py-1"
        >
          Automotive Emergency Infrastructure
        </Badge>

        {/* Primary Headline */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground max-w-3xl mx-auto leading-[1.15]">
          Give your vehicle a VaahanSafe identity.
        </h2>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Permanent physical QR hardware. Low-latency edge resolution. Complete owner-governed
          privacy. Activate your vehicle safety identity in under two minutes.
        </p>

        {/* Action Button Group */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            size="lg"
            asChild
            className="w-full sm:w-auto h-12 px-8 bg-primary hover:bg-[#105752] text-primary-foreground font-semibold text-base shadow-lg hover:shadow-xl transition-all"
          >
            <a href={customerUrl} target="_blank" rel="noopener noreferrer">
              <span>Get VaahanSafe</span>
              <VaahanIcon name="arrow-right" size={16} className="ml-2" />
            </a>
          </Button>

          <Button
            size="lg"
            variant="outline"
            asChild
            className="w-full sm:w-auto h-12 px-8 border-border bg-card/80 hover:bg-card hover:border-primary/40 text-foreground font-medium text-base shadow-sm transition-all"
          >
            <a href={activateUrl} target="_blank" rel="noopener noreferrer">
              <VaahanIcon name="lock" size={16} className="mr-2 text-primary" />
              <span>Activate Retail QR</span>
            </a>
          </Button>
        </div>

        {/* Trust Badges Row */}
        <div className="mt-12 pt-8 border-t border-border/60 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-mono text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <VaahanIcon name="check" size={14} className="text-[#22D3A7]" />
            Zero-Login Finder Access
          </span>
          <span className="flex items-center gap-1.5">
            <VaahanIcon name="check" size={14} className="text-[#22D3A7]" />
            Masked Cloud Voice Relays
          </span>
          <span className="flex items-center gap-1.5">
            <VaahanIcon name="check" size={14} className="text-[#22D3A7]" />
            UV-Shielded Automotive Hardware
          </span>
          <span className="flex items-center gap-1.5">
            <VaahanIcon name="check" size={14} className="text-[#22D3A7]" />
            Encrypted Data Sovereignty
          </span>
        </div>
      </div>
    </section>
  );
}
