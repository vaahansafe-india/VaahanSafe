import React from "react";
import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";
import type { DashboardAuditItem } from "../types";

export interface RecentAdminActivityProps {
  activity: DashboardAuditItem[];
  canViewAudit: boolean;
}

export function RecentAdminActivity({
  activity,
  canViewAudit,
}: RecentAdminActivityProps) {
  return (
    <section className="command-panel activity-timeline-panel" aria-label="Administrative Audit Activity">
      <div className="command-panel-head">
        <div className="panel-head-title-wrap">
          <h2 className="command-panel-title">RECENT ADMIN ACTIVITY</h2>
          <span className="panel-head-subtitle">Audited operational modifications</span>
        </div>
        {canViewAudit && (
          <Link href="/audit" className="panel-action-link">
            <span>View audit log</span>
            <VaahanIcon name="arrow-right" size={13} />
          </Link>
        )}
      </div>

      <div className="command-panel-body activity-timeline-body">
        {activity.length === 0 ? (
          <div className="activity-empty-state">
            <VaahanIcon name="activity" size={24} />
            <h3>No recent audit activity</h3>
            <p>Privileged management changes will record here with immutable timestamps.</p>
          </div>
        ) : (
          <div className="activity-timeline-list">
            {activity.map((item) => (
              <div key={item.id} className="activity-timeline-item">
                <div className="activity-item-time" title={item.timestamp}>
                  <span>{item.age}</span>
                </div>
                <div className="activity-item-connector">
                  <span className="activity-dot" aria-hidden="true" />
                  <span className="activity-line" aria-hidden="true" />
                </div>
                <div className="activity-item-content">
                  <strong className="activity-item-action">{item.action}</strong>
                  <p className="activity-item-summary">{item.summary}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
