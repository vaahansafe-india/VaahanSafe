"use client";
import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@vaahansafe/ui/components/sheet";
import { AdminDialog } from "../../../components/AdminDialog";
import { getAdminData } from "../../../lib/client-api";
import type {
  InventoryDetail as Detail,
  InventorySelection,
} from "../inventory.types";
import { StickerPreview } from "./StickerPreview";
import { stateLabel } from "./InventoryFilters";
import { PrintDialog } from "./PrintDialog";
import { InventoryFullRecord } from "./InventoryFullRecord";
export const dateLabel = (at: string | null) =>
  at
    ? new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Kolkata",
      }).format(new Date(at))
    : "Not recorded";
function IdentityBadges({ row: r }: { row: Detail["row"] }) {
  return (
    <div className="inventory-detail-heading">
      <span className={`inventory-state state-${r.status.toLowerCase()}`}>
        {stateLabel(r.status)}
      </span>
      <span className="inventory-channel-badge">
        {r.channel === "OFFLINE_RETAIL" ? "Offline retail" : "Online system"}
      </span>
      {r.batchReference && (
        <span className="inventory-batch-badge">Batch {r.batchReference}</span>
      )}
    </div>
  );
}
export function DetailContent({
  detail,
  full = false,
  showHeading = true,
  onPrint,
  onPreview,
}: {
  detail: Detail;
  full?: boolean;
  showHeading?: boolean;
  onPrint: (s: InventorySelection) => void;
  onPreview: () => void;
}) {
  const r = detail.row;
  return (
    <div className="inventory-detail-content">
      {showHeading && <IdentityBadges row={r} />}
      <section id="physical">
        <h3>Physical sticker</h3>
        <StickerPreview detail={detail} compact={!full} />
        <div className="admin-actions">
          <button className="admin-button" onClick={onPreview}>
            Preview print
          </button>
          {(detail.eligibility.print || detail.eligibility.reprint) && (
            <button
              className="admin-button primary"
              onClick={() => onPrint({ mode: "ids", ids: [r.id] })}
            >
              {detail.eligibility.reprint
                ? "Authorize reprint"
                : "Print sticker"}
            </button>
          )}
        </div>
        {detail.eligibility.reason && (
          <p className="inventory-muted">{detail.eligibility.reason}</p>
        )}
      </section>
      <section id="overview" className="inventory-sheet-overview">
        <h3>Overview</h3>
        <dl className="inventory-record">
          <dt>VaahanSafe ID</dt>
          <dd className="inventory-val-id">{r.visibleCode}</dd>
          <dt>Public ID</dt>
          <dd className="inventory-mono">{r.publicId}</dd>
          <dt>Batch</dt>
          <dd className="inventory-val-batch">
            <span>{r.batchReference || "Not recorded"}</span>
            {r.batchReference && (
              <Link
                href={`/batches?q=${encodeURIComponent(r.batchReference)}`}
                className="inventory-record-link"
              >
                View batch ↗
              </Link>
            )}
          </dd>
          <dt>Created</dt>
          <dd>{dateLabel(r.createdAt)} IST</dd>
          <dt>Print evidence</dt>
          <dd>
            {r.printState === "RECORDED"
              ? dateLabel(r.printedAt)
              : "No recorded physical printing"}
          </dd>
          <dt>Activated</dt>
          <dd>{r.activatedAt ? dateLabel(r.activatedAt) : "Not activated"}</dd>
          {full && (
            <>
              <dt>Internal reference</dt>
              <dd className="inventory-mono">{r.id}</dd>
              <dt>Batch reference (technical)</dt>
              <dd className="inventory-mono">{r.batchId || "Not recorded"}</dd>
            </>
          )}
        </dl>
      </section>
      <section id="lifecycle" className="inventory-sheet-lifecycle">
        <h3>Lifecycle · latest 20 events</h3>
        {detail.history.length ? (
          <ol className="inventory-timeline" aria-label="Lifecycle events timeline">
            {detail.history.map((h, idx) => {
              const isLast = idx === detail.history.length - 1;
              const statusKey = h.to ? h.to.toLowerCase() : "default";
              return (
                <li
                  key={h.id}
                  className={`inventory-timeline-item state-${statusKey}`}
                  data-last={isLast ? "true" : undefined}
                >
                  <div className="inventory-timeline-track" aria-hidden="true">
                    <span className="inventory-timeline-dot" />
                    {!isLast && <span className="inventory-timeline-line" />}
                  </div>
                  <div className="inventory-timeline-body">
                    <div className="inventory-timeline-header">
                      <strong className="inventory-timeline-title">
                        {stateLabel(h.to)}
                      </strong>
                      <time
                        className="inventory-timeline-time"
                        dateTime={h.at}
                        title={`${new Date(h.at).toISOString()} UTC`}
                      >
                        {dateLabel(h.at)} IST
                      </time>
                    </div>
                    {h.reason && (
                      <span className="inventory-timeline-desc">
                        {stateLabel(h.reason)}
                      </span>
                    )}
                    {h.from && (
                      <span className="inventory-timeline-from">
                        Previous status: {stateLabel(h.from)}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="inventory-empty-state">No lifecycle events recorded.</p>
        )}
      </section>
      {full && (
        <>
          <section id="custody">
            <h3>Custody</h3>
            <p>
              {r.custodian || "No distributor or retailer custody recorded."}
            </p>
            <p>Current lifecycle: {stateLabel(r.lifecycle)}</p>
          </section>
          <section id="activation">
            <h3>Activation</h3>
            <p>
              {r.activatedAt
                ? `Activated ${dateLabel(r.activatedAt)} IST`
                : "No owner activation recorded."}
            </p>
            <p>
              {detail.activeAssignment
                ? "An active vehicle binding is recorded."
                : "No active vehicle binding recorded."}
            </p>
            {detail.attempts.map((a) => (
              <p key={a.outcome}>
                {stateLabel(a.outcome)}: {a.count}
              </p>
            ))}
          </section>
          <section id="scans">
            <h3>Scan activity</h3>
            <dl className="inventory-record">
              <dt>Total recorded scans</dt>
              <dd>{detail.scans.total}</dd>
              <dt>Last 24 hours</dt>
              <dd>{detail.scans.last24h}</dd>
              <dt>Latest scan</dt>
              <dd>{dateLabel(detail.scans.lastAt)}</dd>
            </dl>
          </section>
          <section id="security">
            <h3>Security and risk</h3>
            <p>{r.failedAttempts} failed activation attempts.</p>
            <p>
              {r.status === "BLOCKED"
                ? "Resolver access is blocked."
                : "Resolver behavior follows the server-verified lifecycle and entitlement."}
            </p>
          </section>
          <section id="replacement">
            <h3>Replacement</h3>
            <p>
              {detail.replacement
                ? `Replaced by ${detail.replacement}`
                : "No replacement link recorded."}
            </p>
          </section>
          <section id="prints">
            <h3>Print jobs · latest 10</h3>
            {detail.prints.length ? (
              detail.prints.map((j) => (
                <div key={j.id} className="inventory-audit-item">
                  <Link href={`/inventory/print-jobs/${j.id}`}>
                    {j.reference}
                  </Link>
                  <span>
                    {stateLabel(j.status)} · {j.mode} · {j.quantity} stickers
                  </span>
                  <small>
                    {dateLabel(j.createdAt)} IST · {j.reason}
                  </small>
                </div>
              ))
            ) : (
              <p>No production print jobs recorded.</p>
            )}
          </section>
          <section id="audit">
            <h3>Audit history · latest 20</h3>
            {detail.audit.length ? (
              detail.audit.map((a) => (
                <div key={a.id} className="inventory-audit-item">
                  <strong>
                    {stateLabel(a.action)} · {a.scope}
                  </strong>
                  <span>{a.reason}</span>
                  <time>{dateLabel(a.at)} IST</time>
                </div>
              ))
            ) : (
              <p>No identity or batch audit events recorded.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
export function InventoryPreview({
  id,
  onClose,
  onPrint,
}: {
  id: string;
  onClose: () => void;
  onPrint: (s: InventorySelection) => void;
}) {
  const [large, setLarge] = useState(false);
  const [returnFocus] = useState(() =>
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null,
  );
  const query = useQuery({
    queryKey: ["inventory-detail", id],
    queryFn: ({ signal }) =>
      getAdminData<Detail>(`/api/inventory/${id}`, signal),
  });
  return (
    <>
      <Sheet open onOpenChange={(v) => !v && onClose()}>
        <SheetContent
          className="inventory-preview-sheet"
          onCloseAutoFocus={(e) => {
            if (returnFocus?.isConnected) {
              e.preventDefault();
              returnFocus.focus();
            }
          }}
        >
          <header className="inventory-sheet-header">
            <span className="inventory-sheet-kicker">PHYSICAL IDENTITY</span>
            <SheetTitle className="inventory-sheet-title">
              {query.data?.row.visibleCode || "QR identity"}
            </SheetTitle>
            <SheetDescription className="inventory-sheet-subtitle">
              Quick inspection of this physical identity.
            </SheetDescription>
            {query.data && <IdentityBadges row={query.data.row} />}
          </header>
          <div
            className="inventory-preview-body"
            role="region"
            aria-label="Identity inspection details"
            tabIndex={0}
          >
            {query.isPending ? (
              <InventorySkeleton />
            ) : query.isError ? (
              <div role="alert">
                <p>{query.error.message}</p>
                <button
                  className="admin-button"
                  onClick={() => void query.refetch()}
                >
                  Try again
                </button>
              </div>
            ) : (
              <>
                <DetailContent
                  detail={query.data}
                  showHeading={false}
                  onPrint={onPrint}
                  onPreview={() => setLarge(true)}
                />
              </>
            )}
          </div>
          {query.data && !query.isError && (
            <footer className="inventory-preview-footer">
              <Link
                className="admin-button inventory-full-details-link"
                href={`/inventory/${id}`}
              >
                Open full details ↗
              </Link>
            </footer>
          )}
        </SheetContent>
      </Sheet>
      {large && query.data && (
        <AdminDialog
          title="Single-sticker print preview"
          description="Measured artwork with the private activation code concealed."
          footer={
            <button className="admin-button" onClick={() => setLarge(false)}>
              Close preview
            </button>
          }
          onClose={() => setLarge(false)}
        >
          <StickerPreview detail={query.data} actualSize />
        </AdminDialog>
      )}
    </>
  );
}
export function InventoryDetailPage({
  id,
  initial,
}: {
  id: string;
  initial: Detail | null;
}) {
  const [printing, setPrinting] = useState<InventorySelection | null>(null),
    [preview, setPreview] = useState(false);
  const query = useQuery({
    queryKey: ["inventory-detail", id],
    initialData: initial || undefined,
    queryFn: ({ signal }) =>
      getAdminData<Detail>(`/api/inventory/${id}`, signal),
  });
  return (
    <div className="inventory-workspace inventory-full-detail">
      <Link href="/inventory" className="inventory-back">
        ← QR inventory
      </Link>
      <header className="inventory-header">
        <div>
          <p className="admin-section-label">IDENTITY RECORD</p>
          <h1>{query.data?.row.visibleCode || "QR identity"}</h1>
          <p>Trace the physical credential and its server-verified history.</p>
        </div>
        <button
          className="admin-button"
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          {query.isFetching ? "Refreshing…" : "Refresh record"}
        </button>
      </header>
      {query.isPending ? (
        <InventorySkeleton />
      ) : query.isError ? (
        <div className="admin-notice error" role="alert">
          {query.error.message}
        </div>
      ) : (
        <InventoryFullRecord
          detail={query.data}
          onPrint={setPrinting}
          onPreview={() => setPreview(true)}
        />
      )}{" "}
      {printing && (
        <PrintDialog selection={printing} onClose={() => setPrinting(null)} />
      )}{" "}
      {preview && query.data && (
        <AdminDialog
          title="Single-sticker print preview"
          description="Measured artwork with the private activation code concealed."
          footer={
            <button className="admin-button" onClick={() => setPreview(false)}>
              Close preview
            </button>
          }
          onClose={() => setPreview(false)}
        >
          <StickerPreview detail={query.data} actualSize />
        </AdminDialog>
      )}
    </div>
  );
}
export function InventorySkeleton() {
  return (
    <div
      className="inventory-skeleton"
      aria-label="Loading inventory"
      role="status"
    >
      {[0, 1, 2, 3].map((i) => (
        <div key={i} />
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}
