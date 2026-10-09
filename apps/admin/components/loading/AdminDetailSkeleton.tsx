import React from "react";
import { AdminLoadingBlock } from "./AdminLoadingBlock";

export interface AdminDetailSkeletonProps {
  title?: string;
}

export function AdminDetailSkeleton({ title }: AdminDetailSkeletonProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={title ? `Loading ${title} details` : "Loading details"}
      className="admin-detail-skeleton-container"
      style={{ pointerEvents: "none" }}
    >
      {/* Back button link */}
      <div style={{ marginBottom: "16px" }}>
        <AdminLoadingBlock width="70px" height="14px" />
      </div>

      {/* Detail Header */}
      <div
        className="admin-page-heading"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "24px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <AdminLoadingBlock width="260px" height="28px" />
            <AdminLoadingBlock width="80px" height="22px" borderRadius="4px" />
          </div>
          <div style={{ marginTop: "10px" }}>
            <AdminLoadingBlock width="380px" height="14px" />
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <AdminLoadingBlock width="90px" height="32px" borderRadius="4px" />
          <AdminLoadingBlock width="110px" height="32px" borderRadius="4px" />
        </div>
      </div>

      {/* Main Detail Grid */}
      <div className="admin-grid">
        {/* Left column: Record Overview & Key-Value cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <section className="admin-panel">
            <div className="admin-panel-head" style={{ marginBottom: "16px" }}>
              <AdminLoadingBlock width="120px" height="18px" />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "20px",
              }}
            >
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i}>
                  <AdminLoadingBlock width="70px" height="11px" />
                  <div style={{ marginTop: "6px" }}>
                    <AdminLoadingBlock width="140px" height="16px" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="admin-panel">
            <div className="admin-panel-head" style={{ marginBottom: "16px" }}>
              <AdminLoadingBlock width="150px" height="18px" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <AdminLoadingBlock width="100%" height="14px" />
              <AdminLoadingBlock width="92%" height="14px" />
              <AdminLoadingBlock width="84%" height="14px" />
            </div>
          </section>
        </div>

        {/* Right column: Audit / Activity Timeline */}
        <section className="admin-panel">
          <div className="admin-panel-head" style={{ marginBottom: "20px" }}>
            <AdminLoadingBlock width="110px" height="18px" />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "flex-start",
                }}
              >
                <div style={{ paddingTop: "3px" }}>
                  <AdminLoadingBlock width="10px" height="10px" borderRadius="50%" />
                </div>
                <div style={{ flex: 1 }}>
                  <AdminLoadingBlock width="180px" height="14px" />
                  <div style={{ marginTop: "6px" }}>
                    <AdminLoadingBlock width="120px" height="11px" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
