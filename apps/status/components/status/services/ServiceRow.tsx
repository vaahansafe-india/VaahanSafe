"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import type { PublicServiceHistoryDto, PublicStatusServiceDto } from "@vaahansafe/status-core";
import { SERVICE_STATE_CONFIG } from "@vaahansafe/status-core";

interface ServiceRowProps {
  service: PublicStatusServiceDto;
  history?: PublicServiceHistoryDto;
  index: number;
  onSelect: (service: PublicStatusServiceDto) => void;
}

const barColor = {
  OPERATIONAL: "bg-[#48bd83] dark:bg-[#57c58d]",
  DEGRADED: "bg-[#d6a339]",
  "MAJOR OUTAGE": "bg-[#bd5a4b]",
  UNKNOWN: "bg-[#b8bec5] dark:bg-[#514f4a]",
} as const;

type HistoryDay = PublicServiceHistoryDto["days"][number];

interface DayTooltip {
  day: HistoryDay;
  left: number;
  top: number;
  below: boolean;
}

function dayStatus(day: HistoryDay): string {
  if (!day.checks) return "No checks recorded";
  if (day.failedChecks) return "Failed check recorded";
  if (day.degradedChecks) return "Degraded check recorded";
  return "Operational";
}

export function ServiceRow({ service, history, index, onSelect }: ServiceRowProps) {
  const [tooltip, setTooltip] = React.useState<DayTooltip | null>(null);
  const config = SERVICE_STATE_CONFIG[service.state] || SERVICE_STATE_CONFIG.UNKNOWN;
  const percent = history?.observedSuccessPercent;
  const recordedDays = history?.recordedDaysCount ?? 0;
  const totalChecks = history?.totalChecks ?? 0;

  const showDayTooltip = (day: HistoryDay, element: HTMLElement) => {
    const bounds = element.getBoundingClientRect();
    const below = bounds.top < 110;
    setTooltip({
      day,
      left: Math.min(Math.max(bounds.left + bounds.width / 2, 112), window.innerWidth - 112),
      top: below ? bounds.bottom + 8 : bounds.top - 8,
      below,
    });
  };

  React.useEffect(() => {
    if (!tooltip) return;
    const hide = () => setTooltip(null);
    const hideOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") hide();
    };
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    window.addEventListener("keydown", hideOnEscape);
    return () => {
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
      window.removeEventListener("keydown", hideOnEscape);
    };
  }, [tooltip]);

  return (
    <button
      type="button"
      onClick={() => onSelect(service)}
      className="group block w-full px-4 py-5 text-left transition-colors hover:bg-[#f8f4ec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#a9583e] sm:px-6 sm:py-6 dark:hover:bg-[#292620]"
      aria-label={`${service.name}, ${config.label}. ${recordedDays} ${recordedDays === 1 ? "day" : "days"} with checks in the past 90 days. Open service details.`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2 sm:items-center">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="font-mono text-[10px] text-[#a69c8f] dark:text-[#8b8172]">{String(index + 1).padStart(2, "0")}</span>
          <h3 className="font-serif text-lg leading-tight text-[#252320] group-hover:text-[#a9583e] sm:text-xl dark:text-[#f6f1e9]">{service.name}</h3>
          <span className="hidden border border-[#ddd5c9] px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider text-[#81786e] sm:inline dark:border-[#4b463d] dark:text-[#aaa297]">{service.journeyStage}</span>
        </div>
        <span className="flex shrink-0 items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] sm:text-xs" style={{ color: config.textColor }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: config.dotColor }} aria-hidden="true" />
          {config.label}
        </span>
      </div>

      <div className="mt-4 grid h-10 grid-cols-[repeat(90,minmax(0,1fr))] gap-[1px] sm:gap-[2px]" role="img" aria-label={history?.sourceAvailable ? `${recordedDays} of 90 days have recorded checks; ${percent === null || percent === undefined ? "no success percentage available" : `${percent}% of recorded checks successful`}` : "Service check history is unavailable"}>
        {history?.days.length === 90 ? history.days.map((day) => (
          <span
            key={day.date}
            className={`min-w-0 cursor-crosshair ${barColor[day.state as keyof typeof barColor] ?? barColor.UNKNOWN}`}
            onPointerEnter={(event) => showDayTooltip(day, event.currentTarget)}
            onPointerLeave={(event) => {
              if (event.pointerType !== "touch") setTooltip(null);
            }}
            onClick={(event) => {
              event.stopPropagation();
              showDayTooltip(day, event.currentTarget);
            }}
          />
        )) : Array.from({ length: 90 }, (_, day) => (
          <span key={day} className={barColor.UNKNOWN} />
        ))}
      </div>

      <div className="mt-3 flex items-center gap-3 font-mono text-[10px] text-[#756e63] dark:text-[#b2aba0]">
        <span className="shrink-0">90 days ago</span>
        <span className="h-px min-w-3 flex-1 bg-[#cfc7ba] dark:bg-[#49453e]" aria-hidden="true" />
        <span className="shrink-0 font-semibold text-[#252320] dark:text-[#f6f1e9]">
          {!history?.sourceAvailable ? "History unavailable" : percent === null || percent === undefined ? "No checks recorded" : `${percent.toFixed(2).replace(/\.00$/, "")}% observed success`}
        </span>
        <span className="h-px min-w-3 flex-1 bg-[#cfc7ba] dark:bg-[#49453e]" aria-hidden="true" />
        <span className="shrink-0">Today</span>
      </div>

      <p className="mt-2 font-mono text-[9px] text-[#93897c] dark:text-[#968f84]">
        {history?.sourceAvailable ? `${recordedDays}/90 days recorded · ${totalChecks} completed ${totalChecks === 1 ? "check" : "checks"}` : "The recorded check source could not be read"}
        {service.lastProbeAt && service.probeStatus ? ` · Latest: ${service.probeStatus}` : ""}
      </p>
      {tooltip && createPortal(
        <div
          role="tooltip"
          className="pointer-events-none fixed z-[70] w-52 rounded-sm border border-[#d8d0c5] bg-[#fffefa] px-3 py-2.5 text-left shadow-[0_12px_32px_rgba(37,35,32,0.18)] dark:border-[#514b42] dark:bg-[#292620]"
          style={{ left: tooltip.left, top: tooltip.top, transform: `translate(-50%, ${tooltip.below ? "0" : "-100%"})` }}
        >
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[#756e63] dark:text-[#b2aba0]">{tooltip.day.date} · IST</p>
          <p className="mt-1 font-serif text-sm text-[#252320] dark:text-[#f6f1e9]">{dayStatus(tooltip.day)}</p>
          <p className="mt-1 font-mono text-[10px] leading-relaxed text-[#756e63] dark:text-[#b2aba0]">
            {tooltip.day.checks
              ? `${tooltip.day.successfulChecks} successful · ${tooltip.day.degradedChecks} degraded · ${tooltip.day.failedChecks} failed`
              : "No scheduled check was recorded for this day."}
          </p>
        </div>,
        document.body,
      )}
    </button>
  );
}
