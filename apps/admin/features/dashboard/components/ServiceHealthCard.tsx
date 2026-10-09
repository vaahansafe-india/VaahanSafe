import React from "react";
import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";
import type { DashboardServiceItem } from "../types";

export interface ServiceHealthCardProps {
  services: DashboardServiceItem[];
}

export function ServiceHealthCard({ services }: ServiceHealthCardProps) {
  return (
    <section className="command-panel service-health-panel" aria-label="Service Connectivity Health">
      <div className="command-panel-head">
        <div className="panel-head-title-wrap">
          <h2 className="command-panel-title">INFRASTRUCTURE HEALTH</h2>
          <span className="panel-head-subtitle">Connectivity and cloud provider status</span>
        </div>
        <Link href="/settings" className="panel-action-link">
          <span>View details</span>
          <VaahanIcon name="arrow-right" size={13} />
        </Link>
      </div>

      <div className="command-panel-body service-health-body">
        <div className="service-health-list">
          {services.map((svc) => {
            const isHealthy =
              svc.status === "healthy" || svc.status === "configured";
            const isWarning = svc.status === "degraded";
            const isDanger = svc.status === "unavailable";

            const dotClass = isHealthy
              ? "status-dot-success"
              : isWarning
                ? "status-dot-pending"
                : isDanger
                  ? "status-dot-danger"
                  : "status-dot-neutral";

            const statusLabel =
              svc.status === "healthy"
                ? "Healthy"
                : svc.status === "configured"
                  ? "Protected"
                  : svc.status === "unavailable"
                    ? "Unavailable"
                    : svc.status === "degraded"
                      ? "Degraded"
                      : "Unconfigured";

            return (
              <div key={svc.name} className="service-row-item">
                <div className="service-row-info">
                  <div className="service-row-name-wrap">
                    <span
                      className={`command-status-dot ${dotClass}`}
                      aria-hidden="true"
                    />
                    <strong className="service-row-name">{svc.name}</strong>
                  </div>
                  {svc.detail && (
                    <span className="service-row-detail">{svc.detail}</span>
                  )}
                </div>

                <div className="service-row-status-wrap">
                  {svc.latencyMs != null && (
                    <span className="service-row-latency">
                      {svc.latencyMs} ms
                    </span>
                  )}
                  <span
                    className={`service-status-pill ${
                      isDanger
                        ? "is-danger"
                        : isWarning
                          ? "is-warning"
                          : isHealthy
                            ? "is-healthy"
                            : "is-neutral"
                    }`}
                  >
                    {statusLabel}
                  </span>
                  {svc.actionHref && (
                    <Link
                      href={svc.actionHref}
                      className="service-row-inspect-link"
                    >
                      {svc.actionLabel || "Inspect →"}
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
