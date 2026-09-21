"use client";

import * as React from "react";
import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";
import type { VehicleScanEventItem } from "@/lib/vehicle-types";

interface VehicleScanPreviewProps {
  scans: VehicleScanEventItem[];
  qrPublicId?: string;
}

export function VehicleScanPreview({ scans, qrPublicId }: VehicleScanPreviewProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-2xs space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#cc785c]">
            INCIDENT TELEMETRY
          </div>
          <h3 className="font-serif text-lg font-medium text-foreground">
            Recent Scan Activity
          </h3>
        </div>

        {qrPublicId && (
          <Link
            href={`/scan-history?qrId=${qrPublicId}`}
            className="font-mono text-xs font-semibold text-[#cc785c] hover:underline inline-flex items-center gap-1"
          >
            <span>Full History</span>
            <VaahanIcon name="arrow-right" size={12} />
          </Link>
        )}
      </div>

      {scans.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground">
            <VaahanIcon name="qr-scan" size={18} />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            No scan activity recorded for this vehicle yet.
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground/70">
            When a passerby or first responder scans your windshield QR, incident events and Golden Hour relays will stream here in real time.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {scans.map((scan) => (
            <div
              key={scan.id}
              className="flex items-center justify-between py-3 text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <VaahanIcon name="qr-scan" size={14} />
                </div>
                <div>
                  <div className="font-semibold text-foreground">
                    {scan.scanType === "EMERGENCY_TRIGGER"
                      ? "Emergency Alert Triggered"
                      : "Public QR Scan"}
                  </div>
                  <div className="font-mono text-[11px] text-muted-foreground">
                    {scan.city && scan.state
                      ? `${scan.city}, ${scan.state}`
                      : "Location Protected / GPS Inactive"}
                  </div>
                </div>
              </div>

              <div className="text-right font-mono text-[11px]">
                <div className="font-semibold text-[#5db8a6]">{scan.result}</div>
                <div className="text-muted-foreground">
                  {new Date(scan.createdAt).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  ,{" "}
                  {new Date(scan.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
