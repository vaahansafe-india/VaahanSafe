import React from "react";
import { VaahanIcon, type VaahanIconName } from "@vaahansafe/icons";

interface SituationItem {
  icon: VaahanIconName;
  title: string;
  tag: string;
  desc: string;
}

export function ScanSituations() {
  const situations: SituationItem[] = [
    {
      icon: "car",
      title: "Parked Vehicle Coordination",
      tag: "Daily Roadside Context",
      desc: "When a parked vehicle blocks a driveway, gate, or another vehicle, neighbors and security personnel can relay an urgent call without revealing the owner's personal phone number.",
    },
    {
      icon: "alert",
      title: "Vehicle Hazard Notice",
      tag: "Preventive Care",
      desc: "Passersby who spot a flat tire, active fluid leak, open window during monsoon rain, or headlights left on overnight can alert the owner in seconds.",
    },
    {
      icon: "shield",
      title: "Emergency & First Aid Context",
      tag: "Medical Safety Relay",
      desc: "In roadside accidents or acute medical incidents, emergency responders immediately discover owner-approved blood group, critical allergy notes, and priority family contacts.",
    },
    {
      icon: "help",
      title: "Lost Property & Misplaced Items",
      tag: "Community Recovery",
      desc: "Good Samaritans who discover dropped car keys, helmets, or forgotten bags near the vehicle have an authentic, safe channel to reach the verified owner.",
    },
  ];

  return (
    <section id="situations" className="qr-section">
      <div className="qr-container space-y-12">
        {/* Section Header */}
        <div className="max-w-2xl space-y-3">
          <p className="qr-label">05 / Roadside Utility</p>
          <h2 className="qr-section-title mt-3">
            When a VaahanSafe QR <br />
            is <span className="italic text-primary font-medium">scanned.</span>
          </h2>
          <p className="qr-muted mt-5 text-sm sm:text-base leading-relaxed">
            Real life on Indian roads requires communication. VaahanSafe bridges vehicle owners
            and the public with dignity, safety, and respect for privacy.
          </p>
        </div>

        {/* Situations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {situations.map((s) => (
            <div
              key={s.title}
              className="p-6 rounded border border-[var(--qr-line)] bg-[var(--qr-paper)] space-y-3 shadow-xs hover:border-[var(--qr-accent)] transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="size-10 rounded bg-[var(--qr-surface)] text-[var(--qr-accent)] flex items-center justify-center border border-[var(--qr-line)]">
                  <VaahanIcon name={s.icon} size={18} />
                </div>
                <span className="font-mono text-[10px] uppercase tracking-wider qr-muted">
                  {s.tag}
                </span>
              </div>

              <h3 className="font-serif text-xl font-medium text-foreground tracking-tight">
                {s.title}
              </h3>

              <p className="qr-muted text-xs sm:text-sm leading-relaxed">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
