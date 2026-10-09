import React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import type { DashboardPulse } from "../types";

export interface ActivityPulseProps {
  pulse: DashboardPulse;
}

export function ActivityPulse({ pulse }: ActivityPulseProps) {
  const {
    buckets,
    totalScans24h,
    totalActivations24h,
    totalOrders24h,
    totalFailures24h,
    hasData,
  } = pulse;

  // Maximum value for scaling SVG sparkline
  const maxVal = Math.max(
    1,
    ...buckets.map((b) => b.scans + b.orders + b.activations),
  );

  // Generate SVG sparkline points
  // Width 360, Height 64, padding 10
  const width = 360;
  const height = 64;
  const paddingX = 16;
  const paddingY = 12;

  const points = buckets.map((b, idx) => {
    const total = b.scans + b.orders + b.activations;
    const x =
      paddingX + (idx / Math.max(1, buckets.length - 1)) * (width - 2 * paddingX);
    const y =
      height -
      paddingY -
      (total / maxVal) * (height - 2 * paddingY);
    return { x, y, total, label: b.hourLabel };
  });

  const pathD = points.reduce((acc, p, idx) => {
    if (idx === 0) return `M ${p.x} ${p.y}`;
    // Smooth bezier curve
    const prev = points[idx - 1]!;
    const cx = (prev.x + p.x) / 2;
    return `${acc} C ${cx} ${prev.y}, ${cx} ${p.y}, ${p.x} ${p.y}`;
  }, "");

  // Area under curve for subtle gradient fill
  const areaD = `${pathD} L ${points[points.length - 1]?.x ?? width} ${height} L ${points[0]?.x ?? 0} ${height} Z`;

  return (
    <section className="command-panel activity-pulse-panel" aria-label="Platform Activity Pulse">
      <div className="command-panel-head">
        <div className="panel-head-title-wrap">
          <h2 className="command-panel-title">ACTIVITY — LAST 24 HOURS</h2>
          <span className="panel-head-subtitle">Platform throughput and scan frequency</span>
        </div>
        <div className="pulse-live-indicator">
          <span className="pulse-live-dot" aria-hidden="true" />
          <span>Real-time</span>
        </div>
      </div>

      <div className="command-panel-body activity-pulse-body">
        {hasData ? (
          <>
            <div className="pulse-chart-container" aria-hidden="true">
              <svg
                viewBox={`0 0 ${width} ${height}`}
                className="pulse-svg"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="pulseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4e6348" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#4e6348" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path d={areaD} fill="url(#pulseGradient)" />
                <path
                  d={pathD}
                  fill="none"
                  stroke="#4e6348"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {points.map((p, i) => (
                  <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r="3.5"
                    fill="#faf9f5"
                    stroke="#4e6348"
                    strokeWidth="2"
                  />
                ))}
              </svg>

              <div className="pulse-axis-labels">
                {buckets.map((b, i) => (
                  <span key={i} className="pulse-axis-label">
                    {b.hourLabel}
                  </span>
                ))}
              </div>
            </div>

            <div className="pulse-summary-stats">
              <div className="pulse-stat-item">
                <span className="pulse-stat-label">Scans</span>
                <span className="pulse-stat-value">{totalScans24h.toLocaleString("en-IN")}</span>
              </div>
              <div className="pulse-stat-item">
                <span className="pulse-stat-label">Activations</span>
                <span className="pulse-stat-value">{totalActivations24h.toLocaleString("en-IN")}</span>
              </div>
              <div className="pulse-stat-item">
                <span className="pulse-stat-label">Orders</span>
                <span className="pulse-stat-value">{totalOrders24h.toLocaleString("en-IN")}</span>
              </div>
              <div className={`pulse-stat-item ${totalFailures24h > 0 ? "has-failures" : ""}`}>
                <span className="pulse-stat-label">Failures</span>
                <span className="pulse-stat-value">{totalFailures24h.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="pulse-empty-state">
            <VaahanIcon name="activity" size={24} className="pulse-empty-icon" />
            <div className="pulse-empty-text">
              <h3>No recorded events in last 24 hours</h3>
              <p>Scan activity, retail claims, and orders will plot here automatically.</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
