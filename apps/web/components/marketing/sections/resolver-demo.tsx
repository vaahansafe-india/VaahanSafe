"use client";

import { useState } from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { Badge, Button } from "@vaahansafe/ui/components";
import {
  RESOLVER_DEMO_FIXTURES,
  type ActiveResolverDemo,
  type UnactivatedResolverDemo,
  type ReplacedResolverDemo,
  type InvalidResolverDemo,
} from "../../../lib/demo/resolver-demo-fixtures";
import { getActivateUrl } from "@vaahansafe/config";

type DemoStateKey = "ACTIVE" | "UNACTIVATED" | "REPLACED" | "INVALID";

export function ResolverDemo() {
  const [activeState, setActiveState] = useState<DemoStateKey>("ACTIVE");
  const fixture = RESOLVER_DEMO_FIXTURES[activeState];
  const activateUrl = getActivateUrl();

  return (
    <section className="py-20 md:py-28 border-t border-border/40 bg-background relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
          <Badge
            variant="outline"
            className="mb-4 text-xs font-mono tracking-wider uppercase border-primary/20 text-primary bg-primary/5"
          >
            Live Edge Simulation
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Interactive QR Resolver Sandbox
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Experience how the VaahanSafe resolver (<code className="font-mono text-sm bg-muted px-1.5 py-0.5 rounded text-foreground">qr.vaahansafe.com</code>) reacts to different QR states.
            Zero login required for finders. Guaranteed zero data leakage.
          </p>
        </div>

        {/* State Selection Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-10">
          {(
            [
              { key: "ACTIVE", label: "01. Active Profile", icon: "shield" },
              { key: "UNACTIVATED", label: "02. Unactivated Sticker", icon: "qr" },
              { key: "REPLACED", label: "03. Replaced / Retired", icon: "lock" },
              { key: "INVALID", label: "04. Invalid QR", icon: "alert" },
            ] as const
          ).map((item) => {
            const isSelected = activeState === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveState(item.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border"
                }`}
                aria-pressed={isSelected}
              >
                <VaahanIcon name={item.icon} size={15} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Resolver Sandbox Device / Viewport */}
        <div className="max-w-2xl mx-auto bg-card rounded-2xl border-2 border-border shadow-2xl overflow-hidden">
          {/* Simulated Browser / Scan Header */}
          <div className="bg-muted/80 px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
            </div>

            <div className="flex items-center gap-2 px-3 py-1 rounded bg-background/80 border border-border/80 text-[11px] font-mono text-muted-foreground w-full max-w-xs justify-center">
              <VaahanIcon name="lock" size={11} className="text-[#22D3A7]" />
              <span>
                qr.vaahansafe.com/{fixture.publicId}
              </span>
            </div>

            <Badge
              variant="outline"
              className="text-[10px] font-mono tracking-wider uppercase border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10"
            >
              DEMO DATA ONLY
            </Badge>
          </div>

          {/* Dynamic Content Panel based on State */}
          <div className="p-6 sm:p-8 min-h-[380px] flex flex-col justify-between">
            {activeState === "ACTIVE" && (
              <ActiveStateContent data={fixture as ActiveResolverDemo} />
            )}
            {activeState === "UNACTIVATED" && (
              <UnactivatedStateContent
                data={fixture as UnactivatedResolverDemo}
                activateUrl={activateUrl}
              />
            )}
            {activeState === "REPLACED" && (
              <ReplacedStateContent data={fixture as ReplacedResolverDemo} />
            )}
            {activeState === "INVALID" && (
              <InvalidStateContent data={fixture as InvalidResolverDemo} />
            )}
          </div>

          {/* Sandbox Footer Info */}
          <div className="bg-muted/40 px-6 py-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#22D3A7]" />
              Protected Edge Resolver Mode
            </span>
            <span className="font-mono text-[11px]">
              Target State: {activeState}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// SUBCOMPONENTS: State Presentations
// ---------------------------------------------------------------------------

function ActiveStateContent({ data }: { data: ActiveResolverDemo }) {
  return (
    <div className="space-y-6">
      {/* Verification & Status */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider block">
            Vehicle Profile
          </span>
          <h4 className="text-lg font-bold text-foreground flex items-center gap-2 mt-0.5">
            <VaahanIcon name="car" size={18} className="text-primary" />
            {data.vehicle.display}
          </h4>
        </div>
        <Badge className="bg-[#22D3A7]/15 text-primary border border-[#22D3A7]/40 text-xs font-mono font-medium">
          VERIFIED IDENTITY
        </Badge>
      </div>

      {/* Masked Specs */}
      <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-lg bg-muted/50 border border-border/50 text-center font-mono text-xs">
        <div>
          <span className="text-[10px] text-muted-foreground block uppercase">Plate</span>
          <span className="font-semibold text-foreground">{data.vehicle.registrationMasked}</span>
        </div>
        <div className="border-x border-border/50">
          <span className="text-[10px] text-muted-foreground block uppercase">Fuel</span>
          <span className="font-semibold text-foreground">{data.vehicle.fuelType}</span>
        </div>
        <div>
          <span className="text-[10px] text-muted-foreground block uppercase">Color</span>
          <span className="font-semibold text-foreground">{data.vehicle.color}</span>
        </div>
      </div>

      {/* Emergency Contacts Relay (Finder Action) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <VaahanIcon name="shield" size={14} className="text-primary" />
            Approved Emergency Contacts
          </span>
          <span className="text-[10px] font-mono text-muted-foreground">
            {data.emergency.contacts.length} Contact Relay(s)
          </span>
        </div>

        <div className="space-y-2">
          {data.emergency.contacts.map((contact, i) => (
            <div
              key={i}
              className="p-3 rounded-lg border border-border bg-card flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-foreground">
                    {contact.name}
                  </span>
                  <span className="text-[10px] font-mono bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                    {contact.relationship}
                  </span>
                  {contact.isPriority && (
                    <Badge variant="outline" className="text-[9px] font-mono border-primary/30 text-primary py-0">
                      PRIORITY
                    </Badge>
                  )}
                </div>
                <span className="text-xs font-mono text-muted-foreground block mt-0.5">
                  {contact.maskedPhone}
                </span>
              </div>

              {/* Call Action Button */}
              <button
                type="button"
                className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1.5 hover:bg-primary/90 transition-colors shadow-sm"
              >
                <VaahanIcon name="phone" size={13} />
                <span>Notify Relay</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Medical Opt-in Note */}
      {data.emergency.safetyNotes && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs">
          <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-semibold mb-1">
            <VaahanIcon name="info" size={13} />
            <span>Owner-Shared Medical Notice (Blood: {data.emergency.bloodGroup})</span>
          </div>
          <p className="text-muted-foreground text-[11px] leading-relaxed">
            {data.emergency.safetyNotes}
          </p>
        </div>
      )}
    </div>
  );
}

function UnactivatedStateContent({
  data,
  activateUrl,
}: {
  data: UnactivatedResolverDemo;
  activateUrl: string;
}) {
  return (
    <div className="text-center py-6 space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
        <VaahanIcon name="qr" size={32} />
      </div>

      <div className="space-y-2 max-w-md mx-auto">
        <Badge variant="outline" className="font-mono text-xs text-amber-600 dark:text-amber-400 border-amber-500/30">
          UNACTIVATED UNIT • {data.visibleCode}
        </Badge>
        <h4 className="text-xl font-bold text-foreground">
          {data.message}
        </h4>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {data.activationInstructions}
        </p>
      </div>

      <div className="pt-2">
        <Button asChild className="bg-primary text-primary-foreground">
          <a href={activateUrl} target="_blank" rel="noopener noreferrer">
            <VaahanIcon name="lock" size={15} className="mr-2" />
            Proceed to Scratch Activation
          </a>
        </Button>
      </div>
    </div>
  );
}

function ReplacedStateContent({ data }: { data: ReplacedResolverDemo }) {
  return (
    <div className="text-center py-6 space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-muted border border-border flex items-center justify-center mx-auto text-muted-foreground">
        <VaahanIcon name="lock" size={32} />
      </div>

      <div className="space-y-2 max-w-md mx-auto">
        <Badge variant="outline" className="font-mono text-xs text-muted-foreground border-border">
          RETIRED IDENTIFIER • {data.visibleCode}
        </Badge>
        <h4 className="text-xl font-bold text-foreground">
          {data.message}
        </h4>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {data.safetyNotice}
        </p>
      </div>

      <div className="p-3 rounded-lg bg-muted/40 border border-border text-xs text-muted-foreground max-w-sm mx-auto font-mono">
        Status: Securely Decommissioned ({data.retiredAt})
      </div>
    </div>
  );
}

function InvalidStateContent({ data }: { data: InvalidResolverDemo }) {
  return (
    <div className="text-center py-6 space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-600 dark:text-red-400">
        <VaahanIcon name="alert" size={32} />
      </div>

      <div className="space-y-2 max-w-md mx-auto">
        <Badge variant="outline" className="font-mono text-xs text-red-600 dark:text-red-400 border-red-500/30">
          UNKNOWN REGISTRY RECORD
        </Badge>
        <h4 className="text-xl font-bold text-foreground">
          {data.message}
        </h4>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {data.guidance}
        </p>
      </div>

      <div className="p-3 rounded-lg bg-muted/40 border border-border text-xs text-muted-foreground max-w-sm mx-auto">
        If you are the vehicle owner experiencing scanning issues, verify the code or contact support.
      </div>
    </div>
  );
}
