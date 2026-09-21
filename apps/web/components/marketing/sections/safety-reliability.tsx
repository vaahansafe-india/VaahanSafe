import { VaahanIcon } from "@vaahansafe/icons";
import { Badge, Button } from "@vaahansafe/ui/components";
import { getStatusUrl } from "@vaahansafe/config";

export function SafetyReliability() {
  const statusUrl = getStatusUrl();

  return (
    <section className="py-20 md:py-28 border-t border-border/40 bg-background relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16 md:mb-20">
          <Badge
            variant="outline"
            className="mb-4 text-xs font-mono tracking-wider uppercase border-primary/20 text-primary bg-primary/5"
          >
            Decoupled Architecture
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Built for Mission-Critical Roadside Scenarios
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Emergency QR lookup is intentionally isolated from marketing sites, commerce
            systems, and admin backends. When a bystander scans your vehicle, the response
            is served from low-latency edge nodes without dependencies on central origin servers.
          </p>
        </div>

        {/* 3 Pillar Architectural Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {/* Pillar 1 */}
          <div className="p-6 sm:p-8 rounded-2xl border border-border bg-card flex flex-col justify-between shadow-sm hover:border-primary/40 transition-colors">
            <div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                <VaahanIcon name="server" size={24} />
              </div>
              <h3 className="font-bold text-lg text-foreground mb-2">
                Decoupled Resolver Edge
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The resolver service (<code className="font-mono text-xs">qr.vaahansafe.com</code>) runs in an isolated sandbox. High traffic on marketing pages or billing outages cannot degrade emergency QR scans.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-border/60 text-xs font-mono text-muted-foreground flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#22D3A7]" />
              <span>Isolated Micro-Surface</span>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="p-6 sm:p-8 rounded-2xl border border-border bg-card flex flex-col justify-between shadow-sm hover:border-primary/40 transition-colors">
            <div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                <VaahanIcon name="shield" size={24} />
              </div>
              <h3 className="font-bold text-lg text-foreground mb-2">
                Rate Limiting & Abuse Defense
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Automated bot mitigation and geographic burst protection shield owner contact relays against spam sweeps, automated scrapers, and malicious scanning loops.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-border/60 text-xs font-mono text-muted-foreground flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#22D3A7]" />
              <span>Cloudflare Edge Mitigation</span>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="p-6 sm:p-8 rounded-2xl border border-border bg-card flex flex-col justify-between shadow-sm hover:border-primary/40 transition-colors">
            <div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                <VaahanIcon name="lock" size={24} />
              </div>
              <h3 className="font-bold text-lg text-foreground mb-2">
                Regional Data Sovereign Storage
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                All vehicle and customer records are cryptographically partitioned in compliance with Indian digital data protection standards. No unencrypted cross-border exports.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-border/60 text-xs font-mono text-muted-foreground flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#22D3A7]" />
              <span>Zero Foreign Leakage</span>
            </div>
          </div>
        </div>

        {/* Live Status Strip */}
        <div className="mt-12 p-5 rounded-2xl bg-muted/40 border border-border flex flex-col sm:flex-row items-center justify-between gap-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22D3A7] opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#22D3A7]" />
            </span>
            <span className="text-sm font-medium text-foreground">
              All VaahanSafe edge nodes & emergency resolver endpoints operational
            </span>
          </div>

          <Button variant="outline" size="sm" asChild className="border-border text-xs h-9">
            <a href={statusUrl} target="_blank" rel="noopener noreferrer">
              <span>View Live Service Status</span>
              <VaahanIcon name="external-link" size={13} className="ml-1.5 opacity-70" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
