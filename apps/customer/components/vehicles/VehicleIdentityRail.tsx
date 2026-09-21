"use client";

import * as React from "react";
import type { ReadinessNodeState, QrStatus, SafetyViewStatus } from "@/lib/vehicle-types";

interface VehicleIdentityRailProps {
  vehicleState?: ReadinessNodeState;
  identityState?: ReadinessNodeState;
  qrState?: ReadinessNodeState;
  safetyState?: ReadinessNodeState;
  identityLabel?: string;
  qrStatus?: QrStatus;
  replacementPending?: boolean;
  replacementStatus?: string;
  safetyStatus?: SafetyViewStatus;
  onOpenVehicleSheet?: () => void;
  onOpenQrSheet?: () => void;
  onOpenSafetySheet?: () => void;
}

export function VehicleIdentityRail({
  vehicleState = "ready",
  identityState = "ready",
  qrState = "not_configured",
  safetyState = "not_configured",
  identityLabel = "Connected",
  qrStatus = "UNLINKED",
  replacementPending = false,
  replacementStatus,
  safetyStatus = "NEEDS_SETUP",
  onOpenVehicleSheet,
  onOpenQrSheet,
  onOpenSafetySheet,
}: VehicleIdentityRailProps) {
  const getNodeColor = (state: ReadinessNodeState) => {
    switch (state) {
      case "ready":
        return "bg-[#5db8a6] border-[#5db8a6] text-[#5db8a6]";
      case "attention":
        return "bg-[#e8a55a] border-[#e8a55a] text-[#e8a55a]";
      case "not_configured":
      default:
        return "bg-muted-foreground/30 border-muted-foreground/40 text-muted-foreground";
    }
  };

  const isQrActive = qrStatus === "ACTIVE" || qrStatus === "ACTIVATED";

  const getQrStatusDisplay = () => {
    if (replacementPending) {
      return {
        label: replacementStatus ? `Replacing (${replacementStatus.toLowerCase()})` : "Replacing",
        colorClass: "text-[#cc785c] font-semibold",
      };
    }
    if (isQrActive) {
      return {
        label: "Active",
        colorClass: "text-[#5db8a6]",
      };
    }
    if (qrStatus === "PRINTED") {
      return {
        label: "In Transit",
        colorClass: "text-[#e8a55a] font-semibold",
      };
    }
    if (qrStatus === "REPLACED") {
      return {
        label: "Replaced",
        colorClass: "text-muted-foreground font-semibold",
      };
    }
    if (qrStatus === "BLOCKED") {
      return {
        label: "Blocked",
        colorClass: "text-destructive font-semibold",
      };
    }
    if (qrStatus === "LOST_DAMAGED") {
      return {
        label: "Damaged",
        colorClass: "text-destructive font-semibold",
      };
    }
    return {
      label: "Unlinked",
      colorClass: "text-[#e8a55a] font-semibold",
    };
  };

  const qrDisplay = getQrStatusDisplay();

  return (
    <>
      {/* 01. Desktop Horizontal Relationship Rail (sm:flex) */}
      <div className="hidden sm:flex items-center justify-between w-full font-mono text-[10.5px]">
        {/* Node 1: Vehicle */}
        <button
          type="button"
          onClick={onOpenVehicleSheet}
          className="group/node flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none focus-visible:ring-1 focus-visible:ring-[#cc785c] rounded p-1 shrink-0"
          title="Inspect Physical Vehicle Specs"
        >
          <span
            className={`h-2.5 w-2.5 rounded-full border-2 ${getNodeColor(
              vehicleState
            )}`}
          />
          <div className="flex flex-col text-left">
            <span className="font-semibold uppercase tracking-wider text-foreground">
              VEHICLE
            </span>
            <span className="text-[9.5px] text-muted-foreground whitespace-nowrap">Active</span>
          </div>
        </button>

        {/* Rail Connector 1-2 */}
        <span className="h-px flex-1 min-w-[16px] bg-border mx-2 sm:mx-4" />

        {/* Node 2: Identity */}
        <button
          type="button"
          onClick={onOpenVehicleSheet}
          className="group/node flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none focus-visible:ring-1 focus-visible:ring-[#cc785c] rounded p-1 shrink-0"
          title="Inspect VaahanSafe Identity Record"
        >
          <span
            className={`h-2.5 w-2.5 rounded-full border-2 ${getNodeColor(
              identityState
            )}`}
          />
          <div className="flex flex-col text-left">
            <span className="font-semibold uppercase tracking-wider text-foreground">
              IDENTITY
            </span>
            <span className="text-[9.5px] text-[#5db8a6] whitespace-nowrap">
              {identityLabel}
            </span>
          </div>
        </button>

        {/* Rail Connector 2-3 */}
        <span className="h-px flex-1 min-w-[16px] bg-border mx-2 sm:mx-4" />

        {/* Node 3: QR */}
        <button
          type="button"
          onClick={onOpenQrSheet}
          className="group/node flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none focus-visible:ring-1 focus-visible:ring-[#cc785c] rounded p-1 shrink-0"
          title="Manage Linked QR Sticker"
        >
          <span
            className={`h-2.5 w-2.5 rounded-full border-2 ${getNodeColor(qrState)}`}
          />
          <div className="flex flex-col text-left">
            <span className="font-semibold uppercase tracking-wider text-foreground">
              QR
            </span>
            <span
              className={`text-[9.5px] whitespace-nowrap ${qrDisplay.colorClass}`}
            >
              {qrDisplay.label}
            </span>
          </div>
        </button>

        {/* Rail Connector 3-4 */}
        <span className="h-px flex-1 min-w-[16px] bg-border mx-2 sm:mx-4" />

        {/* Node 4: Safety View */}
        <button
          type="button"
          onClick={onOpenSafetySheet}
          className="group/node flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none focus-visible:ring-1 focus-visible:ring-[#cc785c] rounded p-1 shrink-0"
          title="Configure Finder Emergency Safety View"
        >
          <span
            className={`h-2.5 w-2.5 rounded-full border-2 ${getNodeColor(
              safetyState
            )}`}
          />
          <div className="flex flex-col text-left">
            <span className="font-semibold uppercase tracking-wider text-foreground">
              SAFETY VIEW
            </span>
            <span
              className={`text-[9.5px] whitespace-nowrap ${
                safetyStatus === "CONFIGURED"
                  ? "text-[#5db8a6]"
                  : "text-[#e8a55a] font-semibold"
              }`}
            >
              {safetyStatus === "CONFIGURED" ? "Configured" : "Needs setup"}
            </span>
          </div>
        </button>
      </div>

      {/* 02. Mobile Vertical Relationship Chain (sm:hidden) */}
      <div className="sm:hidden space-y-2 py-1 font-mono text-xs">
        <div className="relative pl-5 space-y-2.5 before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-px before:bg-border">
          {/* Item 1 */}
          <button
            type="button"
            onClick={onOpenVehicleSheet}
            className="flex items-center justify-between w-full text-left focus:outline-none"
          >
            <div className="flex items-center gap-2">
              <span
                className={`absolute left-0 h-2.5 w-2.5 rounded-full border-2 ${getNodeColor(
                  vehicleState
                )} bg-card`}
              />
              <span className="font-medium text-foreground">Vehicle Asset</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Active</span>
          </button>

          {/* Item 2 */}
          <button
            type="button"
            onClick={onOpenVehicleSheet}
            className="flex items-center justify-between w-full text-left focus:outline-none"
          >
            <div className="flex items-center gap-2">
              <span
                className={`absolute left-0 h-2.5 w-2.5 rounded-full border-2 ${getNodeColor(
                  identityState
                )} bg-card`}
              />
              <span className="font-medium text-foreground">VaahanSafe Identity</span>
            </div>
            <span className="text-[10px] text-[#5db8a6]">{identityLabel}</span>
          </button>

          {/* Item 3 */}
          <button
            type="button"
            onClick={onOpenQrSheet}
            className="flex items-center justify-between w-full text-left focus:outline-none"
          >
            <div className="flex items-center gap-2">
              <span
                className={`absolute left-0 h-2.5 w-2.5 rounded-full border-2 ${getNodeColor(
                  qrState
                )} bg-card`}
              />
              <span className="font-medium text-foreground">QR Lifeline</span>
            </div>
            <span
              className={`text-[10px] ${qrDisplay.colorClass}`}
            >
              {qrDisplay.label}
            </span>
          </button>

          {/* Item 4 */}
          <button
            type="button"
            onClick={onOpenSafetySheet}
            className="flex items-center justify-between w-full text-left focus:outline-none"
          >
            <div className="flex items-center gap-2">
              <span
                className={`absolute left-0 h-2.5 w-2.5 rounded-full border-2 ${getNodeColor(
                  safetyState
                )} bg-card`}
              />
              <span className="font-medium text-foreground">Public Safety View</span>
            </div>
            <span
              className={`text-[10px] font-semibold ${
                safetyStatus === "CONFIGURED" ? "text-[#5db8a6]" : "text-[#e8a55a]"
              }`}
            >
              {safetyStatus === "CONFIGURED" ? "Configured" : "Needs setup"}
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
