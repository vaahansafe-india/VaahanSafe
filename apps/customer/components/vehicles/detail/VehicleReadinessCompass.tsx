"use client";

import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import type { VehicleDossierData, ReadinessNodeState } from "@/lib/vehicle-types";

interface VehicleReadinessCompassProps {
  vehicle: VehicleDossierData;
  onOpenDetails: () => void;
  onOpenQr: () => void;
  onOpenSafety: () => void;
  onOpenContacts: () => void;
}

export function VehicleReadinessCompass({
  vehicle,
  onOpenDetails,
  onOpenQr,
  onOpenSafety,
  onOpenContacts,
}: VehicleReadinessCompassProps) {
  const getNodeColor = (state: ReadinessNodeState) => {
    switch (state) {
      case "ready":
        return {
          bg: "bg-[#5db8a6]",
          text: "text-[#5db8a6]",
          border: "border-[#5db8a6]",
          ring: "ring-[#5db8a6]/20",
        };
      case "attention":
        return {
          bg: "bg-[#e8a55a]",
          text: "text-[#e8a55a]",
          border: "border-[#e8a55a]",
          ring: "ring-[#e8a55a]/20",
        };
      case "not_configured":
      default:
        return {
          bg: "bg-muted-foreground",
          text: "text-muted-foreground",
          border: "border-muted-foreground/40",
          ring: "ring-muted/30",
        };
    }
  };

  const qrColor = getNodeColor(vehicle.readiness.qrNode);
  const identityColor = getNodeColor(vehicle.readiness.identityNode);
  const safetyColor = getNodeColor(vehicle.readiness.safetyNode);
  const contactColor = getNodeColor(vehicle.readiness.contactNode);

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-2xs">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#cc785c]">
            IDENTITY COORDINATE MAP
          </div>
          <h3 className="font-serif text-lg font-medium text-foreground">
            Vehicle Readiness Compass
          </h3>
        </div>
        <div className="font-mono text-[10px] text-muted-foreground">
          INTERACTIVE AXIS
        </div>
      </div>

      {/* 01. Visual Coordinate Map */}
      <div className="relative my-6 flex h-64 sm:h-72 w-full items-center justify-center">
        {/* Horizontal Axis Line */}
        <div className="absolute left-6 right-6 top-1/2 h-px -translate-y-1/2 bg-border" />
        {/* Vertical Axis Line */}
        <div className="absolute bottom-6 top-6 left-1/2 w-px -translate-x-1/2 bg-border" />

        {/* Center Node: VEHICLE */}
        <button
          type="button"
          onClick={onOpenDetails}
          className="group relative z-10 flex flex-col items-center justify-center rounded-2xl border border-border bg-card px-4 py-2.5 shadow-md hover:border-[#cc785c] hover:shadow-lg transition-all"
        >
          <span className="font-mono text-[9px] uppercase tracking-wider text-[#cc785c] font-bold">
            CENTER
          </span>
          <span className="font-semibold text-xs text-foreground">
            {vehicle.make} {vehicle.model}
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">
            Physical Asset
          </span>
        </button>

        {/* Top Node: QR LIFELINE */}
        <button
          type="button"
          onClick={onOpenQr}
          className="group absolute top-2 left-1/2 z-10 -translate-x-1/2 flex flex-col items-center text-center focus:outline-none"
        >
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${qrColor.border} bg-card text-foreground shadow-xs transition-transform group-hover:scale-110`}
          >
            <VaahanIcon name="qr" size={15} className={qrColor.text} />
          </div>
          <span className="mt-1 font-mono text-[10px] font-bold uppercase tracking-wider text-foreground">
            QR LIFELINE
          </span>
          <span className={`font-mono text-[9px] ${qrColor.text} font-semibold`}>
            {vehicle.qr.status}
          </span>
        </button>

        {/* Bottom Node: SAFETY VIEW */}
        <button
          type="button"
          onClick={onOpenSafety}
          className="group absolute bottom-2 left-1/2 z-10 -translate-x-1/2 flex flex-col items-center text-center focus:outline-none"
        >
          <span className={`font-mono text-[9px] ${safetyColor.text} font-semibold`}>
            {vehicle.safety.status === "CONFIGURED" ? "Configured" : "Needs Setup"}
          </span>
          <span className="mb-1 font-mono text-[10px] font-bold uppercase tracking-wider text-foreground">
            SAFETY VIEW
          </span>
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${safetyColor.border} bg-card text-foreground shadow-xs transition-transform group-hover:scale-110`}
          >
            <VaahanIcon name="phone" size={15} className={safetyColor.text} />
          </div>
        </button>

        {/* Left Node: CONTACTS */}
        <button
          type="button"
          onClick={onOpenContacts}
          className="group absolute left-2 top-1/2 z-10 -translate-y-1/2 flex flex-col items-center text-center focus:outline-none max-w-[90px]"
        >
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${contactColor.border} bg-card text-foreground shadow-xs transition-transform group-hover:scale-110`}
          >
            <VaahanIcon name="phone" size={15} className={contactColor.text} />
          </div>
          <span className="mt-1 font-mono text-[10px] font-bold uppercase tracking-wider text-foreground">
            CONTACTS
          </span>
          <span className={`font-mono text-[9px] ${contactColor.text} font-semibold truncate`}>
            {vehicle.contacts.count > 0
              ? `${vehicle.contacts.count} Ready`
              : "Missing"}
          </span>
        </button>

        {/* Right Node: IDENTITY */}
        <button
          type="button"
          onClick={onOpenDetails}
          className="group absolute right-2 top-1/2 z-10 -translate-y-1/2 flex flex-col items-center text-center focus:outline-none max-w-[90px]"
        >
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${identityColor.border} bg-card text-foreground shadow-xs transition-transform group-hover:scale-110`}
          >
            <VaahanIcon name="vehicle" size={15} className={identityColor.text} />
          </div>
          <span className="mt-1 font-mono text-[10px] font-bold uppercase tracking-wider text-foreground">
            IDENTITY
          </span>
          <span className="font-mono text-[9px] text-[#5db8a6] font-semibold truncate">
            {vehicle.identityId}
          </span>
        </button>
      </div>

      {/* 02. Accessible Semantic List Alternative */}
      <div className="border-t border-border pt-3">
        <div className="sr-only">
          <h4>Semantic Coordinate List</h4>
          <ul>
            <li>Physical Asset: {vehicle.make} {vehicle.model} (Active)</li>
            <li>QR Lifeline: {vehicle.qr.status}</li>
            <li>VaahanSafe Identity: {vehicle.identityId} (Connected)</li>
            <li>Public Safety View: {vehicle.safety.status}</li>
            <li>Emergency Contacts: {vehicle.contacts.count} configured</li>
          </ul>
        </div>
        <p className="text-[11px] text-muted-foreground text-center">
          Select any coordinate node to manage its authoritative security settings.
        </p>
      </div>
    </div>
  );
}
