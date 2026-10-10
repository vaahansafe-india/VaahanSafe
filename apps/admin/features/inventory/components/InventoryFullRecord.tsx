"use client";
import Link from "next/link";
import { useState } from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import type { InventoryDetail, InventorySelection } from "../inventory.types";
import { inventoryDate } from "../inventory.presentation";
import { stateLabel } from "./InventoryFilters";
import { StickerPreview } from "./StickerPreview";

export function InventoryFullRecord({
  detail,
  onPreview,
  onPrint,
}: {
  detail: InventoryDetail;
  onPreview: () => void;
  onPrint: (s: InventorySelection) => void;
}) {
  const r = detail.row,
    t = detail.template,
    [notice, setNotice] = useState("");
  const canPrint = detail.eligibility.print || detail.eligibility.reprint;
  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setNotice(`${label} copied.`);
    } catch {
      setNotice("Copy is unavailable. Select the reference from the record.");
    }
  }
  const cardTitle = (title: string, subtitle?: string) => (
    <header className="record-card-heading">
      <h2>{title}</h2>
      {subtitle && <span>{subtitle}</span>}
    </header>
  );
  return (
    <>
      <div className="record-context">
        <span className={`inventory-state state-${r.status.toLowerCase()}`}>
          {stateLabel(r.status)}
        </span>
        <span>
          {r.channel === "OFFLINE_RETAIL" ? "Offline retail" : "Online system"}
        </span>
        <span>
          Batch <strong>{r.batchReference || "Not recorded"}</strong>
        </span>
        <span>Created {inventoryDate(r.createdAt)} IST</span>
      </div>
      <div className="record-summary" aria-label="Identity summary">
        <div>
          <span>Physical lifecycle</span>
          <strong>{stateLabel(r.lifecycle)}</strong>
          <small>
            {r.printState === "RECORDED"
              ? "Physical printing recorded"
              : "No physical printing recorded"}
          </small>
        </div>
        <div>
          <span>Owner activation</span>
          <strong>{r.activatedAt ? "Activated" : "Not activated"}</strong>
          <small>
            {detail.activeAssignment
              ? "Vehicle binding recorded"
              : "No active vehicle binding"}
          </small>
        </div>
        <div>
          <span>Scan activity</span>
          <strong>{detail.scans.total.toLocaleString("en-IN")} scans</strong>
          <small>{detail.scans.last24h} in the last 24 hours</small>
        </div>
        <div>
          <span>Activation attempts</span>
          <strong>{r.failedAttempts} failed</strong>
          <small>
            {r.status === "BLOCKED"
              ? "Resolver access blocked"
              : "Recorded security activity"}
          </small>
        </div>
      </div>
      <nav className="record-section-nav" aria-label="Identity sections">
        {[
          ["overview", "Overview"],
          ["physical", "Sticker"],
          ["lifecycle", "Lifecycle"],
          ["activation", "Activation"],
          ["scans", "Scans"],
          ["security", "Security"],
          ["prints", "Print jobs"],
          ["audit", "Audit"],
        ].map(([id, label]) => (
          <a href={`#${id}`} key={id}>
            {label}
          </a>
        ))}
      </nav>
      {notice && (
        <div className="record-copy-notice" role="status">
          {notice}
          <button
            onClick={() => setNotice("")}
            aria-label="Dismiss copy notice"
          >
            ×
          </button>
        </div>
      )}
      <div className="record-layout">
        <div className="record-main-column">
          <section className="record-card" id="overview">
            {cardTitle("Identity overview", "Public references")}
            <dl className="record-facts">
              <div>
                <dt>VaahanSafe ID</dt>
                <dd className="record-code">{r.visibleCode}</dd>
              </div>
              <div>
                <dt>Public ID</dt>
                <dd>
                  <span className="inventory-mono">{r.publicId}</span>
                  <button
                    className="record-copy"
                    onClick={() => void copy(r.publicId, "Public ID")}
                  >
                    Copy
                  </button>
                </dd>
              </div>
              <div>
                <dt>Batch</dt>
                <dd>
                  <Link
                    href={`/batches?q=${encodeURIComponent(r.batchReference || "")}`}
                  >
                    {r.batchReference || "Not recorded"}{" "}
                    <span aria-hidden="true">↗</span>
                  </Link>
                </dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>{inventoryDate(r.createdAt)} IST</dd>
              </div>
              <div>
                <dt>Print evidence</dt>
                <dd>
                  {r.printState === "RECORDED"
                    ? `${inventoryDate(r.printedAt)} IST`
                    : "No recorded physical printing"}
                </dd>
              </div>
              <div>
                <dt>Activated</dt>
                <dd>
                  {r.activatedAt
                    ? `${inventoryDate(r.activatedAt)} IST`
                    : "Awaiting owner activation"}
                </dd>
              </div>
            </dl>
            <details className="record-technical">
              <summary>Technical references</summary>
              <dl className="record-facts">
                <div>
                  <dt>Internal reference</dt>
                  <dd>
                    <span className="inventory-mono">{r.id}</span>
                    <button
                      className="record-copy"
                      onClick={() => void copy(r.id, "Internal reference")}
                    >
                      Copy
                    </button>
                  </dd>
                </div>
                <div>
                  <dt>Batch reference</dt>
                  <dd className="inventory-mono">
                    {r.batchId || "Not recorded"}
                  </dd>
                </div>
              </dl>
            </details>
          </section>
          <section className="record-card" id="lifecycle">
            {cardTitle(
              "Lifecycle history",
              `Latest ${detail.history.length} of up to 20 events`,
            )}
            {detail.history.length ? (
              <ol className="record-event-list">
                {detail.history.map((h) => (
                  <li key={h.id}>
                    <div className="record-event-dot" />
                    <div>
                      <strong>{stateLabel(h.to)}</strong>
                      <p>{stateLabel(h.reason)}</p>
                      {h.from && (
                        <small>
                          {stateLabel(h.from)} → {stateLabel(h.to)}
                        </small>
                      )}
                    </div>
                    <time>{inventoryDate(h.at)} IST</time>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="record-empty">No lifecycle events recorded.</p>
            )}
          </section>
          <div className="record-card-pair">
            <section className="record-card" id="custody">
              {cardTitle("Custody")}
              <div className="record-small-status">
                <span className="record-dot" />
                <strong>{r.custodian || "Not recorded"}</strong>
              </div>
              <p className="record-body-copy">
                {r.custodian
                  ? "Current distributor or retailer custodian."
                  : "No distributor or retailer custody has been recorded for this identity."}
              </p>
              <p className="record-footnote">
                Lifecycle: {stateLabel(r.lifecycle)}
              </p>
            </section>
            <section className="record-card" id="activation">
              {cardTitle("Owner activation")}
              <div className="record-small-status">
                <span
                  className={`record-dot ${r.activatedAt ? "positive" : ""}`}
                />
                <strong>
                  {r.activatedAt ? "Activated" : "Activation required"}
                </strong>
              </div>
              <p className="record-body-copy">
                {detail.activeAssignment
                  ? "An active vehicle binding is recorded."
                  : "No active vehicle binding recorded."}
              </p>
              {r.activatedAt && (
                <p className="record-footnote">
                  {inventoryDate(r.activatedAt)} IST
                </p>
              )}
              {detail.attempts.length > 0 && (
                <details className="record-technical">
                  <summary>Attempt outcomes</summary>
                  {detail.attempts.map((a) => (
                    <p key={a.outcome} className="record-footnote">
                      {stateLabel(a.outcome)} · {a.count}
                    </p>
                  ))}
                </details>
              )}
            </section>
          </div>
          <section className="record-card" id="security">
            {cardTitle("Security and replacement")}
            <div className="record-security-row">
              <span
                className={`record-security-count ${r.failedAttempts ? "warning" : ""}`}
              >
                {r.failedAttempts}
              </span>
              <div>
                <strong>Failed activation attempts</strong>
                <p>
                  {r.status === "BLOCKED"
                    ? "Resolver access is blocked."
                    : "Public access follows the server-verified lifecycle and service entitlement."}
                </p>
              </div>
            </div>
            <div id="replacement" className="record-replacement">
              <span>Replacement</span>
              <strong>{detail.replacement || "No replacement linked"}</strong>
            </div>
          </section>
          <section className="record-card" id="audit">
            {cardTitle("Audit trail", "Latest 20 identity and batch events")}
            {detail.audit.length ? (
              <ol className="record-audit-list">
                {detail.audit.map((a) => (
                  <li key={a.id}>
                    <div>
                      <strong>{stateLabel(a.action)}</strong>
                      <span className="record-event-scope">{a.scope}</span>
                      <p>{a.reason}</p>
                    </div>
                    <time>{inventoryDate(a.at)} IST</time>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="record-empty">
                No identity or batch audit events recorded.
              </p>
            )}
          </section>
        </div>
        <aside
          className="record-preview-column"
          aria-label="Sticker and production activity"
        >
          <section className="record-card record-physical" id="physical">
            {cardTitle("Physical sticker", `${t.widthMm} × ${t.heightMm} mm`)}
            <StickerPreview detail={detail} compact />
            <div className="record-production-status">
              <span className={`record-dot ${canPrint ? "positive" : ""}`} />
              <span>
                {canPrint
                  ? detail.eligibility.reprint
                    ? "Eligible for authorized reprint"
                    : "Eligible for first print"
                  : "Production printing unavailable"}
              </span>
            </div>
            <div className="record-print-actions">
              <button className="admin-button" onClick={onPreview}>
                Preview print
              </button>
              {canPrint && (
                <button
                  className="admin-button primary"
                  onClick={() => onPrint({ mode: "ids", ids: [r.id] })}
                >
                  <VaahanIcon name="qr" size={14} />
                  {detail.eligibility.reprint
                    ? "Authorize reprint"
                    : "Print sticker"}
                </button>
              )}
            </div>
            {detail.eligibility.reason && (
              <p className="record-footnote">{detail.eligibility.reason}</p>
            )}
            <p className="record-manufacturing-note">
              Printing does not activate this identity. Private codes appear
              only in protected production output.
            </p>
          </section>
          <section className="record-card" id="scans">
            {cardTitle("Scan activity")}
            <div className="record-scan-metrics">
              <div>
                <strong>{detail.scans.total.toLocaleString("en-IN")}</strong>
                <span>Total scans</span>
              </div>
              <div>
                <strong>{detail.scans.last24h}</strong>
                <span>Last 24 hours</span>
              </div>
            </div>
            <p className="record-footnote">
              Latest scan:{" "}
              {detail.scans.lastAt
                ? `${inventoryDate(detail.scans.lastAt)} IST`
                : "No scan recorded"}
            </p>
          </section>
          <section className="record-card" id="prints">
            {cardTitle("Production print jobs", "Latest 10")}
            {detail.prints.length ? (
              detail.prints.map((j) => (
                <div className="record-print-job" key={j.id}>
                  <Link href={`/inventory/print-jobs/${j.id}`}>
                    {j.reference} ↗
                  </Link>
                  <span className="inventory-state">
                    {stateLabel(j.status)}
                  </span>
                  <p>
                    {j.mode} · {j.quantity} stickers
                  </p>
                  <small>{inventoryDate(j.createdAt)} IST</small>
                  <p>{j.reason}</p>
                </div>
              ))
            ) : (
              <div className="record-empty">
                <VaahanIcon name="qr" size={23} />
                <strong>No print jobs yet</strong>
                <p>
                  Authorized production jobs will appear here with their outcome
                  and audit reference.
                </p>
              </div>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
