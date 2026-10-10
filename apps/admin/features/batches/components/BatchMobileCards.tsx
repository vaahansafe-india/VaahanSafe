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

interface BatchMobileCardsProps {
  rows: BatchItem[];
  selectedId: string | null;
  onSelectRow: (batch: BatchItem) => void;
  onGenerate: (batch: BatchItem) => void;
  onValidate: (batch: BatchItem) => void;
  onVoid: (batch: BatchItem) => void;
  canManage: boolean;
}

export function BatchMobileCards({
  rows,
  selectedId,
  onSelectRow,
  onGenerate,
  onValidate,
  onVoid,
  canManage,
}: BatchMobileCardsProps) {
  return (
    <div className="batches-mobile-list" role="feed" aria-label="Mobile batches list">
      {rows.map((row) => {
        const isSelected = row.id === selectedId;
        const statusCfg = batchStatusConfig(row.status);
        const genCount = row.generatedCount || 0;
        const pct = Math.min(100, Math.round((genCount / Math.max(1, row.quantity)) * 100));

        return (
          <article
            key={row.id}
            className={`batches-mobile-card ${isSelected ? "is-selected" : ""}`}
            onClick={(e) => {
              if ((e.target as HTMLElement).closest("a, button, [data-prevent-select]")) return;
              onSelectRow(row);
            }}
          >
            <div className="batches-mobile-card-top">
              <div className="batches-mobile-ref-info">
                <strong className="batches-mobile-ref">{row.reference}</strong>
                <span className="batches-mobile-channel">
                  {humanizeChannel(row.channel)}
                </span>
              </div>
              <div data-prevent-select>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="admin-button-icon"
                      aria-label={`Actions for ${row.reference}`}
                    >
                      ⋯
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
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
                        View in QR Inventory
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
              </div>
            </div>

            <div className="batches-mobile-card-status">
              <span className={`batches-state-badge ${statusCfg.badgeClass}`}>
                <span
                  className="batches-state-dot"
                  style={{ backgroundColor: statusCfg.dotColor }}
                />
                {statusCfg.label}
              </span>
              <span className="batches-mobile-time">
                Updated {timeAgo(row.updatedAt || row.createdAt)}
              </span>
            </div>

            <div className="batches-mobile-card-metrics">
              <div>
                <span>Identities</span>
                <strong>{formatQuantity(row.quantity)}</strong>
              </div>
              <div>
                <span>Generated</span>
                <strong>
                  {formatQuantity(genCount)} ({pct}%)
                </strong>
              </div>
              <div>
                <span>Print state</span>
                <strong>{row.printedAt ? "Printed" : "Not printed"}</strong>
              </div>
            </div>

            {row.manufacturerName && (
              <p className="batches-mobile-mfg">
                Manufacturer: {row.manufacturerName}
              </p>
            )}

            <div className="batches-mobile-card-actions">
              <button
                type="button"
                className="admin-button full-width"
                onClick={() => onSelectRow(row)}
              >
                Inspect lot details ↗
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
