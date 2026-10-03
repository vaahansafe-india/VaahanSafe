"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { PublicSystemStatusDto } from "@vaahansafe/status-core";

type Heartbeat = NonNullable<PublicSystemStatusDto["databaseHeartbeat"]>;

const stateStyle = {
  OPERATIONAL: "border-[#c9dfd0] bg-[#eff7f0] text-[#216441] dark:border-[#31533d] dark:bg-[#1b3024] dark:text-[#9bd8aa]",
  DEGRADED: "border-[#ead8ae] bg-[#fcf5e6] text-[#865b1c] dark:border-[#644e2a] dark:bg-[#302719] dark:text-[#efc878]",
  UNKNOWN: "border-[#dedbd3] bg-[#f2f0eb] text-[#706d65] dark:border-[#45423c] dark:bg-[#292722] dark:text-[#b5b1a8]",
} as const;

function StatusBadge({ state }: { state: Heartbeat["status"] }) {
  const normalized = state === "OPERATIONAL" ? "OPERATIONAL" : state === "DEGRADED" ? "DEGRADED" : "UNKNOWN";
  return (
    <span className={`inline-flex items-center gap-2 rounded-sm border px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] ${stateStyle[normalized]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {normalized === "OPERATIONAL" ? "Healthy" : normalized === "DEGRADED" ? "Needs attention" : "Unconfirmed"}
    </span>
  );
}

function formatCheckedAt(value: string | null): string {
  if (!value || !Number.isFinite(Date.parse(value))) return "No completed run recorded";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value)) + " IST";
}

export function InfrastructureMonitor({ heartbeat }: { heartbeat?: Heartbeat }) {
  const router = useRouter();
  const [refreshing, startTransition] = React.useTransition();
  const databaseState = heartbeat?.databaseStatus ?? "UNKNOWN";
  const cronState = heartbeat?.cronStatus ?? "UNKNOWN";

  return (
    <section aria-labelledby="infrastructure-heading" className="overflow-hidden rounded-sm border border-[#ddd7ca] bg-[#fffefa] dark:border-[#37342e] dark:bg-[#211f1b]">
      <div className="border-b border-[#e8e2d7] px-5 py-5 sm:px-7 sm:py-6 dark:border-[#37342e]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#ad674c]">Infrastructure / scheduled verification</p>
            <h2 id="infrastructure-heading" className="font-serif text-2xl leading-tight text-[#24221e] sm:text-3xl dark:text-[#f6f1e9]">Database &amp; scheduled checks</h2>
            <p className="max-w-2xl text-sm leading-relaxed text-[#69645b] dark:text-[#b2aba0]">
              Cloudflare runs a database check every 10 minutes. The latest recorded check and a fresh Supabase read are shown separately.
            </p>
          </div>
          <button
            type="button"
            onClick={() => startTransition(() => router.refresh())}
            disabled={refreshing}
            className="rounded-sm border border-[#d8d1c4] bg-white px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-[#514b42] transition-colors hover:border-[#ad674c] hover:text-[#914e37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ad674c] disabled:opacity-60 dark:border-[#4b463d] dark:bg-[#292620] dark:text-[#d4cbbd]"
          >
            {refreshing ? "Checking…" : "Refresh checks"}
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2">
        <div className="border-b border-[#e8e2d7] p-5 sm:p-7 md:border-b-0 md:border-r dark:border-[#37342e]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8b8172]">01 / Supabase database</p>
            <StatusBadge state={databaseState} />
          </div>
          <p className="mt-5 font-serif text-xl text-[#24221e] dark:text-[#f6f1e9]">{databaseState === "OPERATIONAL" ? "Responding to live reads" : databaseState === "DEGRADED" ? "Read could not be confirmed" : "Check not configured"}</p>
          <p className="mt-2 text-sm leading-relaxed text-[#69645b] dark:text-[#b2aba0]">A server-side request reads the latest heartbeat directly from Supabase.</p>
          <div className="mt-6 border-t border-[#ece6db] pt-4 font-mono text-[11px] text-[#756e63] dark:border-[#37342e] dark:text-[#b2aba0]">
            Current read time <span className="float-right font-semibold text-[#24221e] dark:text-[#f6f1e9]">{heartbeat?.latencyMs != null && databaseState === "OPERATIONAL" ? `${heartbeat.latencyMs} ms` : "Unavailable"}</span>
          </div>
        </div>

        <div className="p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8b8172]">02 / Cloudflare Cron</p>
            <StatusBadge state={cronState} />
          </div>
          <p className="mt-5 font-serif text-xl text-[#24221e] dark:text-[#f6f1e9]">{cronState === "OPERATIONAL" ? "Recent run recorded" : cronState === "DEGRADED" ? "Scheduled run is overdue" : "Run could not be confirmed"}</p>
          <p className="mt-2 text-sm leading-relaxed text-[#69645b] dark:text-[#b2aba0]">The Worker records a successful database round trip after each scheduled run.</p>
          <dl className="mt-6 space-y-3 border-t border-[#ece6db] pt-4 font-mono text-[11px] dark:border-[#37342e]">
            <div className="flex flex-wrap justify-between gap-2"><dt className="text-[#756e63] dark:text-[#b2aba0]">Last completed run</dt><dd className="font-semibold text-[#24221e] dark:text-[#f6f1e9]">{formatCheckedAt(heartbeat?.checkedAt ?? null)}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-[#756e63] dark:text-[#b2aba0]">Database round trip</dt><dd className="font-semibold text-[#24221e] dark:text-[#f6f1e9]">{heartbeat?.scheduledLatencyMs != null ? `${heartbeat.scheduledLatencyMs} ms` : "Unavailable"}</dd></div>
          </dl>
        </div>
      </div>
      <div className="border-t border-[#e8e2d7] bg-[#f9f6ef] px-5 py-3 text-xs leading-relaxed text-[#756e63] sm:px-7 dark:border-[#37342e] dark:bg-[#292620] dark:text-[#b2aba0]">
        A run is marked overdue after 25 minutes without a successful recorded check. A healthy database read does not hide a missed Cron run.
      </div>
    </section>
  );
}
