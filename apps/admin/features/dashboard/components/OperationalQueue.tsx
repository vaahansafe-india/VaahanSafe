"use client";

import React, { useState } from "react";
import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";
import { getStatusSemantic } from "../presentation";
import type { DashboardQueueItem } from "../types";

export interface OperationalQueueProps {
  items: DashboardQueueItem[];
}

export function OperationalQueue({ items }: OperationalQueueProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <section className="command-panel queue-panel" aria-label="Operational Work Queue">
      <div className="command-panel-head">
        <div className="panel-head-title-wrap">
          <h2 className="command-panel-title">OPERATIONAL QUEUE</h2>
          <span className="panel-head-subtitle">Recent records requiring workflow action</span>
        </div>
        <Link href="/orders" className="panel-action-link">
          <span>View all orders</span>
          <VaahanIcon name="arrow-right" size={13} />
        </Link>
      </div>

      <div className="queue-container">
        {items.length === 0 ? (
          <div className="queue-empty-state">
            <VaahanIcon name="file" size={26} />
            <h3>No pending operational items</h3>
            <p>New orders, disputes, and transactions will queue here automatically.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="queue-table-wrap desktop-only">
              <table className="queue-table" role="table">
                <thead>
                  <tr>
                    <th scope="col" style={{ width: "12%" }}>TYPE</th>
                    <th scope="col" style={{ width: "24%" }}>REFERENCE</th>
                    <th scope="col" style={{ width: "18%" }}>CONTEXT</th>
                    <th scope="col" style={{ width: "16%" }}>STATE</th>
                    <th scope="col" style={{ width: "12%" }}>TOTAL</th>
                    <th scope="col" style={{ width: "10%" }}>AGE</th>
                    <th scope="col" style={{ width: "8%", textAlign: "right" }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => {
                    const statusMeta = getStatusSemantic(row.state);
                    const isCopied = copiedId === row.id;

                    return (
                      <tr key={row.id} className="queue-table-row">
                        <td className="queue-cell-type">
                          <span className="queue-type-pill">{row.type}</span>
                        </td>
                        <td className="queue-cell-ref">
                          <div className="queue-ref-group">
                            <span
                              className="queue-ref-text"
                              title={row.rawReference}
                            >
                              {row.reference}
                            </span>
                            <button
                              type="button"
                              className="queue-copy-btn"
                              title={isCopied ? "Copied!" : "Copy full reference"}
                              onClick={() => handleCopy(row.id, row.rawReference)}
                              aria-label={`Copy reference ${row.rawReference}`}
                            >
                              <VaahanIcon
                                name={isCopied ? "check" : "copy"}
                                size={12}
                              />
                            </button>
                          </div>
                        </td>
                        <td className="queue-cell-context">
                          <span className="queue-context-text">{row.context}</span>
                        </td>
                        <td className="queue-cell-state">
                          <span className={statusMeta.badgeClass}>
                            <span
                              className={`status-dot ${statusMeta.dotClass}`}
                              aria-hidden="true"
                            />
                            <span>{row.state}</span>
                          </span>
                        </td>
                        <td className="queue-cell-amount">
                          <span className="queue-amount-text">
                            {row.amountFormatted ?? "—"}
                          </span>
                        </td>
                        <td className="queue-cell-age">
                          <span className="queue-age-text" title={row.timestamp}>
                            {row.age}
                          </span>
                        </td>
                        <td className="queue-cell-action">
                          <Link
                            href={row.actionHref}
                            className="queue-action-link"
                            aria-label={`${row.actionLabel} for ${row.rawReference}`}
                          >
                            <span>Review</span>
                            <VaahanIcon name="arrow-right" size={12} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (< 768px) */}
            <div className="queue-cards-wrap mobile-only">
              {items.map((row) => {
                const statusMeta = getStatusSemantic(row.state);
                const isCopied = copiedId === row.id;

                return (
                  <div key={row.id} className="queue-mobile-card">
                    <div className="queue-mobile-card-top">
                      <div className="queue-ref-group">
                        <span className="queue-type-pill">{row.type}</span>
                        <span className="queue-ref-text">{row.reference}</span>
                        <button
                          type="button"
                          className="queue-copy-btn"
                          title={isCopied ? "Copied!" : "Copy reference"}
                          onClick={() => handleCopy(row.id, row.rawReference)}
                          aria-label={`Copy reference ${row.rawReference}`}
                        >
                          <VaahanIcon
                            name={isCopied ? "check" : "copy"}
                            size={12}
                          />
                        </button>
                      </div>
                      <span className={statusMeta.badgeClass}>
                        <span
                          className={`status-dot ${statusMeta.dotClass}`}
                          aria-hidden="true"
                        />
                        <span>{row.state}</span>
                      </span>
                    </div>

                    <div className="queue-mobile-card-mid">
                      <span className="queue-mobile-context">{row.context}</span>
                      <div className="queue-mobile-meta">
                        {row.amountFormatted && (
                          <strong className="queue-mobile-amount">
                            {row.amountFormatted}
                          </strong>
                        )}
                        <span className="queue-mobile-age" title={row.timestamp}>
                          {row.age}
                        </span>
                      </div>
                    </div>

                    <div className="queue-mobile-card-bottom">
                      <Link
                        href={row.actionHref}
                        className="queue-mobile-action-btn"
                      >
                        <span>Review record</span>
                        <VaahanIcon name="arrow-right" size={13} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
