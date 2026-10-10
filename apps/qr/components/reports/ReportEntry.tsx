"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { VaahanIcon } from "@vaahansafe/icons";

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
  const [started, setStarted] = useState(false);
  if (started) return <ReportFlow {...props} initialStep={1} />;
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
        Share useful information with the owner. No sign-in needed.
      </p>
      <button
        type="button"
        onClick={() => setStarted(true)}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-base font-semibold text-primary-foreground hover:bg-primary/90 sm:w-auto"
      >
        Report an issue <VaahanIcon name="arrow-right" size={18} />
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
