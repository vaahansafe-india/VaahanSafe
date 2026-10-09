"use client";

import React, { useId } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { VaahanIcon } from "@vaahansafe/icons";
import type { DashboardPulse } from "../types";

export interface ActivityPulseProps {
  pulse: DashboardPulse;
}

function CustomPulseTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div className="pulse-tooltip-box">
      <div className="pulse-tooltip-header">
        <strong>{data.hourLabel}</strong>
        <span>{data.total} event{data.total === 1 ? "" : "s"}</span>
      </div>
      <div className="pulse-tooltip-list">
        <div className="pulse-tooltip-row">
          <span>Scans:</span>
          <strong>{data.scans}</strong>
        </div>
        <div className="pulse-tooltip-row">
          <span>Activations:</span>
          <strong>{data.activations}</strong>
        </div>
        <div className="pulse-tooltip-row">
          <span>Orders:</span>
          <strong>{data.orders}</strong>
        </div>
        {data.failures > 0 && (
          <div className="pulse-tooltip-row is-failure">
            <span>Failures:</span>
            <strong>{data.failures}</strong>
          </div>
        )}
      </div>
    </div>
  );
}

export function ActivityPulse({ pulse }: ActivityPulseProps) {
  const gradientId = useId();
  const {
    buckets,
    totalScans24h,
    totalActivations24h,
    totalOrders24h,
    totalFailures24h,
    hasData,
  } = pulse;

  const chartData = buckets.map((b) => ({
    hourLabel: b.hourLabel,
    total: b.scans + b.activations + b.orders,
    scans: b.scans,
    activations: b.activations,
    orders: b.orders,
    failures: b.failures,
  }));

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
            <div className="pulse-recharts-container">
              <ResponsiveContainer width="100%" height={84}>
                <AreaChart
                  data={chartData}
                  margin={{ top: 8, right: 12, left: 12, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4e6348" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#4e6348" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="hourLabel"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fill: "#8c9685" }}
                    dy={4}
                  />
                  <YAxis hide domain={[0, "dataMax + 1"]} />
                  <Tooltip
                    content={<CustomPulseTooltip />}
                    cursor={{
                      stroke: "#8c9685",
                      strokeWidth: 1,
                      strokeDasharray: "3 3",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#4e6348"
                    strokeWidth={2}
                    fill={`url(#${gradientId})`}
                    dot={{
                      r: 3.5,
                      fill: "#faf9f5",
                      stroke: "#4e6348",
                      strokeWidth: 2,
                    }}
                    activeDot={{
                      r: 5,
                      fill: "#4e6348",
                      stroke: "#faf9f5",
                      strokeWidth: 2,
                    }}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
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
