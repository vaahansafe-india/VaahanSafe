import React from "react";
import { AdminLoadingBlock } from "./AdminLoadingBlock";

export interface AdminMetricSkeletonProps {
  count?: number;
  className?: string;
}

export function AdminMetricSkeleton({
  count = 4,
  className = "",
}: AdminMetricSkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`admin-metrics ${className}`}
      style={{ pointerEvents: "none" }}
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="admin-metric">
          <div className="admin-metric-top">
            <AdminLoadingBlock width="45%" height="12px" />
            <AdminLoadingBlock width="13px" height="13px" borderRadius="2px" />
          </div>
          <div style={{ marginTop: "14px", marginBottom: "8px" }}>
            <AdminLoadingBlock width="60%" height="28px" />
          </div>
          <AdminLoadingBlock width="80%" height="11px" />
        </div>
      ))}
    </div>
  );
}
