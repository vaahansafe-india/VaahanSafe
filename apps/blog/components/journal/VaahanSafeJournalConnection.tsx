import * as React from "react";
import { getWebUrl } from "@vaahansafe/config";

export function VaahanSafeJournalConnection() {
  const webUrl = getWebUrl();

  return (
    <section
      aria-label="About VaahanSafe"
      className="py-14 sm:py-20"
    >
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl space-y-4">
          {/* Label */}
          <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#8e8b82] dark:text-[#77736d]">
            ABOUT VAAHANSAFE
          </div>

          {/* Large Serif Statement */}
          <h3 className="font-serif text-2xl font-normal leading-snug text-[#141413] sm:text-3xl dark:text-[#faf9f5]">
            A permanent QR-based safety identity <br className="hidden sm:inline" />
            for your vehicle.
          </h3>

          {/* Restrained Explanation */}
          <p className="font-sans text-sm leading-relaxed text-[#6c6a64] sm:text-base dark:text-[#a09d96]">
            Connecting motorists with verified emergency contacts and bystander relays without displaying personal phone numbers or paper visiting cards on windshields.
          </p>

          {/* Editorial Link (No aggressive CTA) */}
          <div className="pt-2">
            <a
              href={webUrl}
              className="group inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-[#141413] transition-colors hover:text-[#cc785c] dark:text-[#faf9f5] dark:hover:text-[#cc785c]"
            >
              <span>Learn about VaahanSafe</span>
              <span
                className="inline-block transition-transform duration-200 group-hover:translate-x-1"
                aria-hidden="true"
              >
                &rarr;
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
