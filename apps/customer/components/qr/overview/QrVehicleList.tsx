"use client";

import * as React from "react";
import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";
import type { QrVehicleSummary } from "@/lib/qr-types";
import { cn } from "@vaahansafe/ui/lib/utils";

interface QrVehicleListProps {
  vehicles: QrVehicleSummary[];
}

export function QrVehicleList({ vehicles }: QrVehicleListProps) {
  if (vehicles.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs">
      <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
        <div>
          <div className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-[#cc785c]">
            CONNECTED FLEET
          </div>
          <h2 className="font-serif text-xl font-medium text-foreground">
            Vehicle & QR Relationship
          </h2>
        </div>
        <Link
          href="/vehicles"
          className="font-mono text-xs font-semibold text-[#cc785c] hover:underline"
        >
          View all vehicles &rarr;
        </Link>
      </div>

      <div className="mt-4 divide-y divide-border/60">
        {vehicles.map((v) => {
          const hasQr = v.qrStatus === "ACTIVATED";

          return (
            <div
              key={v.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <VaahanIcon name={v.type.toLowerCase() === "two_wheeler" ? "bike" : "car"} size={16} aria-hidden="true" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-foreground">
                      {v.maskedPlate}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      ({v.identityId})
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {v.make} {v.model}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-wider",
                    hasQr
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      hasQr ? "bg-emerald-500" : "bg-amber-500"
                    )}
                  />
                  <span>{hasQr ? "QR Active" : "No QR"}</span>
                </span>

                <Link
                  href={`/vehicles/${v.id}`}
                  className="rounded-lg border border-border px-2.5 py-1 font-mono text-[10.5px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  Manage
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
