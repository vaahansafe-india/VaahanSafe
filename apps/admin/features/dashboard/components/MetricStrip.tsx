import React from "react";
import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";
import type { DashboardMetric } from "../types";

export interface MetricStripProps {
  metrics: DashboardMetric[];
}

export function MetricStrip({ metrics }: MetricStripProps) {
  if (!metrics || metrics.length === 0) return null;

  return (
    <section className="command-metric-strip" aria-label="Key Operational Metrics">
      <div className="metric-strip-grid">
        {metrics.map((m) => {
          const isWarning = m.status === "warning";
          const isCritical = m.status === "critical";

          const displayValue =
            m.value === null
              ? "—"
              : m.value.toLocaleString("en-IN");

          return (
            <Link
              key={m.id}
              href={m.href}
              className={`command-metric-card ${isWarning ? "is-warning" : ""} ${isCritical ? "is-critical" : ""}`}
              title={`View ${m.label} records`}
            >
              <div className="metric-card-header">
                <span className="metric-card-label">{m.label}</span>
                <span className="metric-card-arrow" aria-hidden="true">
                  <VaahanIcon name="arrow-right" size={13} />
                </span>
              </div>

              <div className="metric-card-body">
                <span className="metric-card-value">{displayValue}</span>
                {m.subtext && (
                  <span className="metric-card-subtext">{m.subtext}</span>
                )}
              </div>

              <div className="metric-card-footer">
                <span className="metric-card-detail">{m.detail}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
