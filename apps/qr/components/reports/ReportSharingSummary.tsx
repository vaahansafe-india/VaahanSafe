import { VaahanIcon } from "@vaahansafe/icons";
import type { ScanReportReason } from "@vaahansafe/qr-core";

/** Explains the recipient scope before collecting details or consent. */
export function ReportSharingSummary({ reason }: { reason: ScanReportReason }) {
  const emergency = reason === "EMERGENCY";
  return (
    <aside className="qr-report-sharing" aria-label="Report sharing details">
      <div className="flex items-start gap-3">
        <VaahanIcon
          name={emergency ? "alert" : "message"}
          size={20}
          className="mt-0.5 shrink-0 text-primary"
        />
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold">
            {emergency
              ? "WhatsApp · owner + emergency contacts"
              : "WhatsApp · vehicle owner only"}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {emergency
              ? "The owner and contacts enabled for emergency messages can receive this report. If someone is in danger, call 112 first."
              : "This report goes to the owner. Emergency contacts are not alerted for this situation."}
          </p>
        </div>
      </div>
      <div className="flex items-start gap-3 border-t border-border pt-3">
        <VaahanIcon
          name="shield-check"
          size={20}
          className="mt-0.5 shrink-0 text-primary"
        />
        <p className="text-sm leading-relaxed text-muted-foreground">
          Photos, your note and any shared location open at{" "}
          <span className="font-medium text-foreground">
            view.vaahansafe.com
          </span>
          . The private link expires after 24 hours; the owner can revoke it
          earlier. Anyone with the link can view that report until access ends.
        </p>
      </div>
    </aside>
  );
}
