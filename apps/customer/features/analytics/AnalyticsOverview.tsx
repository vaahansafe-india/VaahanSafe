"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { VaahanIcon } from "@vaahansafe/icons";
import { useCustomerScope } from "@/components/query/CustomerQueryProvider";
import { analyticsOptions } from "./queries";
import { defaultFilters } from "./filters";
import { Button } from "@/components/ui/button";
import "./analytics.css";
export function AnalyticsOverview() {
  const scope = useCustomerScope(),
    f = defaultFilters();
  const scans = useQuery(analyticsOptions(scope, "scans", f)),
    documents = useQuery(analyticsOptions(scope, "documents", f));
  const bytes = documents.data?.data.bytes;
  return (
    <div className="analytics-workspace">
      <header className="analytics-page-header">
        <div>
          <p className="analytics-eyebrow">Activity / Usage & Analytics</p>
          <h1>Your account at a glance</h1>
          <p>
            Explore QR scan activity and document storage in their dedicated
            workspaces.
          </p>
        </div>
      </header>
      <div className="grid gap-5 md:grid-cols-2">
        <section className="analytics-frame">
          <VaahanIcon name="qr-code" size={28} />
          <h2 className="analytics-chart-title mt-5">Scan Analytics</h2>
          <p className="text-muted-foreground text-sm mt-2">
            {scans.data
              ? `${scans.data.data.total} scans in the last 30 days · ${scans.data.data.successful} active safety views`
              : scans.isError
                ? "Scan summary could not be loaded."
                : "Loading scan summary…"}
          </p>
          {scans.isError && (
            <Button variant="ghost" onClick={() => void scans.refetch()}>
              Retry summary
            </Button>
          )}
          <Link
            href="/analytics/scans"
            className="mt-6 flex items-center gap-2 text-sm font-medium"
          >
            Explore scans
            <VaahanIcon name="arrow-right" size={16} />
          </Link>
        </section>
        <section className="analytics-frame">
          <VaahanIcon name="database" size={28} />
          <h2 className="analytics-chart-title mt-5">Storage Analytics</h2>
          <p className="text-muted-foreground text-sm mt-2">
            {documents.data
              ? `${documents.data.data.total} finalized documents · ${bytes !== undefined ? (bytes / 1048576).toFixed(2) + " MB of retained originals" : ""}`
              : documents.isError
                ? "Storage summary could not be loaded."
                : "Loading storage summary…"}
          </p>
          {documents.isError && (
            <Button variant="ghost" onClick={() => void documents.refetch()}>
              Retry summary
            </Button>
          )}
          <Link
            href="/analytics/storage"
            className="mt-6 flex items-center gap-2 text-sm font-medium"
          >
            Explore storage
            <VaahanIcon name="arrow-right" size={16} />
          </Link>
        </section>
      </div>
    </div>
  );
}
