import React from "react";
import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";
import type { DashboardAttentionItem } from "../types";

export interface AttentionPanelProps {
  items: DashboardAttentionItem[];
}

export function AttentionPanel({ items }: AttentionPanelProps) {
  const count = items.length;

  return (
    <section className="command-panel attention-panel" aria-label="Actionable Operational Alerts">
      <div className="command-panel-head">
        <div className="panel-head-title-wrap">
          <h2 className="command-panel-title">NEEDS ATTENTION</h2>
          <span className="panel-head-subtitle">Actionable workflow conditions</span>
        </div>
        <span
          className={`attention-count-badge ${count > 0 ? "has-alerts" : "is-clear"}`}
          aria-label={`${count} attention items`}
        >
          {count}
        </span>
      </div>

      <div className="command-panel-body attention-panel-body">
        {count === 0 ? (
          <div className="attention-empty-state">
            <div className="attention-empty-icon" aria-hidden="true">
              <VaahanIcon name="check" size={20} />
            </div>
            <div className="attention-empty-text">
              <h3>No urgent operational issues</h3>
              <p>All monitored workflows are currently within expected parameters.</p>
            </div>
          </div>
        ) : (
          <div className="attention-items-list">
            {items.map((item) => {
              const isCritical = item.severity === "critical";
              const isHigh = item.severity === "high";

              const severityTagClass = isCritical
                ? "severity-critical"
                : isHigh
                  ? "severity-high"
                  : "severity-medium";

              return (
                <div
                  key={item.id}
                  className={`attention-item ${isCritical ? "is-critical" : ""}`}
                >
                  <div className="attention-item-content">
                    <div className="attention-item-top">
                      <span className={`attention-severity-tag ${severityTagClass}`}>
                        {item.severity}
                      </span>
                      <strong className="attention-item-title">{item.title}</strong>
                    </div>
                    <p className="attention-item-desc">{item.description}</p>
                  </div>

                  <Link
                    href={item.actionHref}
                    className="attention-item-action"
                    aria-label={`${item.actionLabel} for ${item.title}`}
                  >
                    <span>{item.actionLabel}</span>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
