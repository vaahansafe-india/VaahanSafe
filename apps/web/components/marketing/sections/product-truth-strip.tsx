import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

const PILLARS = [
  {
    icon: "shield" as const,
    title: "Permanent QR Identity",
    description: "Every vehicle receives a durable, globally unique locator that never expires.",
  },
  {
    icon: "lock" as const,
    title: "Privacy-Controlled Profile",
    description: "Owner decides what is public. Address, email, and private accounts are never exposed.",
  },
  {
    icon: "qr" as const,
    title: "Physical + Digital Parity",
    description: "One single safety infrastructure across weatherproof exterior decals and mobile wallets.",
  },
  {
    icon: "phone" as const,
    title: "Zero-Login Finder Access",
    description: "Bystanders scan with any standard phone camera. No app download or sign-in needed.",
  },
];

export function ProductTruthStrip() {
  return (
    <section className="border-y border-border bg-muted/30 py-8 lg:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {PILLARS.map((pillar) => (
            <div
              key={pillar.title}
              className="flex items-start gap-3.5 p-3 rounded-lg transition-colors hover:bg-muted/50"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground border border-accent">
                <VaahanIcon name={pillar.icon} size={20} className="text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground tracking-tight">
                  {pillar.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
