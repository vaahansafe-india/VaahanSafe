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
    return <ReportFlow {...props} initialStep={2} initialReason={reason} />;
  return (
    <section
      aria-labelledby="report-entry-title"
      className="qr-report-entry space-y-5 rounded-xl border border-border bg-card p-5 sm:p-6"
    >
      <div className="space-y-2">
        <p className="qr-label">Care, connected.</p>
        <h2 id="report-entry-title" className="font-serif text-3xl font-medium">
          How can you help?
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Choose what happened. Share a note, photos or your location, then
          review and send a WhatsApp alert. No sign-in needed.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setReason("PARKING")}
          className="qr-report-choice group"
        >
          <span className="qr-report-choice-top">
            <VaahanIcon name="car" size={22} />
            <span>Everyday help</span>
            <VaahanIcon name="arrow-right" size={18} />
          </span>
          <span className="space-y-2">
            <span className="block font-serif text-2xl font-medium">
              Parking or blocked access
            </span>
            <span className="block text-sm leading-relaxed">
              Send a WhatsApp alert to the vehicle owner.
            </span>
          </span>
          <span className="qr-report-recipient">Owner only</span>
        </button>
        <button
          type="button"
          onClick={() => setReason("EMERGENCY")}
          className="qr-report-choice qr-report-choice-emergency group"
        >
          <span className="qr-report-choice-top">
            <VaahanIcon name="alert" size={22} />
            <span>Urgent help</span>
            <VaahanIcon name="arrow-right" size={18} />
          </span>
          <span className="space-y-2">
            <span className="block font-serif text-2xl font-medium">
              Accident or emergency
            </span>
            <span className="block text-sm leading-relaxed">
              Send WhatsApp alerts to the owner and enabled emergency contacts.
            </span>
          </span>
          <span className="qr-report-recipient">
            Owner + emergency contacts
          </span>
        </button>
      </div>
      <p className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
        <VaahanIcon
          name="shield-check"
          size={18}
          className="mt-0.5 shrink-0 text-primary"
        />
        <span>
          Photos and any shared location open in a private report link that
          expires after 24 hours. The owner can revoke it earlier.
        </span>
      </p>
      <button
        type="button"
        onClick={() => setReason("OTHER")}
        className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary underline underline-offset-4"
      >
        Report another safety concern{" "}
        <VaahanIcon name="arrow-right" size={16} />
      </button>
      <div className="flex flex-wrap items-center justify-between gap-x-4 border-t border-border pt-2 text-sm text-muted-foreground">
        <a
          href="#emergency-contacts"
          className="inline-flex min-h-11 items-center gap-2 font-medium text-foreground underline underline-offset-4"
        >
          Emergency contacts <VaahanIcon name="arrow-right" size={15} />
        </a>
        <p>
          Immediate danger?{" "}
          <a
            href="tel:112"
            className="inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4"
          >
            Call 112
          </a>
          .
        </p>
      </div>
    </section>
  );
}
