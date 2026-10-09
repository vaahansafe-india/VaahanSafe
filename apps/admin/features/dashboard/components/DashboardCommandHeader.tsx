"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";

export interface DashboardCommandHeaderProps {
  greeting: string;
  operatorFirstName: string;
  formattedSyncTime: string;
  formattedSyncDate: string;
  systemStatus: "operational" | "degraded" | "attention";
  attentionCount: number;
}

export function DashboardCommandHeader({
  greeting,
  operatorFirstName,
  formattedSyncTime,
  formattedSyncDate,
  systemStatus,
  attentionCount,
}: DashboardCommandHeaderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleRefresh = () => {
    if (isPending) return;
    startTransition(() => {
      router.refresh();
    });
  };

  const statusText =
    systemStatus === "operational"
      ? "All systems operational"
      : systemStatus === "degraded"
        ? "Performance degraded"
        : `${attentionCount} item${attentionCount > 1 ? "s" : ""} require attention`;

  const statusDotClass =
    systemStatus === "operational"
      ? "status-dot-success"
      : systemStatus === "degraded"
        ? "status-dot-pending"
        : "status-dot-danger";

  return (
    <header className="command-header" aria-label="Operations Overview Header">
      <div className="command-header-main">
        <div className="command-header-eyebrow">
          <span className={`command-status-dot ${statusDotClass}`} aria-hidden="true" />
          <span className="command-eyebrow-text">Operations Command Center</span>
          <span className="command-eyebrow-divider">·</span>
          <span className="command-eyebrow-status">{statusText}</span>
        </div>
        <h1 className="command-header-title">
          {greeting}, <span className="command-header-name">{operatorFirstName}</span>.
        </h1>
        <p className="command-header-subtitle">
          Here&apos;s what needs your attention across VaahanSafe identities and workflows.
        </p>
      </div>

      <div className="command-header-actions">
        <div className="command-header-meta">
          <span className="command-meta-item" title={formattedSyncDate}>
            <VaahanIcon name="calendar" size={13} className="command-meta-icon" />
            <span>{formattedSyncDate}</span>
          </span>
          <span className="command-meta-item">
            <VaahanIcon name="clock" size={13} className="command-meta-icon" />
            <span>Synced {formattedSyncTime}</span>
          </span>
        </div>

        <div className="command-header-buttons">
          <Link
            href="/search"
            className="command-btn command-btn-secondary"
            title="Search records (Ctrl + K)"
          >
            <VaahanIcon name="search" size={14} />
            <span className="command-btn-text">Search</span>
            <kbd className="command-kbd">⌘K</kbd>
          </Link>

          <button
            type="button"
            className={`command-btn command-btn-primary ${isPending ? "is-refreshing" : ""}`}
            onClick={handleRefresh}
            disabled={isPending}
            aria-busy={isPending}
            title="Refresh dashboard data"
          >
            <VaahanIcon
              name="refresh"
              size={14}
              className={`command-refresh-icon ${isPending ? "spin-gentle" : ""}`}
            />
            <span>{isPending ? "Refreshing…" : "Refresh"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
