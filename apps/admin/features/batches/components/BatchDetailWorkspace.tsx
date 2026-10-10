"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "@vaahansafe/ui/components/sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@vaahansafe/ui/components/dropdown-menu";
import type { AdminIdentity } from "../../../lib/contracts";
import type { BatchDetail } from "../batches.types";
import {
  formatQuantity,
  humanizeChannel,
  batchStatusConfig,
  formatBatchDate,
  nextActionForBatch,
  timeAgo,
} from "../batches.presentation";
import { GenerateIdentitiesDialog } from "./GenerateIdentitiesDialog";
import { VoidBatchDialog } from "./VoidBatchDialog";

interface BatchDetailWorkspaceProps {
  identity: AdminIdentity;
  detail: BatchDetail;
}

export function BatchDetailWorkspace({
  identity,
  detail: initialDetail,
}: BatchDetailWorkspaceProps) {
  const router = useRouter();
  const [detail, setDetail] = useState<BatchDetail>(initialDetail);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [voidOpen, setVoidOpen] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const b = detail.batch;
  const statusCfg = batchStatusConfig(b.status);
  const nextAction = nextActionForBatch(b);
  const canManage = ["SUPER_ADMIN", "OPS_ADMIN"].includes(identity.role);

  const genCount = b.generatedCount || 0;
  const valCount = b.validatedCount || 0;
  const printCount = b.printedCount || 0;
  const targetQty = b.quantity;

  const refreshData = async () => {
    try {
      const res = await fetch(`/api/batches/${b.id}`);
      const data = await res.json();
      if (res.ok && data.data) {
        setDetail(data.data);
      }
    } catch {
      router.refresh();
    }
  };

  const handleStatusTransition = async (toStatus: string, reason: string) => {
    setBusyAction(toStatus);
    try {
      const res = await fetch(`/api/batches/${b.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toStatus, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Transition failed");

      toast.success(`Batch status updated to ${toStatus}`);
      await refreshData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Transition failed");
    } finally {
      setBusyAction(null);
    }
  };

  const handlePrimaryNextAction = () => {
    if (nextAction.action === "GENERATE") {
      setGenerateOpen(true);
    } else if (nextAction.action === "VALIDATE") {
      void handleStatusTransition("VALIDATED", "Validated cryptographic proofs & packaging manifest");
    } else if (nextAction.action === "APPROVE_PRINT") {
      void handleStatusTransition("PRINT_READY", "Approved for production print run");
    } else if (nextAction.action === "RECORD_PRINT") {
      void handleStatusTransition("PRINTED", "Confirmed physical print delivery from vendor");
    } else if (nextAction.action === "RECEIVE") {
      void handleStatusTransition("RECEIVED", "Verified and received into active stock");
    }
  };

  return (
    <div className="batches-full-page">
      {/* HEADER */}
      <header className="batches-full-header">
        <div>
          <div className="batches-full-title-row">
            <h1 className="batches-full-title">{b.reference}</h1>
            <span className={`batches-state-badge ${statusCfg.badgeClass}`}>
              <span
                className="batches-state-dot"
                style={{ backgroundColor: statusCfg.dotColor }}
              />
              {statusCfg.label}
            </span>
            <span
              className={`batches-channel-pill ${
                b.channel === "OFFLINE_RETAIL" ? "is-offline" : "is-online"
              }`}
            >
              {humanizeChannel(b.channel)}
            </span>
          </div>
          <p className="batches-full-subtitle">
            {formatQuantity(b.quantity)} QR identities · Registered {formatBatchDate(b.createdAt)}
          </p>
        </div>

        <div className="batches-full-header-actions">
          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="admin-button">
                  More actions ▾
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/inventory?batch=${encodeURIComponent(b.id)}`}>
                    View identities in QR Inventory
                  </Link>
                </DropdownMenuItem>

                {b.status === "DRAFT" && (
                  <DropdownMenuItem onClick={() => setGenerateOpen(true)}>
                    Generate identities
                  </DropdownMenuItem>
                )}
                {(b.status === "DRAFT" || b.status === "GENERATED") && (
                  <DropdownMenuItem onClick={() => handleStatusTransition("VALIDATED", "Manual validation")}>
                    Validate lot
                  </DropdownMenuItem>
                )}
                {b.status === "VALIDATED" && (
                  <DropdownMenuItem onClick={() => handleStatusTransition("PRINT_READY", "Approved for printing")}>
                    Approve for print
                  </DropdownMenuItem>
                )}
                {b.status === "PRINT_READY" && (
                  <DropdownMenuItem onClick={() => handleStatusTransition("PRINTED", "Physical printing confirmed")}>
                    Confirm print completion
                  </DropdownMenuItem>
                )}
                {b.status === "PRINTED" && (
                  <DropdownMenuItem onClick={() => handleStatusTransition("RECEIVED", "Received physical stock")}>
                    Receive into stock
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {!["CLOSED", "VOIDED"].includes(b.status) && (
                  <DropdownMenuItem
                    onClick={() => setVoidOpen(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    Void / quarantine lot
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {canManage && nextAction.primary && (
            <button
              type="button"
              className="admin-button primary"
              disabled={!!busyAction}
              onClick={handlePrimaryNextAction}
            >
              {busyAction ? "Updating…" : nextAction.label}
            </button>
          )}
        </div>
      </header>

      {/* MANUFACTURING STAGE PROGRESS STRIP */}
      <div className="batches-stage-strip">
        <div className="batches-stage-item">
          <span>1. GENERATION</span>
          <strong>{formatQuantity(genCount)} / {formatQuantity(targetQty)}</strong>
          <small>{genCount >= targetQty ? "✓ Complete" : "Pending"}</small>
        </div>
        <div className="batches-stage-item">
          <span>2. VALIDATION</span>
          <strong>{formatQuantity(valCount)} / {formatQuantity(targetQty)}</strong>
          <small>{b.status === "DRAFT" ? "Awaiting generation" : "✓ Verified"}</small>
        </div>
        <div className="batches-stage-item">
          <span>3. PRINT READINESS</span>
          <strong>{b.printedAt ? "Printed" : b.status === "PRINT_READY" ? "Ready" : "Pending"}</strong>
          <small>{b.printedAt ? formatBatchDate(b.printedAt).split(",")[0] : "In queue"}</small>
        </div>
        <div className="batches-stage-item">
          <span>4. INVENTORY DEPLOYMENT</span>
          <strong>{b.status === "RECEIVED" ? "Active" : "Staged"}</strong>
          <small>{b.channel === "OFFLINE_RETAIL" ? "Retail packaging" : "Direct kit fulfillment"}</small>
        </div>
      </div>

      <div className="batches-full-grid">
        {/* LEFT COLUMN: OVERVIEW & SPECS */}
        <div className="batches-full-main">
          {/* MANUFACTURING OVERVIEW */}
          <section className="batches-full-card">
            <h2>Lot overview & custody</h2>
            <dl className="batches-spec-list">
              <dt>Lot Reference</dt>
              <dd className="batches-mono">{b.reference}</dd>

              <dt>Internal ID</dt>
              <dd className="batches-mono">{b.id}</dd>

              <dt>Target Volume</dt>
              <dd>{formatQuantity(b.quantity)} physical security credentials</dd>

              <dt>Channel</dt>
              <dd>{humanizeChannel(b.channel)}</dd>

              <dt>Manufacturer</dt>
              <dd>{b.manufacturerName || "Not assigned"}</dd>

              <dt>Created Timestamp</dt>
              <dd>{formatBatchDate(b.createdAt)} IST</dd>

              <dt>Physical Print Evidence</dt>
              <dd>{b.printedAt ? `${formatBatchDate(b.printedAt)} IST` : "No physical print confirmation recorded"}</dd>

              {b.notes && (
                <>
                  <dt>Production Notes</dt>
                  <dd className="batches-notes">{b.notes}</dd>
                </>
              )}
            </dl>
          </section>

          {/* SAMPLE IDENTITIES */}
          <section className="batches-full-card">
            <div className="batches-card-header-row">
              <h2>Identities Sample (Latest {detail.stickersSample.length})</h2>
              <Link
                href={`/inventory?batch=${encodeURIComponent(b.id)}`}
                className="batches-link-btn"
              >
                Open all in QR Inventory →
              </Link>
            </div>
            {detail.stickersSample.length === 0 ? (
              <p className="batches-muted-text">
                No physical identities generated yet for this draft lot. Click "Generate identities" above.
              </p>
            ) : (
              <div className="batches-stickers-sample">
                {detail.stickersSample.map((stk) => (
                  <div key={stk.id} className="batches-sticker-sample-item">
                    <span className="batches-sticker-visible">{stk.visibleCode}</span>
                    <span className="batches-sticker-status">{stk.status}</span>
                    {stk.hasSecret && (
                      <span className="batches-sticker-secret">✓ Proof configured</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* R2 ENCRYPTED PACKAGING ARCHIVE */}
          {detail.activationExport && (
            <section className="batches-full-card">
              <h2>Encrypted Packaging Archive</h2>
              <dl className="batches-spec-list">
                <dt>Archive Storage</dt>
                <dd>Cloudflare R2 (Private bucket)</dd>

                <dt>Object Key</dt>
                <dd className="batches-mono">{detail.activationExport.objectKey}</dd>

                <dt>Secured Credentials</dt>
                <dd>{formatQuantity(detail.activationExport.codeCount)} unique activation proofs</dd>

                <dt>Checksum (SHA-256)</dt>
                <dd className="batches-mono">{detail.activationExport.ciphertextSha256}</dd>

                <dt>Generated Timestamp</dt>
                <dd>{formatBatchDate(detail.activationExport.createdAt)} IST</dd>
              </dl>
            </section>
          )}
        </div>

        {/* RIGHT COLUMN: AUDIT TRAIL */}
        <aside className="batches-full-side">
          <section className="batches-full-card">
            <h2>Manufacturing audit trail</h2>
            {detail.auditLogs.length === 0 ? (
              <p className="batches-muted-text">No audit logs recorded for this lot.</p>
            ) : (
              <ol className="batches-audit-timeline">
                {detail.auditLogs.map((log) => (
                  <li key={log.id} className="batches-audit-item">
                    <div className="batches-audit-head">
                      <strong>{log.action.replace(/_/g, " ")}</strong>
                      <time dateTime={log.createdAt}>{timeAgo(log.createdAt)}</time>
                    </div>
                    {log.reason && <p>{log.reason}</p>}
                    <small className="batches-audit-time">{formatBatchDate(log.createdAt)}</small>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </aside>
      </div>

      {/* DIALOGS */}
      <GenerateIdentitiesDialog
        batch={b}
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        onSuccess={async () => {
          toast.success("Batch identities generated successfully");
          await refreshData();
        }}
      />

      <VoidBatchDialog
        batch={b}
        open={voidOpen}
        onOpenChange={setVoidOpen}
        onSuccess={async () => {
          toast.success("Batch voided");
          await refreshData();
        }}
      />
    </div>
  );
}
