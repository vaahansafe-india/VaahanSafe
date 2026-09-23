"use client";

import React, { useState, useEffect } from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@vaahansafe/ui";
import type {
  VehicleOption,
  PublicSafetyPreviewData,
} from "@/lib/contacts-types";
import { ContactRoleMark } from "../roles/ContactRoleMark";
import { fetchPublicSafetyPreviewAction } from "@/lib/contacts-actions";

interface PublicSafetyPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicles: VehicleOption[];
}

export function PublicSafetyPreviewDialog({
  open,
  onOpenChange,
  vehicles,
}: PublicSafetyPreviewDialogProps) {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
    vehicles[0]?.id || ""
  );
  const [previewData, setPreviewData] = useState<PublicSafetyPreviewData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && vehicles.length > 0) {
      const vId = selectedVehicleId || vehicles[0]?.id || "";
      setSelectedVehicleId(vId);
      loadPreview(vId);
    }
  }, [open, vehicles]);

  const loadPreview = async (vehicleId: string) => {
    setIsLoading(true);
    try {
      const res = await fetchPublicSafetyPreviewAction(vehicleId);
      if (res.success && res.data) {
        setPreviewData(res.data);
      } else {
        setPreviewData(null);
      }
    } catch {
      setPreviewData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVehicleChange = (vId: string) => {
    setSelectedVehicleId(vId);
    loadPreview(vId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed inset-auto inset-x-auto bottom-auto left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] sm:w-full max-w-md p-0 overflow-hidden rounded-3xl border border-border bg-background shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 pr-14 border-b border-border/70 bg-card/60 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#5db8a6]">
              Real QR Projection Preview
            </span>
            <span className="rounded-full bg-[#5db8a6]/10 px-2 py-0.5 font-mono text-[9px] font-bold text-[#5db8a6]">
              qr.vaahansafe.com
            </span>
          </div>

          <DialogHeader className="mt-2 text-left pr-2">
            <DialogTitle className="font-serif text-xl font-medium text-foreground">
              What a Scanner Sees
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Simulates the public safety screen exposed when a passerby scans this vehicle sticker.
            </DialogDescription>
          </DialogHeader>

          {/* Vehicle selector if multiple vehicles */}
          {vehicles.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {vehicles.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => handleVehicleChange(v.id)}
                  className={`rounded-xl border px-2.5 py-1 font-mono text-[11px] whitespace-nowrap transition-colors ${
                    selectedVehicleId === v.id
                      ? "border-[#cc785c] bg-[#cc785c]/10 text-[#cc785c] font-bold"
                      : "border-border/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {v.maskedPlate}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Realistic Mock Smartphone Card View */}
        <div className="p-5 bg-muted/20 overflow-y-auto flex-1">
          <div className="rounded-2xl border-2 border-border/80 bg-card p-4 shadow-sm space-y-4">
            {/* Top Bar of Public View */}
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#cc785c] text-white">
                  <VaahanIcon name="vehicle" size={14} />
                </div>
                <div>
                  <div className="font-mono text-xs font-bold text-foreground">
                    {previewData ? previewData.vehiclePlate : "VEHICLE SCAN"}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {previewData ? previewData.vehicleDisplay : "VaahanSafe Safety Identity"}
                  </div>
                </div>
              </div>

              <span className="rounded-full bg-[#5db8a6]/15 px-2 py-0.5 font-mono text-[9px] font-bold text-[#5db8a6]">
                ACTIVE SAFETY QR
              </span>
            </div>

            {/* Medical Info if configured */}
            {previewData?.bloodGroup && (
              <div className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2 text-xs">
                <span className="font-mono text-[10px] uppercase text-muted-foreground">
                  Blood Group:
                </span>
                <span className="font-mono font-bold text-[#cc785c]">
                  {previewData.bloodGroup}
                </span>
              </div>
            )}

            {/* Contact Options */}
            <div className="space-y-2">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Emergency Contact Options
              </div>

              {isLoading ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  <VaahanIcon name="loading" size={16} className="mx-auto animate-spin mb-1 text-[#cc785c]" />
                  <span>Loading public projection...</span>
                </div>
              ) : !previewData || previewData.contacts.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/80 p-4 text-center">
                  <span className="text-xs text-muted-foreground">
                    No emergency contacts are currently enabled for Public Safety View on this vehicle.
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  {previewData.contacts.map((contact, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl border border-border/70 bg-background p-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <ContactRoleMark
                          role={contact.role}
                          size="sm"
                          isPrimary={contact.isPriority}
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-foreground">
                              {contact.name}
                            </span>
                            {contact.isPriority && (
                              <span className="rounded bg-[#cc785c]/15 px-1.5 py-0.2 font-mono text-[8px] font-bold text-[#cc785c]">
                                PRIMARY
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {contact.relationship} &bull; Relay Protected
                          </span>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1 rounded-lg bg-[#5db8a6]/15 px-2.5 py-1 font-mono text-xs font-semibold text-[#5db8a6]">
                        <VaahanIcon name="phone" size={11} />
                        <span>Call &rarr;</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Security Guarantee Notice */}
            <div className="pt-2 border-t border-border/60 text-[10px] leading-relaxed text-muted-foreground">
              <strong className="text-foreground">Privacy Guarantee:</strong> Raw mobile numbers are never rendered or transmitted in public scan responses. Calls are routed through VaahanSafe&apos;s encrypted virtual relay.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/70 bg-card/60 flex justify-end shrink-0">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-xl border border-input bg-background px-4 py-2 font-mono text-xs font-medium text-foreground hover:bg-muted/40 transition-colors"
          >
            Close Preview
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
