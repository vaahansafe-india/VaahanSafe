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
      desc: "When a vehicle blocks a driveway, gate or another vehicle, send a parking report. The owner can receive a WhatsApp alert with your note, photos and any shared location. Emergency contacts are not alerted.",
    },
    {
      icon: "alert",
      title: "Vehicle Hazard Notice",
      tag: "Preventive Care",
      desc: "Spot a flat tyre, a fluid leak, an open window or lights left on? Share what you noticed in an owner report, with a photo if it helps explain the concern.",
    },
    {
      icon: "shield",
      title: "Emergency & First Aid Context",
      tag: "Medical Safety Relay",
      desc: "For an accident, choose Accident or emergency to queue WhatsApp alerts for the owner and enabled emergency contacts. Owner-approved safety information is also available. In immediate danger, call 112 first.",
    },
    {
      icon: "help",
      title: "Lost Property & Misplaced Items",
      tag: "Community Recovery",
      desc: "Found keys, a helmet or a bag near the vehicle? Choose another safety concern to send the owner a helpful note. Avoid including private information or unrelated people in photos.",
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
            Real life on Indian roads requires communication. VaahanSafe bridges
            vehicle owners and the public with dignity, safety, and respect for
            privacy.
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
