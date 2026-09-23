"use client";

import * as React from "react";
import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";
import { cn } from "@vaahansafe/ui/lib/utils";

interface QrActionStationProps {
  recommendedAction: "BUY" | "ACTIVATE" | "MANAGE" | "DIGITAL";
  stickersCount: number;
  vehiclesCount: number;
}

interface ActionItem {
  id: string;
  step: string;
  category: "ACQUIRE" | "MANAGE" | "SERVICE";
  title: string;
  description: string;
  href: string;
  badge?: string;
  icon: string;
  isRecommendedKey: "BUY" | "ACTIVATE" | "MANAGE" | "DIGITAL";
}

const ACTIONS: ActionItem[] = [
  {
    id: "buy",
    step: "01",
    category: "ACQUIRE",
    title: "Buy QR",
    description: "Order physical UV-laminated weatherproof safety stickers delivered directly to your doorstep.",
    href: "/qr/buy",
    badge: "STICKER",
    icon: "cart",
    isRecommendedKey: "BUY",
  },
  {
    id: "activate",
    step: "02",
    category: "ACQUIRE",
    title: "Activate Retail QR",
    description: "Already purchased a physical pack at a dealership? Reveal the scratch code to connect your vehicle.",
    href: "/qr/activate",
    badge: "RETAIL",
    icon: "qr-scan",
    isRecommendedKey: "ACTIVATE",
  },
  {
    id: "codes",
    step: "03",
    category: "MANAGE",
    title: "QR Codes",
    description: "View the authoritative hardware registry, public IDs, and vehicle connection status.",
    href: "/qr/codes",
    icon: "qr",
    isRecommendedKey: "MANAGE",
  },
  {
    id: "digital",
    step: "04",
    category: "MANAGE",
    title: "Digital QR",
    description: "Access your verifiable digital pass with direct roadside presentation and safety preview.",
    href: "/qr/digital",
    badge: "PASS",
    icon: "id-card",
    isRecommendedKey: "DIGITAL",
  },
  {
    id: "replace",
    step: "05",
    category: "SERVICE",
    title: "Replace QR",
    description: "Lost or damaged your sticker? Migrate your vehicle identity to a new sticker with zero data loss.",
    href: "/qr/replace",
    icon: "refresh",
    isRecommendedKey: "MANAGE",
  },
];

export function QrActionStation({
  recommendedAction,
}: QrActionStationProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-[#cc785c]">
            ACTION STATION
          </div>
          <h2 className="font-serif text-2xl font-medium text-foreground">
            What would you like to do?
          </h2>
        </div>
        <span className="font-mono text-[10px] text-muted-foreground">
          5 State-Aware Operations
        </span>
      </div>

      {/* Grid of Action Cards */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {ACTIONS.map((action) => {
          const isRecommended = action.isRecommendedKey === recommendedAction;

          return (
            <Link
              key={action.id}
              href={action.href}
              className={cn(
                "group relative flex flex-col justify-between rounded-2xl border p-5 transition-all duration-200",
                isRecommended
                  ? "border-[#cc785c]/60 bg-card shadow-xs ring-1 ring-[#cc785c]/20 hover:border-[#cc785c] hover:shadow-md"
                  : "border-border bg-card/60 hover:border-border hover:bg-card hover:shadow-xs"
              )}
            >
              {/* Card Header: Category & Step Index */}
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                    <span className="text-foreground font-semibold">{action.step}</span>
                    <span>/</span>
                    <span>{action.category}</span>
                  </div>

                  {action.badge && (
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 font-mono text-[8.5px] font-semibold uppercase tracking-wider",
                        isRecommended
                          ? "bg-[#cc785c]/15 text-[#cc785c]"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {action.badge}
                    </span>
                  )}
                </div>

                {/* Title & Icon */}
                <div className="mt-3 flex items-center gap-2.5">
                  <div
                    className={cn(
                      "flex size-8 items-center justify-center rounded-lg transition-colors",
                      isRecommended
                        ? "bg-[#cc785c]/15 text-[#cc785c]"
                        : "bg-muted text-muted-foreground group-hover:text-foreground"
                    )}
                  >
                    <VaahanIcon name={action.icon as any} size={16} aria-hidden="true" />
                  </div>
                  <h3 className="font-serif text-lg font-medium text-foreground group-hover:text-[#cc785c] transition-colors">
                    {action.title}
                  </h3>
                </div>

                {/* Description */}
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  {action.description}
                </p>
              </div>

              {/* Card Footer CTA */}
              <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 font-mono text-[10.5px] font-semibold uppercase tracking-wider text-[#cc785c]">
                <span>Launch &rarr;</span>
                {isRecommended && (
                  <span className="text-[9px] text-muted-foreground font-normal">
                    Recommended Next
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
