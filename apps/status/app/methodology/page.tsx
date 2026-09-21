import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { StatusHeader } from "../../components/status/shell/StatusHeader";
import { StatusFooter } from "../../components/status/shell/StatusFooter";
import { JOURNEY_STAGES } from "@vaahansafe/status-core";

export const metadata: Metadata = {
  title: "Reliability & Status Methodology — VaahanSafe Status",
  description:
    "How VaahanSafe measures service health, evaluates operational states across the customer journey, and communicates incidents.",
  alternates: {
    canonical: "https://status.vaahansafe.com/methodology",
  },
};

export default function MethodologyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#faf9f5] text-[#141413] antialiased selection:bg-[#cc785c]/20 selection:text-[#141413] dark:bg-[#181715] dark:text-[#faf9f5]">
      <StatusHeader />

      <main id="main-content" className="flex-1 w-full py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header */}
          <div className="space-y-4 border-b border-[#e6dfd8] pb-8 dark:border-[#2e2b27]">
            <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.24em] text-[#cc785c] font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
              <span>TRANSPARENCY STANDARD</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-[#141413] dark:text-[#faf9f5]">
              Status &amp; Reliability Methodology
            </h1>
            <p className="font-sans text-sm sm:text-base leading-relaxed text-[#6c6a64] dark:text-[#a09d96]">
              A public status page is an authoritative trust surface. Here is how VaahanSafe defines, evaluates, and communicates operational reliability without vanity metrics or synthetic uptime ratings.
            </p>
          </div>

          {/* Section 1: Customer Journey Topology */}
          <section className="space-y-4">
            <h2 className="font-serif text-2xl text-[#141413] dark:text-[#faf9f5]">
              1. Customer Journey Mapping vs. Infrastructure Rows
            </h2>
            <p className="font-sans text-xs sm:text-sm text-[#3d3d3a] dark:text-[#c2bfb6] leading-relaxed">
              Most status systems present an arbitrary list of internal servers, databases, or microservice components. This creates unnecessary confusion during incidents. VaahanSafe maps operational health directly across the six sequential stages of the user experience:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {JOURNEY_STAGES.map((j) => (
                <div
                  key={j.stage}
                  className="rounded-xl border border-[#e6dfd8] bg-[#f5f0e8]/40 p-4 dark:border-[#2e2b27] dark:bg-[#1f1e1b]/40 space-y-1"
                >
                  <div className="font-mono text-[9px] uppercase tracking-wider text-[#cc785c] font-semibold">
                    {j.stage} &bull; {j.label}
                  </div>
                  <div className="font-serif text-base text-[#141413] dark:text-[#faf9f5]">
                    {j.defaultServiceName}
                  </div>
                  <p className="font-sans text-xs text-[#6c6a64] dark:text-[#a09d96]">
                    {j.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Section 2: Factual Status Vocabulary */}
          <section className="space-y-4 border-t border-[#e6dfd8] pt-8 dark:border-[#2e2b27]">
            <h2 className="font-serif text-2xl text-[#141413] dark:text-[#faf9f5]">
              2. Factual Status Vocabulary
            </h2>
            <p className="font-sans text-xs sm:text-sm text-[#3d3d3a] dark:text-[#c2bfb6] leading-relaxed">
              We reject arbitrary percentage dials. Every capability evaluates to one of five unambiguous operational conditions:
            </p>

            <ul className="space-y-3 font-sans text-xs sm:text-sm text-[#6c6a64] dark:text-[#a09d96]">
              <li className="flex items-start gap-3">
                <span className="h-2 w-2 rounded-full bg-[#5db872] mt-1.5 shrink-0" />
                <div>
                  <strong className="text-[#141413] dark:text-[#faf9f5]">OPERATIONAL:</strong> All public endpoints are responding with healthy HTTP status codes and nominal latency.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="h-2 w-2 rounded-full bg-[#d4a017] mt-1.5 shrink-0" />
                <div>
                  <strong className="text-[#141413] dark:text-[#faf9f5]">DEGRADED:</strong> Service is accessible, but elevated error rates or processing queues may cause intermittent delays.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="h-2 w-2 rounded-full bg-[#c64545] mt-1.5 shrink-0" />
                <div>
                  <strong className="text-[#141413] dark:text-[#faf9f5]">PARTIAL OUTAGE:</strong> A localized subset of capability is disrupted while core emergency scan resolution remains intact.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="h-2 w-2 rounded-full bg-[#c64545] mt-1.5 shrink-0" />
                <div>
                  <strong className="text-[#141413] dark:text-[#faf9f5]">MAJOR OUTAGE:</strong> A primary capability is inaccessible or failing to route requests across India.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="h-2 w-2 rounded-full bg-[#5db8a6] mt-1.5 shrink-0" />
                <div>
                  <strong className="text-[#141413] dark:text-[#faf9f5]">MAINTENANCE:</strong> Planned infrastructure deployment announced in advance.
                </div>
              </li>
            </ul>
          </section>

          {/* Section 3: Independent Reporting Surface */}
          <section className="space-y-4 border-t border-[#e6dfd8] pt-8 dark:border-[#2e2b27]">
            <h2 className="font-serif text-2xl text-[#141413] dark:text-[#faf9f5]">
              3. Independent Reporting Architecture
            </h2>
            <p className="font-sans text-xs sm:text-sm text-[#3d3d3a] dark:text-[#c2bfb6] leading-relaxed">
              <code>status.vaahansafe.com</code> runs on an independent edge runtime decoupled from core authentication, payment, or customer app backends. Even if the customer dashboard or website suffers an outage, the status reporting surface remains online and accessible.
            </p>
          </section>

          {/* Back link */}
          <div className="pt-6 border-t border-[#e6dfd8] dark:border-[#2e2b27]">
            <Link
              href="/"
              className="inline-flex h-11 items-center rounded-full bg-[#141413] px-6 font-sans text-xs font-medium text-[#faf9f5] hover:bg-[#3d3d3a] dark:bg-[#faf9f5] dark:text-[#141413] transition-colors"
            >
              &larr; Back to System Pulse
            </Link>
          </div>
        </div>
      </main>

      <StatusFooter />
    </div>
  );
}
