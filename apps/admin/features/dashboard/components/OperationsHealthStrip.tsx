import React from "react";
import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";
import type { DashboardServiceItem } from "../types";

export interface OperationsHealthStripProps {
  systemStatus: "operational" | "degraded" | "attention";
  services: DashboardServiceItem[];
  formattedSyncTime: string;
}

export function OperationsHealthStrip({
  systemStatus,
  services,
  formattedSyncTime,
}: OperationsHealthStripProps) {
  const statusLabel =
    systemStatus === "operational"
      ? "Operational"
      : systemStatus === "degraded"
        ? "Degraded"
        : "Attention Required";

  const statusDotClass =
    systemStatus === "operational"
      ? "status-dot-success"
      : systemStatus === "degraded"
        ? "status-dot-pending"
        : "status-dot-danger";

  return (
    <div className="operations-health-strip" aria-label="Operational Health Status">
      <div className="health-strip-summary">
        <span className="health-strip-label">SYSTEM HEALTH</span>
        <span className="health-strip-badge">
          <span className={`command-status-dot ${statusDotClass}`} aria-hidden="true" />
          <strong className="health-strip-status-text">{statusLabel}</strong>
        </span>
      </div>

      <div className="health-strip-services">
        {services.map((svc) => {
          const isHealthy = svc.status === "healthy" || svc.status === "configured";
          const isWarning = svc.status === "degraded";
          const isDanger = svc.status === "unavailable";

          const dotClass = isHealthy
            ? "status-dot-success"
            : isWarning
              ? "status-dot-pending"
              : isDanger
                ? "status-dot-danger"
                : "status-dot-neutral";

          const displayText =
            svc.latencyMs != null
              ? `${svc.latencyMs} ms`
              : svc.status === "healthy"
                ? "Healthy"
                : svc.status === "configured"
                  ? "Protected"
                  : svc.status === "unavailable"
                    ? "Unavailable"
                    : svc.status === "degraded"
                      ? "Degraded"
                      : "Unconfigured";

          return (
            <div key={svc.name} className="health-strip-item">
              <span className={`health-item-dot ${dotClass}`} aria-hidden="true" />
              <span className="health-item-name">{svc.name}</span>
              <span className={`health-item-state ${isDanger ? "is-danger" : ""}`}>
                {displayText}
              </span>
            </div>
          );
        })}
      </div>

      <div className="health-strip-cta">
        <span className="health-strip-time">Checked {formattedSyncTime}</span>
        <Link href="/incidents" className="health-strip-link">
          <span>System details</span>
          <VaahanIcon name="arrow-right" size={12} />
        </Link>
      </div>
    </div>
  );
}
