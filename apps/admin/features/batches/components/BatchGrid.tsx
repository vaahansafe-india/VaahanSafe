"use client";

import React from "react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@vaahansafe/ui/components/dropdown-menu";
import type { BatchItem } from "../batches.types";
import {
  formatQuantity,
  humanizeChannel,
  batchStatusConfig,
  formatBatchDate,
  timeAgo,
} from "../batches.presentation";

interface BatchGridProps {
  rows: BatchItem[];
  selectedId: string | null;
  onSelectRow: (batch: BatchItem) => void;
  onGenerate: (batch: BatchItem) => void;
  onValidate: (batch: BatchItem) => void;
  onVoid: (batch: BatchItem) => void;
  canManage: boolean;
}

export function BatchGrid({
  rows,
  selectedId,
  onSelectRow,
  onGenerate,
  onValidate,
  onVoid,
  canManage,
}: BatchGridProps) {
  return (
    <div className="batches-table-wrapper" role="region" aria-label="Batches manufacturing table">
      <table className="batches-table">
        <thead>
          <tr>
            <th scope="col" className="batches-th-batch">Batch</th>
            <th scope="col" className="batches-th-channel">Channel</th>
            <th scope="col" className="batches-th-qty">Identities</th>
            <th scope="col" className="batches-th-progress">Progress</th>
            <th scope="col" className="batches-th-state">State</th>
            <th scope="col" className="batches-th-print">Print</th>
            <th scope="col" className="batches-th-activity">Activity</th>
            <th scope="col" className="batches-th-actions">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isSelected = row.id === selectedId;
            const statusCfg = batchStatusConfig(row.status);
            const genCount = row.generatedCount || 0;
            const pct = Math.min(100, Math.round((genCount / Math.max(1, row.quantity)) * 100));

            return (
              <tr
                key={row.id}
                className={`batches-row ${isSelected ? "is-selected" : ""}`}
                onClick={(e) => {
                  // Do not trigger preview if clicking inside action menu or links
                  if ((e.target as HTMLElement).closest("a, button, [data-prevent-select]")) return;
                  onSelectRow(row);
                }}
              >
                {/* BATCH REFERENCE */}
                <td className="batches-cell-batch">
                  <div className="batches-ref-group">
                    <span className="batches-ref-code">{row.reference}</span>
                    <span className="batches-ref-meta">
                      Created {formatBatchDate(row.createdAt)}
                    </span>
                    {row.manufacturerName && (
                      <span className="batches-ref-mfg">{row.manufacturerName}</span>
                    )}
                  </div>
                </td>

                {/* CHANNEL */}
                <td className="batches-cell-channel">
                  <span
                    className={`batches-channel-pill ${
                      row.channel === "OFFLINE_RETAIL" ? "is-offline" : "is-online"
                    }`}
                  >
                    {humanizeChannel(row.channel)}
                  </span>
                </td>

                {/* QUANTITY */}
                <td className="batches-cell-qty">
                  <strong className="batches-qty-val">
                    {formatQuantity(row.quantity)}
                  </strong>
                </td>

                {/* PROGRESS */}
                <td className="batches-cell-progress">
                  <div className="batches-progress-group">
                    <div className="batches-progress-text">
                      <span>{formatQuantity(genCount)}</span>
                      <small> / {formatQuantity(row.quantity)}</small>
                    </div>
                    <div className="batches-progress-bar" aria-hidden="true">
                      <div
                        className="batches-progress-fill"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </td>

                {/* STATE */}
                <td className="batches-cell-state">
                  <span className={`batches-state-badge ${statusCfg.badgeClass}`}>
                    <span
                      className="batches-state-dot"
                      style={{ backgroundColor: statusCfg.dotColor }}
                    />
                    {statusCfg.label}
                  </span>
                </td>

                {/* PRINT */}
                <td className="batches-cell-print">
                  {row.printedAt ? (
                    <span className="batches-print-confirmed">
                      Printed {formatBatchDate(row.printedAt).split(",")[0]}
                    </span>
                  ) : (
                    <span className="batches-print-pending">Not printed</span>
                  )}
                </td>

                {/* ACTIVITY */}
                <td className="batches-cell-activity">
                  <time
                    dateTime={row.updatedAt || row.createdAt}
                    className="batches-activity-time"
                  >
                    {timeAgo(row.updatedAt || row.createdAt)}
                  </time>
                </td>

                {/* ROW ACTIONS */}
                <td className="batches-cell-actions" data-prevent-select>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="admin-button-icon batches-action-trigger"
                        aria-label={`Actions for batch ${row.reference}`}
                      >
                        ⋯
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="batches-action-menu">
                      <DropdownMenuItem asChild>
                        <Link href={`/batches/${row.id}`}>
                          Open full batch
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onSelectRow(row)}>
                        Quick preview
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/inventory?batch=${encodeURIComponent(row.id)}`}>
                          View identities in QR Inventory
                        </Link>
                      </DropdownMenuItem>

                      {canManage && (
                        <>
                          <DropdownMenuSeparator />
                          {row.status === "DRAFT" && (
                            <DropdownMenuItem onClick={() => onGenerate(row)}>
                              Generate identities
                            </DropdownMenuItem>
                          )}
                          {(row.status === "DRAFT" || row.status === "GENERATED") && (
                            <DropdownMenuItem onClick={() => onValidate(row)}>
                              Validate lot
                            </DropdownMenuItem>
                          )}
                          {!["CLOSED", "VOIDED"].includes(row.status) && (
                            <DropdownMenuItem
                              onClick={() => onVoid(row)}
                              className="text-destructive focus:text-destructive"
                            >
                              Void / quarantine lot
                            </DropdownMenuItem>
                          )}
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
