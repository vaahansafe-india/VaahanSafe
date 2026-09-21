"use client";

import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { Badge } from "@vaahansafe/ui";
import type { ActiveSubscriptionPassport, ConnectedVehicleServiceItem } from "@/lib/subscription-types";

interface ServicePassportProps {
  passport: ActiveSubscriptionPassport;
  activeVehicle?: ConnectedVehicleServiceItem | null;
  onPlanDetails: () => void;
  onManage: () => void;
  onExplorePlans: () => void;
}

export function ServicePassport({
  passport,
  activeVehicle,
  onPlanDetails,
  onManage,
  onExplorePlans,
}: ServicePassportProps) {
  // Format dates safely
  const formatDate = (isoString?: string) => {
    if (!isoString) return "—";
    try {
      return new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(isoString));
    } catch {
      return isoString;
    }
  };

  const isTermActive = Boolean(passport.termStart && passport.termEnd);

  // Calculate temporal marker position if term dates exist
  const termProgress = React.useMemo(() => {
    if (!passport.termStart || !passport.termEnd) return 50;
    try {
      const start = new Date(passport.termStart).getTime();
      const end = new Date(passport.termEnd).getTime();
      const now = Date.now();
      if (end <= start) return 50;
      const pct = ((now - start) / (end - start)) * 100;
      return Math.max(0, Math.min(100, pct));
    } catch {
      return 50;
    }
  }, [passport.termStart, passport.termEnd]);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-[#181715] text-[#FAF9F5] p-4 sm:p-7 md:p-9 shadow-xl border border-[#252320]">
      {/* Registration Marks / Geometric Grid Lines */}
      <div className="pointer-events-none absolute inset-0 opacity-15">
        <div className="absolute left-4 sm:left-6 top-4 sm:top-6 h-3 w-3 border-l border-t border-[#cc785c]" />
        <div className="absolute right-4 sm:right-6 top-4 sm:top-6 h-3 w-3 border-r border-t border-[#cc785c]" />
        <div className="absolute left-4 sm:left-6 bottom-4 sm:bottom-6 h-3 w-3 border-l border-b border-[#cc785c]" />
        <div className="absolute right-4 sm:right-6 bottom-4 sm:bottom-6 h-3 w-3 border-r border-b border-[#cc785c]" />
        <div className="absolute left-1/2 top-2 sm:top-3 -translate-x-1/2 font-mono text-[7px] sm:text-[8px] uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[#cc785c] whitespace-nowrap">
          VAAHANSAFE // IDENTITY SPEC 2.0
        </div>
      </div>

      {/* Top Meta Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-white/10 pb-4 sm:pb-5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] text-[#cc785c]">
            Current Service
          </span>
          <span className="h-1 w-1 rounded-full bg-white/30" />
          <span className="font-mono text-[9px] sm:text-[10px] text-white/50 tracking-wider">
            {passport.planCode}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {passport.isBaselineContinuity ? (
            <Badge variant="outline" className="border-[#5db8a6]/40 bg-[#5db8a6]/15 font-mono text-[9px] sm:text-[10px] font-semibold text-[#5db8a6] hover:bg-[#5db8a6]/20 hover:text-[#5db8a6]">
              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-[#5db8a6] animate-pulse" />
              {passport.statusLabel}
            </Badge>
          ) : passport.status === "ACTIVE" ? (
            <Badge variant="outline" className="border-[#5db8a6]/40 bg-[#5db8a6]/15 font-mono text-[9px] sm:text-[10px] font-semibold text-[#5db8a6] hover:bg-[#5db8a6]/20 hover:text-[#5db8a6]">
              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-[#5db8a6]" />
              ACTIVE
            </Badge>
          ) : passport.status === "CANCEL_AT_PERIOD_END" ? (
            <Badge variant="outline" className="border-[#e8a55a]/40 bg-[#e8a55a]/15 font-mono text-[9px] sm:text-[10px] font-semibold text-[#e8a55a] hover:bg-[#e8a55a]/20 hover:text-[#e8a55a]">
              EXPIRES AT PERIOD END
            </Badge>
          ) : (
            <Badge variant="outline" className="border-white/20 bg-white/10 hover:bg-white/15 hover:text-white font-mono text-[9px] sm:text-[10px] font-semibold text-white/80">
              {passport.statusLabel}
            </Badge>
          )}
        </div>
      </div>

      {/* Main Service Passport Credential Body */}
      <div className="mt-5 sm:mt-6 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 lg:gap-8 items-start">
        {/* Left Col: Plan & Identity Scope */}
        <div className="lg:col-span-7 space-y-3.5 sm:space-y-4">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-medium tracking-tight text-white leading-tight">
              {passport.planName}
            </h2>
            <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-white/70 leading-relaxed max-w-xl">
              {passport.isBaselineContinuity
                ? "Your vehicle identity and emergency QR resolution remain perpetually verified under core-safety continuity. Optional commercial tiers unlock real-time telemetry and multi-vehicle coverage."
                : "Active commercial service plan powering real-time incident notifications, verified emergency actions, and identity continuity."}
            </p>
          </div>

          {/* Micro Relationship Blueprint */}
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] sm:text-[11px] font-mono text-white/60 pt-0.5">
            <span className="text-[#cc785c] font-bold">VEHICLE</span>
            <span>→</span>
            <span className="text-white/80">QR IDENTITY</span>
            <span>→</span>
            <span className="text-white/80">ENTITLEMENT</span>
            <span>→</span>
            <span className="text-[#5db8a6] font-bold">SERVICES</span>
          </div>

          {/* Quick Specifications */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <span className="font-mono text-[9px] uppercase tracking-wider text-white/50 block">
                Connected Scope
              </span>
              <span className="mt-1 font-mono text-xs sm:text-sm font-bold text-white block truncate">
                {activeVehicle ? activeVehicle.registrationNumber : `${passport.coveredVehiclesCount} Vehicle(s)`}
              </span>
              <span className="text-[10px] text-white/50 font-mono truncate block">
                {activeVehicle ? `${activeVehicle.make} ${activeVehicle.model}` : "Global Account"}
              </span>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <span className="font-mono text-[9px] uppercase tracking-wider text-white/50 block">
                Emergency Contacts
              </span>
              <span className="mt-1 font-mono text-xs sm:text-sm font-bold text-white block">
                Up to {passport.contactLimit} Verified
              </span>
              <span className="text-[10px] text-white/50 font-mono">
                Direct calling enabled
              </span>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <span className="font-mono text-[9px] uppercase tracking-wider text-white/50 block">
                Vehicle Capacity
              </span>
              <span className="mt-1 font-mono text-xs sm:text-sm font-bold text-white block">
                {passport.vehicleLimit} Identity Slot{passport.vehicleLimit > 1 ? "s" : ""}
              </span>
              <span className="text-[10px] text-white/50 font-mono">
                {passport.coveredVehiclesCount} Active
              </span>
            </div>
          </div>
        </div>

        {/* Right Col: Temporal Service Term or Renewal Card */}
        <div className="lg:col-span-5 flex flex-col justify-between h-full rounded-2xl border border-white/10 bg-[#252320]/60 p-4 sm:p-6 space-y-4 sm:space-y-5">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-white/50">
                Service Term
              </span>
              <span className="font-mono text-[10px] text-[#5db8a6]">
                {passport.isBaselineContinuity ? "Perpetual Continuity" : "Time-Bound Term"}
              </span>
            </div>

            {isTermActive ? (
              <div className="space-y-3">
                {/* Temporal Rail */}
                <div className="relative pt-2 pb-1">
                  <div className="h-1.5 w-full rounded-full bg-white/10" />
                  <div
                    className="absolute top-2 h-1.5 rounded-full bg-[#cc785c]"
                    style={{ width: `${termProgress}%` }}
                  />
                  {/* Today Marker */}
                  <div
                    className="absolute -top-1 flex flex-col items-center -translate-x-1/2"
                    style={{ left: `${termProgress}%` }}
                  >
                    <div className="h-3 w-3 rounded-full border-2 border-[#181715] bg-white shadow" />
                    <span className="mt-1 font-mono text-[8px] uppercase tracking-wider text-white/80">
                      TODAY
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between font-mono text-[10px] sm:text-[11px] text-white/70 pt-2">
                  <div>
                    <span className="text-[9px] text-white/40 block">COMMENCED</span>
                    <span>{formatDate(passport.termStart)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-white/40 block">
                      {passport.cancelAtPeriodEnd ? "EXPIRES" : "RENEWS"}
                    </span>
                    <span className="font-bold text-white">{formatDate(passport.termEnd)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 space-y-1">
                <div className="flex items-center gap-2 font-mono text-xs text-[#5db8a6]">
                  <VaahanIcon name="shield" size={13} />
                  <span className="font-bold">Hardware Safety Guarantee</span>
                </div>
                <p className="text-xs text-white/70 leading-relaxed">
                  Your physical QR identity resolves indefinitely. No subscription is required for emergency contact calling.
                </p>
              </div>
            )}

            {/* Next Event */}
            {passport.nextBillingEvent && (
              <div className="border-t border-white/10 pt-2.5 flex items-start justify-between text-xs">
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-white/50 block">
                    Next Scheduled Event
                  </span>
                  <span className="text-white/90 font-medium text-[11px] sm:text-xs">
                    {passport.nextBillingEvent.description}
                  </span>
                </div>
                <span className="font-mono text-[11px] sm:text-xs font-bold text-white">
                  {formatDate(passport.nextBillingEvent.date)}
                </span>
              </div>
            )}
          </div>

          {/* Action Row inside Passport */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5">
            {passport.hasSubscription ? (
              <>
                <button
                  type="button"
                  onClick={onPlanDetails}
                  className="flex-1 inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/5 px-3 text-xs font-mono font-medium text-white hover:bg-white/10 transition-colors active:scale-[0.98]"
                >
                  <VaahanIcon name="document" size={13} />
                  <span>Plan Details</span>
                </button>
                <button
                  type="button"
                  onClick={onManage}
                  className="flex-1 inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#cc785c] px-3 text-xs font-mono font-semibold uppercase tracking-wider text-white hover:bg-[#a9583e] transition-colors active:scale-[0.98]"
                >
                  <VaahanIcon name="settings" size={13} />
                  <span>Manage</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onPlanDetails}
                  className="flex-1 inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/5 px-3 text-xs font-mono font-medium text-white hover:bg-white/10 transition-colors active:scale-[0.98]"
                >
                  <VaahanIcon name="info" size={13} />
                  <span>Inclusions</span>
                </button>
                <button
                  type="button"
                  onClick={onExplorePlans}
                  className="flex-1 inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#cc785c] px-3 text-xs font-mono font-semibold uppercase tracking-wider text-white hover:bg-[#a9583e] transition-colors active:scale-[0.98]"
                >
                  <VaahanIcon name="shield" size={13} />
                  <span>Explore Plans</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
