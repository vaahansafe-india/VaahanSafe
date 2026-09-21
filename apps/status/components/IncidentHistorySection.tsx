import React from "react";

interface IncidentHistorySectionProps {
  incidents?: Array<{
    id: string;
    title: string;
    status: string;
    impact: string;
    createdAt: string;
  }>;
}

export function IncidentHistorySection({
  incidents = [],
}: IncidentHistorySectionProps) {
  return (
    <section className="mt-12 rounded-xl border border-[#E8E6DF] bg-white p-6 md:p-8">
      <div className="flex items-center justify-between pb-4 border-b border-[#F0EFEA]">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#8A8984]">
            ARCHIVE
          </span>
          <h2 className="font-serif text-xl font-medium text-[#141413] mt-0.5">
            Incident History
          </h2>
        </div>
        <span className="text-xs font-mono text-[#8A8984]">
          Past 90 Days
        </span>
      </div>

      <div className="py-8 text-center">
        {incidents.length === 0 ? (
          <p className="text-sm font-sans text-[#666660]">
            No incidents have been published for this period.
          </p>
        ) : (
          <ul className="divide-y divide-[#F0EFEA] text-left">
            {incidents.map((incident) => (
              <li key={incident.id} className="py-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-[#141413]">{incident.title}</h4>
                  <span className="text-xs font-mono text-[#8A8984]">{incident.status}</span>
                </div>
                <p className="text-xs text-[#666660] mt-1">{incident.impact}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
