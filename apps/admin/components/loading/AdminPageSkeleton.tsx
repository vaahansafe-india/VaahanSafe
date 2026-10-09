import React from "react";
import { AdminLoadingBlock } from "./AdminLoadingBlock";

export interface AdminPageSkeletonProps {
  title?: string;
}

export function AdminPageSkeleton({ title }: AdminPageSkeletonProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={title ? `Loading ${title}` : "Loading workspace"}
      className="admin-page-skeleton"
      style={{ pointerEvents: "none" }}
    >
      {/* Header */}
      <div className="admin-page-heading" style={{ marginBottom: "24px" }}>
        <div>
          <AdminLoadingBlock width="120px" height="12px" />
          <div style={{ marginTop: "8px", marginBottom: "8px" }}>
            <AdminLoadingBlock width="260px" height="28px" />
          </div>
          <AdminLoadingBlock width="380px" height="14px" />
        </div>
        <div className="admin-actions">
          <AdminLoadingBlock width="90px" height="32px" borderRadius="4px" />
        </div>
      </div>

      {/* Main Content Panel */}
      <section className="admin-panel" style={{ padding: "24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <AdminLoadingBlock width="220px" height="20px" />
          <AdminLoadingBlock width="100%" height="14px" />
          <AdminLoadingBlock width="92%" height="14px" />
          <AdminLoadingBlock width="80%" height="14px" />

          <div
            style={{
              marginTop: "16px",
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "16px",
            }}
          >
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  padding: "16px",
                  border: "1px solid var(--paper-line, #d8d0c5)",
                  borderRadius: "4px",
                }}
              >
                <AdminLoadingBlock width="60%" height="14px" />
                <div style={{ marginTop: "10px" }}>
                  <AdminLoadingBlock width="100%" height="12px" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
