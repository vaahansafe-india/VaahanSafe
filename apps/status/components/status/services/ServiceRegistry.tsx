"use client";

import * as React from "react";
import type { PublicStatusServiceDto } from "@vaahansafe/status-core";
import { ServiceRow } from "./ServiceRow";
import { ServiceDetailSheet } from "./ServiceDetailSheet";

interface ServiceRegistryProps {
  services: PublicStatusServiceDto[];
}

export function ServiceRegistry({ services }: ServiceRegistryProps) {
  const [selectedService, setSelectedService] = React.useState<PublicStatusServiceDto | null>(null);

  return (
    <section aria-labelledby="service-registry-heading" className="w-full space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e6dfd8] pb-4 dark:border-[#2e2b27]">
        <h2
          id="service-registry-heading"
          className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8e8b82] dark:text-[#77736d] font-semibold"
        >
          SERVICES / CURRENT CONDITION
        </h2>
        <span className="font-mono text-[9px] uppercase tracking-wider text-[#8e8b82]">
          CLICK ROW FOR CAPABILITY SCOPE
        </span>
      </div>

      <div className="divide-y divide-[#e6dfd8] dark:divide-[#2e2b27] border-t border-[#e6dfd8] dark:border-[#2e2b27]">
        {services.map((service, index) => (
          <ServiceRow
            key={service.slug}
            service={service}
            index={index}
            onSelect={setSelectedService}
          />
        ))}
      </div>

      <ServiceDetailSheet
        service={selectedService}
        isOpen={Boolean(selectedService)}
        onClose={() => setSelectedService(null)}
      />
    </section>
  );
}
