import React from "react";
import { AdminLoadingBlock } from "./AdminLoadingBlock";

export function AdminDashboardSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading operations dashboard"
      className="operations-command-center"
      style={{ pointerEvents: "none" }}
    >
      {/* 1. Command Header Skeleton */}
      <div className="command-header admin-hero">
        <div className="command-header-main">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <AdminLoadingBlock width="8px" height="8px" borderRadius="50%" />
            <AdminLoadingBlock width="170px" height="11px" />
          </div>
          <div style={{ marginBottom: "8px" }}>
            <AdminLoadingBlock width="320px" height="32px" />
          </div>
          <AdminLoadingBlock width="440px" height="13px" />
        </div>

        <div className="command-header-actions">
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <AdminLoadingBlock width="140px" height="14px" />
            <AdminLoadingBlock width="100px" height="14px" />
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <AdminLoadingBlock width="90px" height="36px" borderRadius="4px" />
            <AdminLoadingBlock width="90px" height="36px" borderRadius="4px" />
          </div>
        </div>
      </div>

      {/* 2. Operations Health Strip Skeleton */}
      <div className="operations-health-strip">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <AdminLoadingBlock width="85px" height="12px" />
          <AdminLoadingBlock width="95px" height="20px" borderRadius="3px" />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <AdminLoadingBlock width="6px" height="6px" borderRadius="50%" />
              <AdminLoadingBlock width="80px" height="12px" />
            </div>
          ))}
        </div>
        <AdminLoadingBlock width="120px" height="14px" />
      </div>

      {/* 3. 5-Metric Strip Skeleton */}
      <div className="command-metric-strip admin-metrics">
        <div className="metric-strip-grid">
          {[1, 2, 3, 4, 5].map((idx) => (
            <div key={idx} className="command-metric-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <AdminLoadingBlock width="55%" height="11px" />
                <AdminLoadingBlock width="12px" height="12px" borderRadius="2px" />
              </div>
              <div style={{ margin: "10px 0 6px" }}>
                <AdminLoadingBlock width="65%" height="26px" />
              </div>
              <AdminLoadingBlock width="80%" height="10px" />
            </div>
          ))}
        </div>
      </div>

      {/* 4. Split Grid: Activity Pulse + Needs Attention */}
      <div className="command-grid-split admin-grid">
        {/* Pulse Skeleton */}
        <section className="command-panel">
          <div className="command-panel-head">
            <AdminLoadingBlock width="180px" height="14px" />
            <AdminLoadingBlock width="60px" height="16px" borderRadius="3px" />
          </div>
          <div className="command-panel-body">
            <div style={{ marginBottom: "16px" }}>
              <AdminLoadingBlock width="100%" height="64px" borderRadius="3px" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", paddingTop: "12px" }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <AdminLoadingBlock width="50px" height="10px" />
                  <AdminLoadingBlock width="40px" height="16px" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Attention Skeleton */}
        <section className="command-panel">
          <div className="command-panel-head">
            <AdminLoadingBlock width="130px" height="14px" />
            <AdminLoadingBlock width="24px" height="18px" borderRadius="10px" />
          </div>
          <div className="command-panel-body" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[1, 2].map((i) => (
              <div
                key={i}
                style={{
                  padding: "12px 14px",
                  border: "1px solid var(--paper-line, #d8d0c5)",
                  borderRadius: "4px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                  <AdminLoadingBlock width="110px" height="13px" />
                  <AdminLoadingBlock width="190px" height="11px" />
                </div>
                <AdminLoadingBlock width="60px" height="26px" borderRadius="3px" />
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* 5. Operational Queue Skeleton */}
      <section className="command-panel">
        <div className="command-panel-head">
          <AdminLoadingBlock width="160px" height="14px" />
          <AdminLoadingBlock width="80px" height="13px" />
        </div>
        <div className="command-panel-body" style={{ padding: 0 }}>
          <table className="queue-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th style={{ padding: "10px 14px" }}><AdminLoadingBlock width="40px" height="10px" /></th>
                <th style={{ padding: "10px 14px" }}><AdminLoadingBlock width="100px" height="10px" /></th>
                <th style={{ padding: "10px 14px" }}><AdminLoadingBlock width="80px" height="10px" /></th>
                <th style={{ padding: "10px 14px" }}><AdminLoadingBlock width="60px" height="10px" /></th>
                <th style={{ padding: "10px 14px" }}><AdminLoadingBlock width="50px" height="10px" /></th>
                <th style={{ padding: "10px 14px" }}><AdminLoadingBlock width="40px" height="10px" /></th>
                <th style={{ padding: "10px 14px" }}><AdminLoadingBlock width="45px" height="10px" /></th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4].map((idx) => (
                <tr key={idx}>
                  <td style={{ padding: "11px 14px" }}><AdminLoadingBlock width="40px" height="14px" borderRadius="3px" /></td>
                  <td style={{ padding: "11px 14px" }}><AdminLoadingBlock width="120px" height="12px" /></td>
                  <td style={{ padding: "11px 14px" }}><AdminLoadingBlock width="90px" height="12px" /></td>
                  <td style={{ padding: "11px 14px" }}><AdminLoadingBlock width="65px" height="16px" borderRadius="3px" /></td>
                  <td style={{ padding: "11px 14px" }}><AdminLoadingBlock width="50px" height="12px" /></td>
                  <td style={{ padding: "11px 14px" }}><AdminLoadingBlock width="45px" height="12px" /></td>
                  <td style={{ padding: "11px 14px" }}><AdminLoadingBlock width="50px" height="12px" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 6. Split Grid: Audit Activity + Service Health */}
      <div className="command-grid-split lower-split">
        <section className="command-panel">
          <div className="command-panel-head">
            <AdminLoadingBlock width="170px" height="14px" />
            <AdminLoadingBlock width="90px" height="13px" />
          </div>
          <div className="command-panel-body" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <AdminLoadingBlock width="50px" height="11px" />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                  <AdminLoadingBlock width="120px" height="12px" />
                  <AdminLoadingBlock width="180px" height="10px" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="command-panel">
          <div className="command-panel-head">
            <AdminLoadingBlock width="160px" height="14px" />
            <AdminLoadingBlock width="75px" height="13px" />
          </div>
          <div className="command-panel-body" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 12px",
                  border: "1px solid var(--paper-line, #d8d0c5)",
                  borderRadius: "4px",
                }}
              >
                <AdminLoadingBlock width="100px" height="12px" />
                <AdminLoadingBlock width="60px" height="16px" borderRadius="3px" />
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* 7. Quick Access Skeleton */}
      <section className="command-panel">
        <div className="command-panel-head">
          <AdminLoadingBlock width="180px" height="14px" />
        </div>
        <div className="command-panel-body">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "10px" }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <AdminLoadingBlock key={i} width="100%" height="40px" borderRadius="4px" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
