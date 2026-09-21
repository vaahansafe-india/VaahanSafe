"use client";

import * as React from "react";
import Link from "next/link";
import { VaahanIcon, type VaahanIconName } from "@vaahansafe/icons";

interface ServiceCommandItem {
  id: string;
  label: string;
  description: string;
  icon: VaahanIconName;
  href?: string;
  onClick?: () => void;
  badge?: string;
}

interface ServiceCommandDeckProps {
  onPlanDetails: () => void;
  onManageSubscription: () => void;
  onExplorePlans: () => void;
  onAddVehicle: () => void;
  hasActiveSubscription: boolean;
}

export function ServiceCommandDeck({
  onPlanDetails,
  onManageSubscription,
  onExplorePlans,
  onAddVehicle,
  hasActiveSubscription,
}: ServiceCommandDeckProps) {
  const commands: ServiceCommandItem[] = [
    {
      id: "plan-details",
      label: "Plan Inclusions",
      description: "Review current capabilities & limits",
      icon: "document",
      onClick: onPlanDetails,
    },
    {
      id: "manage",
      label: "Manage Plan",
      description: hasActiveSubscription ? "Update renewal & billing preferences" : "Attach commercial tier to fleet",
      icon: "settings",
      onClick: hasActiveSubscription ? onManageSubscription : onExplorePlans,
    },
    {
      id: "payments",
      label: "Payments",
      description: "Receipts, transactions & invoices",
      icon: "payment",
      href: "/payments",
    },
    {
      id: "orders",
      label: "Orders & Hardware",
      description: "Track sticker fulfillment & shipments",
      icon: "package",
      href: "/orders",
    },
    {
      id: "add-vehicle",
      label: "Add Vehicle",
      description: "Connect additional vehicle safety identity",
      icon: "vehicle",
      onClick: onAddVehicle,
    },
  ];

  return (
    <section 
      aria-label="Service Command Deck" 
      className="space-y-3 rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-2xs"
    >
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#cc785c] font-semibold">
            Service Commands
          </span>
          <span className="h-1 w-1 rounded-full bg-border" />
          <span className="text-xs text-muted-foreground font-mono">
            Direct Management Deck
          </span>
        </div>
      </div>

      {/* Desktop Horizontal Rail */}
      <div className="hidden lg:grid lg:grid-cols-5 gap-3 pt-1">
        {commands.map((cmd) => {
          const content = (
            <div className="flex flex-col h-full justify-between p-4 rounded-xl border border-border/80 bg-background hover:bg-muted/40 hover:border-[#cc785c]/40 transition-all text-left active:scale-[0.98]">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#cc785c]/10 text-[#cc785c]">
                    <VaahanIcon name={cmd.icon} size={16} />
                  </div>
                  <VaahanIcon name="chevron-right" size={13} className="text-muted-foreground" />
                </div>
                <div className="font-mono text-xs font-bold text-foreground pt-1">
                  {cmd.label}
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                  {cmd.description}
                </p>
              </div>
            </div>
          );

          if (cmd.href) {
            return (
              <Link key={cmd.id} href={cmd.href} className="block h-full">
                {content}
              </Link>
            );
          }

          return (
            <button key={cmd.id} type="button" onClick={cmd.onClick} className="block w-full h-full">
              {content}
            </button>
          );
        })}
      </div>

      {/* Mobile / Tablet Compact Rows */}
      <div className="lg:hidden space-y-2 pt-1">
        {commands.map((cmd) => {
          const rowContent = (
            <div className="flex min-h-[50px] items-center justify-between p-3 rounded-xl border border-border/80 bg-background hover:bg-muted/40 transition-colors active:scale-[0.99]">
              <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#cc785c]/10 text-[#cc785c]">
                  <VaahanIcon name={cmd.icon} size={15} />
                </div>
                <div className="text-left min-w-0 flex-1">
                  <div className="font-mono text-xs font-bold text-foreground">
                    {cmd.label}
                  </div>
                  <div className="text-[10px] text-muted-foreground line-clamp-1">
                    {cmd.description}
                  </div>
                </div>
              </div>
              <VaahanIcon name="chevron-right" size={14} className="text-muted-foreground shrink-0" />
            </div>
          );

          if (cmd.href) {
            return (
              <Link key={cmd.id} href={cmd.href} className="block w-full">
                {rowContent}
              </Link>
            );
          }

          return (
            <button key={cmd.id} type="button" onClick={cmd.onClick} className="block w-full">
              {rowContent}
            </button>
          );
        })}
      </div>
    </section>
  );
}
