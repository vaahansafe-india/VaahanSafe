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
      <div className="health-strip-top">
        <div className="health-strip-summary">
          <span className="health-strip-label">SYSTEM HEALTH</span>
          <span className="health-strip-badge">
            <span className={`command-status-dot ${statusDotClass}`} aria-hidden="true" />
            <strong className="health-strip-status-text">{statusLabel}</strong>
          </span>
        </div>

        <div className="health-strip-cta">
          <span className="health-strip-time">Checked {formattedSyncTime}</span>
          <Link href="/incidents" className="health-strip-link">
            <span>System details</span>
            <VaahanIcon name="arrow-right" size={12} />
          </Link>
        </div>
      </div>

      <div className="health-strip-services-grid">
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
                  ? svc.name.toLowerCase().includes("payment")
                    ? "Active"
                    : "Protected"
                  : svc.status === "unavailable"
                    ? "Unavailable"
                    : svc.status === "degraded"
                      ? "Degraded"
                      : "Unconfigured";

          const badgeClass = isHealthy
            ? "is-healthy"
            : isWarning
              ? "is-warning"
              : isDanger
                ? "is-danger"
                : "is-neutral";

          return (
            <div key={svc.name} className="health-service-cell">
              <div className="health-service-left">
                <span className={`command-status-dot ${dotClass}`} aria-hidden="true" />
                <span className="health-service-name" title={svc.name}>
                  {svc.name}
                </span>
              </div>
              <span className={`health-service-pill ${badgeClass}`}>
                {displayText}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
