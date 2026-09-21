"use client";

import * as React from "react";
import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  Badge,
} from "@vaahansafe/ui";
import type { CommercialPlanItem } from "@/lib/subscription-types";

interface ExplorePlansSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plans: CommercialPlanItem[];
  currentPlanCode?: string;
}

export function ExplorePlansSheet({
  open,
  onOpenChange,
  plans,
  currentPlanCode,
}: ExplorePlansSheetProps) {
  // Commercial tier upgrades only: exclude perpetual baseline zero-price plans
  const commercialPlans = React.useMemo(
    () => plans.filter((plan) => plan.priceMinor > 0),
    [plans]
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto bg-card p-4 sm:p-6">
        <SheetHeader className="border-b border-border pb-4 pr-12 text-left">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#cc785c]">
            Commercial Tiers
          </div>
          <SheetTitle className="font-serif text-2xl font-medium text-foreground">
            Available Service Plans
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Compare verified service capabilities, fleet capacities, and pricing.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {commercialPlans.length === 0 ? (
            <div className="rounded-2xl border border-border bg-background p-6 text-center text-xs text-muted-foreground">
              No additional commercial tier upgrades currently available.
            </div>
          ) : (
            commercialPlans.map((plan) => {
            const isCurrent = currentPlanCode === plan.code;
            const isSafetyPlus = plan.code.includes("PLUS");

            return (
              <div
                key={plan.id}
                className={`rounded-2xl border p-5 transition-all ${
                  isCurrent
                    ? "border-[#5db8a6] bg-[#5db8a6]/[0.03]"
                    : isSafetyPlus
                    ? "border-[#cc785c]/40 bg-[#cc785c]/[0.02]"
                    : "border-border bg-background"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-serif text-xl font-medium text-foreground">
                        {plan.name}
                      </h4>
                      {isCurrent && (
                        <Badge variant="outline" className="border-[#5db8a6]/40 bg-[#5db8a6]/10 text-[#5db8a6] hover:bg-[#5db8a6]/15 hover:text-[#5db8a6] font-mono text-[9px]">
                          CURRENT
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      {plan.description}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono text-xl font-bold text-foreground">
                      {plan.priceMinor === 0 ? "₹0" : `₹${(plan.priceMinor / 100).toFixed(0)}`}
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground uppercase">
                      /{plan.billingInterval.toLowerCase()}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border/60 grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <VaahanIcon name="vehicle" size={13} className="text-[#cc785c]" />
                    <span>Up to {plan.vehicleLimit} Vehicle{plan.vehicleLimit > 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <VaahanIcon name="phone" size={13} className="text-[#5db8a6]" />
                    <span>Up to {plan.contactLimit} Contacts</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border/60">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block mb-2">
                    Included Capabilities
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                    {plan.features.map((feat) => (
                      <div key={feat} className="flex items-center gap-1.5 text-muted-foreground">
                        <VaahanIcon name="check" size={12} className="text-[#5db8a6] shrink-0" />
                        <span className="truncate">{feat.replace(/_/g, " ")}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {!isCurrent && (
                  <div className="mt-5">
                    <Link
                      href={`/qr/buy?plan=${plan.code}`}
                      className="w-full inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-[#cc785c] px-4 font-mono text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#a9583e] transition-colors"
                    >
                      <span>Select {plan.name}</span>
                      <VaahanIcon name="arrow-right" size={12} />
                    </Link>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      </SheetContent>
    </Sheet>
  );
}
