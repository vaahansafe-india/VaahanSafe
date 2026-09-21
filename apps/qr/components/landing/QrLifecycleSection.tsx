import React from "react";
import { VaahanIcon, type VaahanIconName } from "@vaahansafe/icons";
import { Badge } from "@vaahansafe/ui/components";

interface StateItem {
  state: string;
  badgeVariant: "secondary" | "outline";
  color: string;
  icon: VaahanIconName;
  title: string;
  desc: string;
  actionLabel: string;
}

export function QrLifecycleSection() {
  const states: StateItem[] = [
    {
      state: "READY TO ACTIVATE",
      badgeVariant: "secondary",
      color: "text-primary border-primary/30 bg-primary/5",
      icon: "qr",
      title: "Unactivated Retail Sticker",
      desc: "A genuine VaahanSafe physical QR sticker that has been printed and packaged, but not yet linked to a verified vehicle identity.",
      actionLabel: "Directs to activate.vaahansafe.com",
    },
    {
      state: "ACTIVE",
      badgeVariant: "outline",
      color: "text-emerald-700 dark:text-emerald-400 border-emerald-600/30 bg-emerald-500/5",
      icon: "check",
      title: "Verified Active Pass",
      desc: "The sticker is bound to an active vehicle with satisfied service entitlement. Resolves immediately to the owner-approved safety profile.",
      actionLabel: "Resolves Public Safety Card",
    },
    {
      state: "REPLACED",
      badgeVariant: "outline" as const,
      color: "text-amber-700 dark:text-amber-400 border-amber-600/30 bg-amber-500/5",
      icon: "warning",
      title: "Superseded Identity",
      desc: "When a vehicle sticker is damaged or lost, the owner activates a replacement. The old sticker gracefully steps down and routes to the new pass.",
      actionLabel: "Seamless Replacement Relay",
    },
    {
      state: "UNAVAILABLE",
      badgeVariant: "outline" as const,
      color: "text-muted-foreground border-border bg-muted/30",
      icon: "alert",
      title: "Decommissioned Code",
      desc: "The sticker is retired, revoked, or no longer active. The finder is informed without revealing internal operational reasons.",
      actionLabel: "Dignified Inactive View",
    },
  ];

  return (
    <section id="lifecycle" className="w-full py-16 sm:py-24 border-b border-border/80 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-primary font-semibold">
            <span>03</span>
            <span>&bull;</span>
            <span>Lifecycle States</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-foreground leading-[1.15]">
            A physical QR that <br />
            understands its <span className="italic text-primary font-medium">lifecycle.</span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Unlike static stickers that fail silently, every VaahanSafe QR identity is governed
            by an authoritative state machine.
          </p>
        </div>

        {/* 4 State Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {states.map((st) => (
            <div
              key={st.state}
              className="p-5 rounded-2xl border border-border/80 bg-card flex flex-col justify-between space-y-4 shadow-xs"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={`font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 ${st.color}`}>
                    {st.state}
                  </Badge>
                  <VaahanIcon name={st.icon} size={16} className="text-muted-foreground" />
                </div>

                <h3 className="font-serif text-lg font-medium text-foreground tracking-tight">
                  {st.title}
                </h3>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {st.desc}
                </p>
              </div>

              <div className="pt-3 border-t border-border/60">
                <span className="font-mono text-[10px] text-foreground/80 block">
                  &bull; {st.actionLabel}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
