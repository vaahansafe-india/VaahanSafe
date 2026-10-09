import React from "react";
import { AdminLoadingBlock } from "./AdminLoadingBlock";

export interface AdminChartSkeletonProps {
  height?: number | string;
  className?: string;
}

export function AdminChartSkeleton({
  height = 220,
  className = "",
}: AdminChartSkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`admin-panel ${className}`}
      style={{ pointerEvents: "none" }}
    >
      <div
        className="admin-panel-head"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <div>
          <AdminLoadingBlock width="160px" height="18px" />
          <div style={{ marginTop: "6px" }}>
            <AdminLoadingBlock width="120px" height="12px" />
          </div>
        </div>
        <AdminLoadingBlock width="90px" height="28px" borderRadius="4px" />
      </div>

      <div
        style={{
          height,
          display: "flex",
          alignItems: "flex-end",
          gap: "12px",
          padding: "16px 8px 8px",
          borderTop: "1px solid var(--paper-line, #d8d0c5)",
        }}
      >
        {[45, 65, 30, 80, 55, 90, 70, 40, 85, 60, 75, 50].map((h, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              height: "100%",
            }}
          >
            <AdminLoadingBlock
              width="100%"
              height={`${h}%`}
              borderRadius="3px 3px 0 0"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
