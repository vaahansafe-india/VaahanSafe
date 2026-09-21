"use client";

import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import type {
  DashboardVehicle,
  DashboardQrSticker,
  DashboardEmergencyProfile,
} from "@/lib/dashboard-types";

interface IdentityOrbitProps {
  vehicle: DashboardVehicle | null;
  qrSticker: DashboardQrSticker | null;
  safetyProfile: DashboardEmergencyProfile;
  onSelectVehicle: () => void;
  onSelectQr: () => void;
  onSelectSafetyView: () => void;
  onSelectContacts: () => void;
}

export function IdentityOrbit({
  vehicle,
  qrSticker,
  safetyProfile,
  onSelectVehicle,
  onSelectQr,
  onSelectSafetyView,
  onSelectContacts,
}: IdentityOrbitProps) {
  const isVehicleConfigured = Boolean(vehicle);
  const isQrActive = qrSticker?.status === "ACTIVE" || qrSticker?.status === "ACTIVATED";
  const isReplacementPending = Boolean(qrSticker?.replacementPending);
  const isSafetyConfigured = Boolean(safetyProfile.bloodGroup);
  const isContactsConfigured = safetyProfile.contacts.length > 0;

  const qrNodeStatus = isReplacementPending
    ? "Replacing"
    : isQrActive
    ? "Active"
    : qrSticker
    ? qrSticker.status
    : "Unlinked";

  const qrNodeSubtext = isReplacementPending
    ? (qrSticker?.replacementStatus?.toLowerCase() || "requested")
    : null;

  const qrNodeTone: "copper" | "teal" | "amber" = isReplacementPending
    ? "copper"
    : isQrActive
    ? "teal"
    : "amber";

  const nodes = [
    {
      id: "qr",
      name: "QR STICKER",
      status: qrNodeStatus,
      subtext: qrNodeSubtext,
      isReady: isQrActive,
      tone: qrNodeTone,
      icon: "qr" as const,
      onClick: onSelectQr,
      coords: { x: 150, y: 35 },
    },
    {
      id: "safety",
      name: "SAFETY VIEW",
      status: isSafetyConfigured ? "Configured" : "Incomplete",
      subtext: null,
      isReady: isSafetyConfigured,
      tone: (isSafetyConfigured ? "teal" : "amber") as "copper" | "teal" | "amber",
      icon: "shield" as const,
      onClick: onSelectSafetyView,
      coords: { x: 255, y: 150 },
    },
    {
      id: "contacts",
      name: "EMERGENCY CONTACT",
      status: isContactsConfigured ? `${safetyProfile.contacts.length} Active` : "Missing",
      subtext: null,
      isReady: isContactsConfigured,
      tone: (isContactsConfigured ? "teal" : "amber") as "copper" | "teal" | "amber",
      icon: "phone" as const,
      onClick: onSelectContacts,
      coords: { x: 150, y: 265 },
    },
    {
      id: "vehicle",
      name: "VEHICLE CONTEXT",
      status: isVehicleConfigured ? "Bound" : "Unset",
      subtext: null,
      isReady: isVehicleConfigured,
      tone: (isVehicleConfigured ? "teal" : "amber") as "copper" | "teal" | "amber",
      icon: "vehicle" as const,
      onClick: onSelectVehicle,
      coords: { x: 45, y: 150 },
    },
  ];

  return (
    <div className="flex h-full flex-1 flex-col justify-between rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-sm">
      <div className="border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-[#cc785c]" />
          <h3 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-foreground">
            IDENTITY ORBIT
          </h3>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Topological map of your vehicle, safety sticker, privacy projection, and emergency responders.
        </p>
      </div>

      {/* Desktop & Tablet: Radial Nodal Diagram */}
      <div className="relative my-3 py-2 hidden sm:flex items-center justify-center min-h-[300px] w-full">
        <div className="relative h-72 w-72 select-none flex items-center justify-center">
          <svg
            viewBox="0 0 300 300"
            className="absolute inset-0 h-full w-full"
            aria-hidden="true"
          >
            {/* Subtle Concentric Orbital Rings */}
            <circle
              cx="150"
              cy="150"
              r="105"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="4 4"
              className="text-border"
            />
            <circle
              cx="150"
              cy="150"
              r="60"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="2 2"
              className="text-border/60"
            />

            {/* Connection Lines from Center to Orbiting Nodes */}
            {nodes.map((node) => {
              const lineColor =
                node.tone === "copper"
                  ? "#cc785c"
                  : node.tone === "teal"
                  ? "#5db8a6"
                  : "#e8a55a";
              return (
                <line
                  key={`line-${node.id}`}
                  x1="150"
                  y1="150"
                  x2={node.coords.x}
                  y2={node.coords.y}
                  stroke={lineColor}
                  strokeWidth="1.5"
                  opacity="0.6"
                />
              );
            })}

            {/* Center Hub: Vehicle Core */}
            <circle cx="150" cy="150" r="28" fill="#181715" stroke="#cc785c" strokeWidth="2" />
            <text
              x="150"
              y="147"
              textAnchor="middle"
              fill="#FAF9F5"
              fontSize="8.5"
              fontFamily="monospace"
              fontWeight="bold"
            >
              VAAHAN
            </text>
            <text
              x="150"
              y="158"
              textAnchor="middle"
              fill="#cc785c"
              fontSize="7.5"
              fontFamily="monospace"
            >
              IDENTITY
            </text>
          </svg>

          {/* Orbiting Interactive Node Buttons */}
          {nodes.map((node) => {
            const positionStyles: Record<string, string> = {
              qr: "top-1 left-1/2 -translate-x-1/2",
              safety: "top-1/2 right-0 -translate-y-1/2",
              contacts: "bottom-1 left-1/2 -translate-x-1/2",
              vehicle: "top-1/2 left-0 -translate-y-1/2",
            };

            const borderClass =
              node.tone === "copper"
                ? "border-[#cc785c]/50 hover:border-[#cc785c]"
                : node.tone === "teal"
                ? "border-[#5db8a6]/40 hover:border-[#5db8a6]"
                : "border-[#e8a55a]/40 hover:border-[#e8a55a]";

            const iconBg =
              node.tone === "copper"
                ? "bg-[#cc785c]/10 text-[#cc785c]"
                : node.tone === "teal"
                ? "bg-[#5db8a6]/10 text-[#5db8a6]"
                : "bg-[#e8a55a]/10 text-[#e8a55a]";

            const statusColor =
              node.tone === "copper"
                ? "text-[#cc785c]"
                : node.tone === "teal"
                ? "text-[#5db8a6]"
                : "text-[#e8a55a]";

            return (
              <button
                key={node.id}
                type="button"
                onClick={node.onClick}
                className={`absolute ${positionStyles[node.id]} z-10 flex flex-col items-center gap-1 rounded-xl border bg-card/95 backdrop-blur-xs px-2.5 py-1.5 text-center shadow-xs transition-all hover:scale-105 focus:outline-none max-w-[110px] ${borderClass}`}
              >
                <div className={`flex h-6 w-6 items-center justify-center rounded-lg ${iconBg}`}>
                  <VaahanIcon name={node.icon} size={14} />
                </div>
                <span className="font-mono text-[9px] font-bold text-foreground leading-tight truncate max-w-[100px]">
                  {node.name}
                </span>
                <span className={`font-mono text-[8px] font-semibold leading-tight ${statusColor}`}>
                  {node.status}
                </span>
                {node.subtext && (
                  <span className={`font-mono text-[7px] font-medium uppercase tracking-wider leading-none opacity-85 ${statusColor}`}>
                    ({node.subtext})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Alternative: Vertical Relationship Flow */}
      <div className="mt-3 divide-y divide-border sm:hidden">
        {nodes.map((node) => {
          const iconBg =
            node.tone === "copper"
              ? "bg-[#cc785c]/10 text-[#cc785c]"
              : node.tone === "teal"
              ? "bg-[#5db8a6]/10 text-[#5db8a6]"
              : "bg-[#e8a55a]/10 text-[#e8a55a]";
          const statusColor =
            node.tone === "copper"
              ? "text-[#cc785c]"
              : node.tone === "teal"
              ? "text-[#5db8a6]"
              : "text-[#e8a55a]";

          return (
            <button
              key={node.id}
              type="button"
              onClick={node.onClick}
              className="flex w-full items-center justify-between py-2.5 text-left text-xs"
            >
              <div className="flex items-center gap-2.5">
                <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${iconBg}`}>
                  <VaahanIcon name={node.icon} size={14} />
                </span>
                <div>
                  <div className="font-mono text-[11px] font-bold text-foreground">
                    {node.name}
                  </div>
                  <div className={`text-[10px] font-mono ${statusColor}`}>
                    {node.status} {node.subtext ? `(${node.subtext})` : ""}
                  </div>
                </div>
              </div>

              <span className={`font-mono text-[10px] font-bold ${statusColor}`}>
                Inspect →
              </span>
            </button>
          );
        })}
      </div>

      <div className="border-t border-border pt-3 text-[10px] font-mono text-muted-foreground">
        CLICK NODE TO OPEN DETAILED INSPECTION SHEET
      </div>
    </div>
  );
}
