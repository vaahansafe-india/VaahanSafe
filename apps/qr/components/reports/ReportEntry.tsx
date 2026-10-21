"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { VaahanIcon } from "@vaahansafe/icons";
import type { ScanReportReason } from "@vaahansafe/qr-core";

const ReportFlow = dynamic(
  () => import("./ScanReportForm").then((module) => module.ScanReportForm),
  {
    ssr: false,
    loading: () => (
      <p role="status" className="py-5 text-sm text-muted-foreground">
        Opening report…
      </p>
    ),
  },
);

/** Load report controls only after a scanner chooses to report a concern. */
export function ReportEntry(props: {
  publicId: string;
  siteKey: string;
  vehicleDisplay: string;
}) {
  const [reason, setReason] = useState<ScanReportReason | null>(null);
  if (reason)
    return <ReportFlow {...props} initialStep={1} initialReason={reason} />;
  return (
    <section
      aria-labelledby="report-entry-title"
      className="space-y-3 rounded-xl border border-border bg-card p-5 sm:p-6"
    >
      <p className="text-sm font-medium text-primary">Need to help?</p>
      <h2 id="report-entry-title" className="font-serif text-2xl font-semibold">
        Report a vehicle issue
      </h2>
      <p className="text-base leading-relaxed text-muted-foreground">
        Send a parking alert to the owner, or report an accident to alert the
        owner and their enabled emergency contacts. No sign-in needed.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setReason("PARKING")}
          className="flex min-h-16 items-center gap-3 rounded-lg bg-primary p-4 text-left text-primary-foreground hover:bg-primary/90"
        >
          <VaahanIcon name="car" size={22} className="shrink-0" />
          <span>
            <span className="block font-semibold">
              Parking or blocked access
            </span>
            <span className="block text-sm">Send an alert to the owner</span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => setReason("EMERGENCY")}
          className="flex min-h-16 items-center gap-3 rounded-lg border border-primary/40 bg-primary/5 p-4 text-left text-foreground hover:bg-primary/10"
        >
          <VaahanIcon
            name="alert"
            size={22}
            className="shrink-0 text-primary"
          />
          <span>
            <span className="block font-semibold">Accident or emergency</span>
            <span className="block text-sm">
              Alert the owner and emergency contacts
            </span>
          </span>
        </button>
      </div>
      <button
        type="button"
        onClick={() => setReason("OTHER")}
        className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary underline underline-offset-4"
      >
        Report another safety concern{" "}
        <VaahanIcon name="arrow-right" size={16} />
      </button>
      <p className="text-sm text-muted-foreground">
        Immediate danger?{" "}
        <a
          href="tel:112"
          className="inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4"
        >
          Call 112
        </a>
        .
      </p>
    </section>
  );
}
