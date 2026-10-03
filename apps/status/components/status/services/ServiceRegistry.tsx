"use client";

import * as React from "react";
import Link from "next/link";
import type { PublicServiceHistoryDto, PublicStatusServiceDto } from "@vaahansafe/status-core";
import { ServiceRow } from "./ServiceRow";
import { ServiceDetailSheet } from "./ServiceDetailSheet";

interface ServiceRegistryProps {
  services: PublicStatusServiceDto[];
  histories: PublicServiceHistoryDto[];
}

export function ServiceRegistry({ services, histories }: ServiceRegistryProps) {
  const [selectedService, setSelectedService] = React.useState<PublicStatusServiceDto | null>(null);
  const historyBySlug = new Map(histories.map((history) => [history.serviceSlug, history]));

  return (
    <section aria-labelledby="service-registry-heading" className="w-full space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#d8d0c5] pb-4 dark:border-[#37342e]">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a9583e]">Services / recorded checks</p>
          <h2 id="service-registry-heading" className="mt-1 font-serif text-2xl text-[#252320] dark:text-[#f6f1e9]">The last 90 days</h2>
        </div>
        <Link href="/history" className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#3f7462] underline underline-offset-4 hover:text-[#a9583e] dark:text-[#9bd8aa]">View incident history ↗</Link>
      </div>
      <p className="max-w-3xl text-xs leading-relaxed text-[#756e63] dark:text-[#b2aba0]">Each mark represents one day of recorded Cloudflare checks. Grey means no check was recorded. Percentages describe successful recorded checks only; they do not treat missing time as uptime.</p>

      <div className="w-full overflow-hidden rounded-sm border border-[#d8d0c5] bg-[#fffefa] shadow-xs divide-y divide-[#e8e2d7] dark:border-[#37342e] dark:bg-[#211f1b] dark:divide-[#37342e]">
        {services.map((service, index) => (
          <ServiceRow
            key={service.slug}
            service={service}
            history={historyBySlug.get(service.slug)}
            index={index}
            onSelect={setSelectedService}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-2 font-mono text-[10px] text-[#756e63] dark:text-[#b2aba0]">
        <span><span className="mr-1.5 inline-block h-2 w-2 bg-[#48bd83]" />Successful</span>
        <span><span className="mr-1.5 inline-block h-2 w-2 bg-[#d6a339]" />Degraded</span>
        <span><span className="mr-1.5 inline-block h-2 w-2 bg-[#bd5a4b]" />Failed</span>
        <span><span className="mr-1.5 inline-block h-2 w-2 bg-[#b8bec5]" />Unrecorded</span>
      </div>

      <ServiceDetailSheet
        service={selectedService}
        isOpen={Boolean(selectedService)}
        onClose={() => setSelectedService(null)}
      />
    </section>
  );
}
