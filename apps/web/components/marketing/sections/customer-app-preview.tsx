import { VaahanIcon } from "@vaahansafe/icons";
import { Badge, Button } from "@vaahansafe/ui/components";
import { getCustomerUrl } from "@vaahansafe/config";

export function CustomerAppPreview() {
  const customerUrl = getCustomerUrl();

  return (
    <section className="py-20 md:py-28 border-t border-border/40 bg-background relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16 md:mb-20">
          <Badge
            variant="outline"
            className="mb-4 text-xs font-mono tracking-wider uppercase border-primary/20 text-primary bg-primary/5"
          >
            Owner Management Experience
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Complete Control in Your Customer App
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            While finders only see an emergency screen, you enjoy a full control panel at{" "}
            <code className="font-mono text-sm bg-muted px-1.5 py-0.5 rounded text-foreground">app.vaahansafe.com</code>.
            Update contacts in real time, view scan alerts, and order replacements with a single tap.
          </p>
        </div>

        {/* High-Fidelity App Mockup Container */}
        <div className="max-w-5xl mx-auto rounded-2xl border-2 border-border/80 bg-card shadow-2xl overflow-hidden">
          {/* Mock Console Browser Bar */}
          <div className="bg-muted/80 px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
            </div>

            <div className="flex items-center gap-2 px-3 py-1 rounded bg-background/80 border border-border/80 text-xs font-mono text-muted-foreground max-w-sm w-full justify-center">
              <VaahanIcon name="lock" size={12} className="text-[#22D3A7]" />
              <span>app.vaahansafe.com/garage</span>
            </div>

            <Badge
              variant="outline"
              className="text-[10px] font-mono tracking-wider uppercase border-primary/30 text-primary bg-primary/5"
            >
              OWNER PORTAL PREVIEW
            </Badge>
          </div>

          {/* Console Interior */}
          <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-border">
            {/* Left Nav Bar Simulation */}
            <div className="md:col-span-3 p-4 bg-muted/20 space-y-1.5 font-medium text-xs">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-primary text-primary-foreground font-semibold">
                <VaahanIcon name="car" size={16} />
                <span>My Vehicles (2)</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
                <VaahanIcon name="phone" size={16} />
                <span>Emergency Relays</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
                <VaahanIcon name="activity" size={16} />
                <span>Scan History</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
                <VaahanIcon name="receipt" size={16} />
                <span>Subscriptions & Orders</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
                <VaahanIcon name="settings" size={16} />
                <span>Privacy Settings</span>
              </div>
            </div>

            {/* Main Stage Simulation */}
            <div className="md:col-span-9 p-6 space-y-6">
              {/* Top Summary Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-muted/40 border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <VaahanIcon name="car" size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-base text-foreground">
                        Tata Safari (Dark Edition)
                      </h4>
                      <Badge className="bg-[#22D3A7]/20 text-primary border border-[#22D3A7]/40 text-[10px] font-mono">
                        ACTIVE
                      </Badge>
                    </div>
                    <p className="text-xs font-mono text-muted-foreground mt-0.5">
                      Plate: DL 01 •••• 9021 • QR ID: VS-7F3K-9021
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="text-xs h-8">
                    <VaahanIcon name="refresh" size={13} className="mr-1.5" />
                    Replace Sticker
                  </Button>
                  <Button size="sm" className="text-xs h-8 bg-primary text-primary-foreground">
                    <VaahanIcon name="shield" size={13} className="mr-1.5" />
                    Manage Relays
                  </Button>
                </div>
              </div>

              {/* 2-Column Modules: Active Relays & Recent Scan Alerts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Module 1: Emergency Contacts */}
                <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <VaahanIcon name="phone" size={14} className="text-primary" />
                      Designated Contacts (2)
                    </span>
                    <span className="text-[10px] font-mono text-[#16A36A] dark:text-[#22D3A7]">All Relays Active</span>
                  </div>

                  <div className="space-y-2">
                    <div className="p-2.5 rounded-lg bg-muted/40 border border-border flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-foreground block">Sunita Kumar</span>
                        <span className="text-[10px] text-muted-foreground font-mono">Spouse • Primary Priority</span>
                      </div>
                      <Badge variant="outline" className="text-[9px] font-mono text-primary border-primary/30">
                        CALL + SMS
                      </Badge>
                    </div>
                    <div className="p-2.5 rounded-lg bg-muted/40 border border-border flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-foreground block">Amit Kumar</span>
                        <span className="text-[10px] text-muted-foreground font-mono">Brother • Secondary</span>
                      </div>
                      <Badge variant="outline" className="text-[9px] font-mono text-primary border-primary/30">
                        CALL ONLY
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Module 2: Recent Scan Audits */}
                <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <VaahanIcon name="activity" size={14} className="text-primary" />
                      Live Scan Audit Log
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">3 Scans Recorded</span>
                  </div>

                  <div className="space-y-2">
                    <div className="p-2.5 rounded-lg bg-muted/40 border border-border flex items-center justify-between text-xs">
                      <div>
                        <span className="font-medium text-foreground block">Roadside Scan (Noida Sec 62)</span>
                        <span className="text-[10px] text-muted-foreground font-mono">Yesterday, 18:42 IST</span>
                      </div>
                      <Badge variant="outline" className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                        RESOLVED
                      </Badge>
                    </div>
                    <div className="p-2.5 rounded-lg bg-muted/40 border border-border flex items-center justify-between text-xs">
                      <div>
                        <span className="font-medium text-foreground block">Parking Query (Cyber Hub, GGN)</span>
                        <span className="text-[10px] text-muted-foreground font-mono">5 days ago, 12:15 IST</span>
                      </div>
                      <Badge variant="outline" className="text-[9px] font-mono text-muted-foreground border-border">
                        SMS NOTIFIED
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA to Open Real Console */}
        <div className="mt-12 text-center">
          <Button asChild className="bg-primary text-primary-foreground shadow-md">
            <a href={customerUrl} target="_blank" rel="noopener noreferrer">
              <span>Sign In to Your VaahanSafe Garage</span>
              <VaahanIcon name="arrow-right" size={15} className="ml-2" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
