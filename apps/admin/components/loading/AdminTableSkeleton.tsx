import React from "react";
import { AdminLoadingBlock } from "./AdminLoadingBlock";

export interface AdminTableSkeletonProps {
  title?: string;
  rowCount?: number;
  columnCount?: number;
}

export function AdminTableSkeleton({
  title,
  rowCount = 6,
  columnCount = 5,
}: AdminTableSkeletonProps) {
  // Preset varied widths to emulate real realistic columns
  const headerWidths = ["18%", "25%", "20%", "15%", "12%", "10%"];
  const cellWidthPatterns = [
    ["14%", "30%", "18%", "12%", "8%"],
    ["16%", "22%", "24%", "14%", "10%"],
    ["12%", "28%", "19%", "10%", "8%"],
    ["15%", "25%", "22%", "15%", "9%"],
    ["13%", "32%", "17%", "11%", "8%"],
    ["17%", "20%", "23%", "16%", "11%"],
  ];

  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={title ? `Loading ${title} records` : "Loading records"}
      className="admin-table-skeleton-container"
      style={{ pointerEvents: "none" }}
    >
      {/* Page Heading Skeleton */}
      <div className="admin-page-heading" style={{ marginBottom: "20px" }}>
        <div>
          <AdminLoadingBlock width="110px" height="12px" />
          <div style={{ marginTop: "8px", marginBottom: "8px" }}>
            <AdminLoadingBlock width="260px" height="28px" />
          </div>
          <AdminLoadingBlock width="380px" height="14px" />
        </div>
        <div className="admin-actions">
          <AdminLoadingBlock width="84px" height="32px" borderRadius="4px" />
          <AdminLoadingBlock width="98px" height="32px" borderRadius="4px" />
        </div>
      </div>

      {/* Table Panel with Search/Filter Toolbar */}
      <section className="admin-panel">
        {/* Toolbar */}
        <div
          className="admin-toolbar"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 16px",
            borderBottom: "1px solid var(--paper-line, #d8d0c5)",
          }}
        >
          <AdminLoadingBlock width="260px" height="32px" borderRadius="4px" />
          <AdminLoadingBlock width="140px" height="32px" borderRadius="4px" />
          <AdminLoadingBlock width="72px" height="32px" borderRadius="4px" />
        </div>

        {/* Table structure */}
        <div className="admin-table-scroll">
          <table className="admin-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                {Array.from({ length: columnCount }).map((_, cIdx) => (
                  <th key={cIdx} style={{ padding: "10px 14px" }}>
                    <AdminLoadingBlock
                      width={headerWidths[cIdx % headerWidths.length] || "80px"}
                      height="12px"
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rowCount }).map((_, rIdx) => {
                const rowWidths = cellWidthPatterns[rIdx % cellWidthPatterns.length] || [];
                return (
                  <tr key={rIdx}>
                    {Array.from({ length: columnCount }).map((_, cIdx) => (
                      <td key={cIdx} style={{ padding: "12px 14px" }}>
                        <AdminLoadingBlock
                          width={rowWidths[cIdx % rowWidths.length] || "70%"}
                          height="14px"
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer pagination skeleton */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 16px",
            borderTop: "1px solid var(--paper-line, #d8d0c5)",
          }}
        >
          <AdminLoadingBlock width="130px" height="12px" />
          <div style={{ display: "flex", gap: "6px" }}>
            <AdminLoadingBlock width="64px" height="28px" borderRadius="4px" />
            <AdminLoadingBlock width="64px" height="28px" borderRadius="4px" />
          </div>
        </div>
      </section>
    </div>
  );
}
