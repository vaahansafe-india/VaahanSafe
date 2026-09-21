import * as React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { StatusRepository } from "@vaahansafe/status-core";
import { StatusHeader } from "../../../components/status/shell/StatusHeader";
import { StatusFooter } from "../../../components/status/shell/StatusFooter";
import { IncidentTimeline } from "../../../components/status/incidents/IncidentTimeline";

interface IncidentPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: IncidentPageProps): Promise<Metadata> {
  const { slug } = await params;
  const repo = new StatusRepository();
  const incident = await repo.getIncidentBySlug(slug);

  if (!incident) {
    return {
      title: "Incident Not Found — VaahanSafe Status",
    };
  }

  return {
    title: `${incident.title} — VaahanSafe Incident Report`,
    description: incident.summary,
    alternates: {
      canonical: `https://status.vaahansafe.com/incidents/${incident.slug}`,
    },
  };
}

export default async function IncidentPage({ params }: IncidentPageProps) {
  const { slug } = await params;
  const repo = new StatusRepository();
  const incident = await repo.getIncidentBySlug(slug);

  if (!incident) {
    notFound();
  }

  const isResolved = incident.state === "RESOLVED";

  return (
    <div className="flex min-h-screen flex-col bg-[#faf9f5] text-[#141413] antialiased selection:bg-[#cc785c]/20 selection:text-[#141413] dark:bg-[#181715] dark:text-[#faf9f5]">
      <StatusHeader />

      <main id="main-content" className="flex-1 w-full py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Back link */}
          <div>
            <Link
              href="/"
              className="font-mono text-xs uppercase tracking-wider text-[#6c6a64] hover:text-[#cc785c] dark:text-[#a09d96] transition-colors"
            >
              &larr; Back to System Pulse
            </Link>
          </div>

          {/* Incident Heading */}
          <div className="space-y-4 border-b border-[#e6dfd8] pb-6 dark:border-[#2e2b27]">
            <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-[0.24em]">
              <span
                className={`flex items-center gap-1.5 font-semibold ${
                  isResolved ? "text-[#5db872]" : "text-[#c64545]"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    isResolved ? "bg-[#5db872]" : "bg-[#c64545]"
                  }`}
                />
                INCIDENT / {incident.state}
              </span>
              <span className="text-[#8e8b82]">&bull;</span>
              <span className="text-[#8e8b82]">IMPACT: {incident.impact}</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-[#141413] dark:text-[#faf9f5]">
              {incident.title}
            </h1>

            <p className="font-sans text-sm sm:text-base leading-relaxed text-[#6c6a64] dark:text-[#a09d96]">
              {incident.summary}
            </p>
          </div>

          {/* Operational Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 rounded-xl border border-[#e6dfd8] bg-[#f5f0e8]/40 p-4 dark:border-[#2e2b27] dark:bg-[#1f1e1b]/40 font-mono text-xs">
            <div className="space-y-1">
              <span className="text-[9px] uppercase tracking-wider text-[#8e8b82]">
                STARTED
              </span>
              <div className="text-[#141413] dark:text-[#faf9f5]">
                {incident.startedAtFormatted}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[9px] uppercase tracking-wider text-[#8e8b82]">
                RESOLVED
              </span>
              <div className="text-[#141413] dark:text-[#faf9f5]">
                {incident.resolvedAtFormatted || "In Progress"}
              </div>
            </div>

            <div className="space-y-1 col-span-2 sm:col-span-1">
              <span className="text-[9px] uppercase tracking-wider text-[#8e8b82]">
                AFFECTED SERVICES
              </span>
              <div className="text-[#141413] dark:text-[#faf9f5]">
                {incident.affectedServiceSlugs.join(", ") || "None"}
              </div>
            </div>
          </div>

          {/* Chronological Timeline */}
          <div className="space-y-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8e8b82] dark:text-[#77736d] font-semibold border-b border-[#e6dfd8] pb-3 dark:border-[#2e2b27]">
              CHRONOLOGICAL INCIDENT TIMELINE
            </div>
            <IncidentTimeline updates={incident.updates} />
          </div>
        </div>
      </main>

      <StatusFooter />
    </div>
  );
}
