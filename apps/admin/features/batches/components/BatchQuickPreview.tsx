"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@vaahansafe/ui/components/sheet";
import { getAdminData } from "../../../lib/client-api";
import type { BatchItem, BatchDetail } from "../batches.types";
import {
  formatQuantity,
  humanizeChannel,
  batchStatusConfig,
  formatBatchDate,
  nextActionForBatch,
  timeAgo,
} from "../batches.presentation";

interface BatchQuickPreviewProps {
  batch: BatchItem | null;
  onClose: () => void;
  onGenerate: (batch: BatchItem) => void;
  onValidate: (batch: BatchItem) => void;
  onVoid: (batch: BatchItem) => void;
  canManage: boolean;
}

export function BatchQuickPreview({
  batch,
  onClose,
  onGenerate,
  onValidate,
  onVoid,
  canManage,
}: BatchQuickPreviewProps) {
  const query = useQuery({
    queryKey: ["batch-detail", batch?.id],
    queryFn: ({ signal }) =>
      getAdminData<BatchDetail>(`/api/batches/${batch?.id}`, signal),
    enabled: !!batch?.id,
  });

  if (!batch) return null;

  const detail = query.data;
  const currentBatch = detail?.batch || batch;
  const statusCfg = batchStatusConfig(currentBatch.status);
  const nextAction = nextActionForBatch(currentBatch);

  const genCount = currentBatch.generatedCount || 0;
  const valCount = currentBatch.validatedCount || 0;
  const printCount = currentBatch.printedCount || 0;
  const targetQty = currentBatch.quantity;

  const handleNextActionClick = () => {
    if (nextAction.action === "GENERATE") {
      onGenerate(currentBatch);
    } else if (nextAction.action === "VALIDATE") {
      onValidate(currentBatch);
    }
  };

  return (
    <Sheet open={!!batch} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="batches-preview-sheet">
        <header className="batches-sheet-header">
          <span className="batches-sheet-kicker">MANUFACTURING LOT</span>
          <SheetTitle className="batches-sheet-title">
            {currentBatch.reference}
          </SheetTitle>
          <SheetDescription className="batches-sheet-subtitle">
            Controlled physical identity manufacturing batch.
          </SheetDescription>
          <div className="batches-sheet-badges">
            <span className={`batches-state-badge ${statusCfg.badgeClass}`}>
              <span
                className="batches-state-dot"
                style={{ backgroundColor: statusCfg.dotColor }}
              />
              {statusCfg.label}
            </span>
            <span
              className={`batches-channel-pill ${
                currentBatch.channel === "OFFLINE_RETAIL"
                  ? "is-offline"
                  : "is-online"
              }`}
            >
              {humanizeChannel(currentBatch.channel)}
            </span>
          </div>
        </header>

        <div className="batches-preview-body" role="region" aria-label="Batch details">
          {/* PROGRESS & CAPACITY */}
          <section className="batches-detail-section">
            <h3 className="batches-detail-heading">Volume & Progress</h3>
            <div className="batches-metric-grid">
              <div className="batches-metric-box">
                <span>Lot Volume</span>
                <strong>{formatQuantity(targetQty)}</strong>
                <small>identities</small>
              </div>
              <div className="batches-metric-box">
                <span>Generated</span>
                <strong>{formatQuantity(genCount)}</strong>
                <small>
                  {Math.min(100, Math.round((genCount / Math.max(1, targetQty)) * 100))}%
                </small>
              </div>
              <div className="batches-metric-box">
                <span>Validated</span>
                <strong>{formatQuantity(valCount)}</strong>
                <small>
                  {Math.min(100, Math.round((valCount / Math.max(1, targetQty)) * 100))}%
                </small>
              </div>
              <div className="batches-metric-box">
                <span>Printed</span>
                <strong>{formatQuantity(printCount)}</strong>
                <small>{currentBatch.printedAt ? "Confirmed" : "Pending"}</small>
              </div>
            </div>
          </section>

          {/* CONTEXTUAL NEXT ACTION CALLOUT */}
          {canManage && (
            <section className="batches-action-callout">
              <div className="batches-action-callout-text">
                <span className="batches-action-callout-kicker">NEXT REQUIRED ACTION</span>
                <strong>{nextAction.label}</strong>
                <p>{nextAction.detail}</p>
              </div>
              {nextAction.primary && (
                <button
                  type="button"
                  className="admin-button primary"
                  onClick={handleNextActionClick}
                >
                  {nextAction.label}
                </button>
              )}
            </section>
          )}

          {/* MANUFACTURING SPECIFICATIONS */}
          <section className="batches-detail-section">
            <h3 className="batches-detail-heading">Manufacturing Specs</h3>
            <dl className="batches-spec-list">
              <dt>Batch Reference</dt>
              <dd className="batches-mono">{currentBatch.reference}</dd>

              <dt>Batch ID (internal)</dt>
              <dd className="batches-mono">{currentBatch.id}</dd>

              <dt>Inventory Channel</dt>
              <dd>{humanizeChannel(currentBatch.channel)}</dd>

              <dt>Manufacturer Partner</dt>
              <dd>{currentBatch.manufacturerName || "Not assigned"}</dd>

              <dt>Created Timestamp</dt>
              <dd>{formatBatchDate(currentBatch.createdAt)}</dd>

              <dt>Physical Print Date</dt>
              <dd>{currentBatch.printedAt ? formatBatchDate(currentBatch.printedAt) : "No print confirmation recorded"}</dd>

              {currentBatch.notes && (
                <>
                  <dt>Production Notes</dt>
                  <dd className="batches-notes">{currentBatch.notes}</dd>
                </>
              )}

              {detail?.activationExport && (
                <>
                  <dt>Encrypted Archive</dt>
                  <dd className="batches-archive-pill">
                    ✓ {formatQuantity(detail.activationExport.codeCount)} codes encrypted in R2
                  </dd>
                </>
              )}
            </dl>
          </section>

          {/* SAMPLE IDENTITIES */}
          {detail?.stickersSample && detail.stickersSample.length > 0 && (
            <section className="batches-detail-section">
              <h3 className="batches-detail-heading">
                Identities Sample (Latest {detail.stickersSample.length})
              </h3>
              <div className="batches-stickers-sample">
                {detail.stickersSample.slice(0, 8).map((stk) => (
                  <div key={stk.id} className="batches-sticker-sample-item">
                    <span className="batches-sticker-visible">{stk.visibleCode}</span>
                    <span className="batches-sticker-status">{stk.status}</span>
                    {stk.hasSecret && (
                      <span className="batches-sticker-secret" title="Activation proof hash configured">
                        ✓ Hash
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <div className="batches-sample-link-wrap">
                <Link
                  href={`/inventory?batch=${encodeURIComponent(currentBatch.id)}`}
                  className="batches-sample-link"
                >
                  View all {formatQuantity(genCount)} identities in QR Inventory →
                </Link>
              </div>
            </section>
          )}

          {/* AUDIT & RECENT ACTIVITY */}
          {detail?.auditLogs && detail.auditLogs.length > 0 && (
            <section className="batches-detail-section">
              <h3 className="batches-detail-heading">Manufacturing Activity</h3>
              <ol className="batches-audit-timeline">
                {detail.auditLogs.map((log) => (
                  <li key={log.id} className="batches-audit-item">
                    <div className="batches-audit-head">
                      <strong>{log.action.replace(/_/g, " ")}</strong>
                      <time dateTime={log.createdAt}>{timeAgo(log.createdAt)}</time>
                    </div>
                    {log.reason && <p>{log.reason}</p>}
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>

        <footer className="batches-preview-footer">
          <Link
            className="admin-button batches-full-link"
            href={`/batches/${currentBatch.id}`}
          >
            Open full batch workspace ↗
          </Link>
        </footer>
      </SheetContent>
    </Sheet>
  );
}
