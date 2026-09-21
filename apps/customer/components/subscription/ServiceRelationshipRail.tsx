"use client";

import * as React from "react";
import { ServiceNode, type NodeStatus } from "./ServiceNode";
import type { ConnectedVehicleServiceItem, ActiveSubscriptionPassport } from "@/lib/subscription-types";

interface ServiceRelationshipRailProps {
  vehicle?: ConnectedVehicleServiceItem | null;
  passport: ActiveSubscriptionPassport;
  onOpenVehicle: () => void;
  onOpenIdentity: () => void;
  onOpenQr: () => void;
  onOpenEntitlement: () => void;
  onOpenServices: () => void;
}

export function ServiceRelationshipRail({
  vehicle,
  passport,
  onOpenVehicle,
  onOpenIdentity,
  onOpenQr,
  onOpenEntitlement,
  onOpenServices,
}: ServiceRelationshipRailProps) {
  // Derive real status for each node
  const vehicleStatus: NodeStatus = vehicle ? "ACTIVE" : "NOT_CONFIGURED";
  const identityStatus: NodeStatus = vehicle?.status === "ACTIVE" ? "ACTIVE" : vehicle ? "READY" : "NOT_CONFIGURED";
  const qrStatus: NodeStatus = vehicle?.qr?.status === "ACTIVATED" ? "ACTIVE" : vehicle?.qr ? "ATTENTION" : "NOT_CONFIGURED";
  const entitlementStatus: NodeStatus = passport.isBaselineContinuity || passport.status === "ACTIVE" ? "ACTIVE" : "READY";
  const servicesStatus: NodeStatus = passport.status === "ACTIVE" || passport.isBaselineContinuity ? "ACTIVE" : "READY";

  const nodes = [
    {
      id: "vehicle",
      label: "VEHICLE",
      subLabel: vehicle ? vehicle.registrationNumber : "Not registered",
      status: vehicleStatus,
      icon: "vehicle" as const,
      onClick: onOpenVehicle,
    },
    {
      id: "identity",
      label: "IDENTITY",
      subLabel: vehicle ? `${vehicle.make} ${vehicle.model}` : "Safety profile",
      status: identityStatus,
      icon: "id-card" as const,
      onClick: onOpenIdentity,
    },
    {
      id: "qr",
      label: "QR STICKER",
      subLabel: vehicle?.qr ? vehicle.qr.visibleCode : "No sticker bound",
      status: qrStatus,
      icon: "qr" as const,
      onClick: onOpenQr,
    },
    {
      id: "entitlement",
      label: "ENTITLEMENT",
      subLabel: passport.isBaselineContinuity ? "Core Life-Safety" : passport.planName,
      status: entitlementStatus,
      icon: "shield" as const,
      onClick: onOpenEntitlement,
    },
    {
      id: "services",
      label: "SERVICES",
      subLabel: passport.isBaselineContinuity ? "Baseline Resolver" : "Active Suite",
      status: servicesStatus,
      icon: "check" as const,
      onClick: onOpenServices,
    },
  ];

  return (
    <section 
      aria-label="Service Relationship Rail" 
      className="space-y-3 rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-2xs"
    >
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#cc785c] font-semibold">
            Service Relationship
          </span>
          <span className="h-1 w-1 rounded-full bg-border" />
          <span className="text-xs text-muted-foreground font-mono truncate max-w-[120px] sm:max-w-none">
            {vehicle ? vehicle.registrationNumber : "Global"}
          </span>
        </div>
        <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground hidden sm:inline">
          Click node to inspect
        </span>
      </div>

      {/* Desktop Interconnected Rail */}
      <div className="hidden md:grid md:grid-cols-5 gap-3 sm:gap-4 relative pt-2">
        {/* Connecting Background Line */}
        <div className="pointer-events-none absolute top-10 left-[10%] right-[10%] h-0.5 bg-border/80 z-0" />

        {nodes.map((node) => (
          <div key={node.id} className="relative z-10">
            <ServiceNode
              label={node.label}
              subLabel={node.subLabel}
              status={node.status}
              icon={node.icon}
              onClick={node.onClick}
            />
          </div>
        ))}
      </div>

      {/* Mobile Vertical Stack */}
      <div className="md:hidden space-y-2 pt-1">
        {nodes.map((node, index) => (
          <div key={node.id} className="relative">
            {index < nodes.length - 1 && (
              <div className="pointer-events-none absolute left-5 top-10 bottom-0 w-0.5 bg-border z-0" />
            )}
            <div className="relative z-10">
              <button
                type="button"
                onClick={node.onClick}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-border/80 bg-background hover:bg-muted/40 transition-colors active:scale-[0.99]"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-[#cc785c]">
                    <span className="font-mono text-[11px] font-bold">0{index + 1}</span>
                  </div>
                  <div className="text-left min-w-0 flex-1">
                    <div className="font-mono text-xs font-bold text-foreground">
                      {node.label}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {node.subLabel}
                    </div>
                  </div>
                </div>

                <span
                  className={`shrink-0 px-2 py-0.5 rounded-full font-mono text-[9px] uppercase tracking-wider font-semibold ${
                    node.status === "ACTIVE"
                      ? "text-[#5db8a6] bg-[#5db8a6]/10"
                      : node.status === "READY"
                      ? "text-[#cc785c] bg-[#cc785c]/10"
                      : "text-muted-foreground bg-muted"
                  }`}
                >
                  {node.status.replace(/_/g, " ")}
                </span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
