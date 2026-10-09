import React from "react";
import { AdminLoadingBlock } from "./AdminLoadingBlock";
import { AdminMetricSkeleton } from "./AdminMetricSkeleton";

export function AdminDashboardSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading operations dashboard"
      className="admin-dashboard-skeleton"
      style={{ pointerEvents: "none" }}
    >
      {/* 1. Page Heading */}
      <div className="admin-page-heading">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <AdminLoadingBlock width="8px" height="8px" borderRadius="50%" />
            <AdminLoadingBlock width="130px" height="12px" />
          </div>
          <div style={{ marginTop: "8px", marginBottom: "8px" }}>
            <AdminLoadingBlock width="320px" height="30px" />
          </div>
          <AdminLoadingBlock width="440px" height="14px" />
        </div>
        <div className="admin-actions">
          <AdminLoadingBlock width="160px" height="28px" borderRadius="4px" />
          <AdminLoadingBlock width="84px" height="32px" borderRadius="4px" />
        </div>
      </div>

      {/* 2. Hero Banner */}
      <section
        className="admin-hero"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "24px",
        }}
      >
        <div className="admin-hero-copy" style={{ flex: 1, maxWidth: "560px" }}>
          <AdminLoadingBlock width="170px" height="11px" />
          <div style={{ marginTop: "10px", marginBottom: "10px" }}>
            <AdminLoadingBlock width="340px" height="24px" />
          </div>
          <AdminLoadingBlock width="100%" height="14px" />
          <div style={{ marginTop: "6px", marginBottom: "16px" }}>
            <AdminLoadingBlock width="70%" height="14px" />
          </div>
          <AdminLoadingBlock width="190px" height="13px" />
        </div>
        <div style={{ flexShrink: 0 }} className="desktop-menu">
          <AdminLoadingBlock
            width="280px"
            height="160px"
            borderRadius="4px"
          />
        </div>
      </section>

      {/* 3. 4-Up Metric Cards */}
      <AdminMetricSkeleton count={4} />

      {/* 4. Split Grid: Left Recent Workspace Table + Right Pulse / Health */}
      <div className="admin-grid" style={{ marginTop: "24px" }}>
        {/* Left Column: Recent Work Table */}
        <section className="admin-panel">
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
              <AdminLoadingBlock width="180px" height="18px" />
              <div style={{ marginTop: "4px" }}>
                <AdminLoadingBlock width="140px" height="12px" />
              </div>
            </div>
            <AdminLoadingBlock width="70px" height="14px" />
          </div>

          <table className="admin-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th style={{ padding: "10px 14px" }}>
                  <AdminLoadingBlock width="90px" height="12px" />
                </th>
                <th style={{ padding: "10px 14px" }}>
                  <AdminLoadingBlock width="120px" height="12px" />
                </th>
                <th style={{ padding: "10px 14px" }}>
                  <AdminLoadingBlock width="80px" height="12px" />
                </th>
                <th style={{ padding: "10px 14px" }}>
                  <AdminLoadingBlock width="60px" height="12px" />
                </th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((idx) => (
                <tr key={idx}>
                  <td style={{ padding: "12px 14px" }}>
                    <AdminLoadingBlock width="80px" height="13px" />
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <AdminLoadingBlock width="140px" height="13px" />
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <AdminLoadingBlock width="70px" height="13px" />
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <AdminLoadingBlock width="50px" height="13px" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Right Column: Platform Health & Quick Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <section className="admin-panel">
            <div className="admin-panel-head" style={{ marginBottom: "14px" }}>
              <AdminLoadingBlock width="140px" height="18px" />
              <div style={{ marginTop: "4px" }}>
                <AdminLoadingBlock width="110px" height="12px" />
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 12px",
                    border: "1px solid var(--paper-line, #d8d0c5)",
                    borderRadius: "4px",
                  }}
                >
                  <AdminLoadingBlock width="110px" height="13px" />
                  <AdminLoadingBlock width="50px" height="18px" borderRadius="3px" />
                </div>
              ))}
            </div>
          </section>

          <section className="admin-panel">
            <div className="admin-panel-head" style={{ marginBottom: "12px" }}>
              <AdminLoadingBlock width="130px" height="16px" />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {[1, 2, 3, 4].map((idx) => (
                <AdminLoadingBlock
                  key={idx}
                  width="100px"
                  height="30px"
                  borderRadius="4px"
                />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
