import * as React from "react";
import { getWebUrl } from "@vaahansafe/config";
import { IdentitySignal } from "../signal/IdentitySignal";

export function VaahanSafeConnection() {
  const webUrl = getWebUrl();

  return (
    <section
      aria-label="About VaahanSafe"
      className="w-full border-b border-[#e6dfd8] py-16 sm:py-24 dark:border-[#2e2b27]"
    >
      <div className="w-full px-4 sm:px-6 md:px-10 lg:px-14 xl:px-20 2xl:px-28">
        <div className="max-w-3xl space-y-6">
          {/* Micro-Label */}
          <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#8e8b82] dark:text-[#77736d]">
            ABOUT / VAAHANSAFE
          </div>

          {/* Statement */}
          <h3 className="font-serif text-3xl sm:text-4xl lg:text-[3.25rem] font-normal leading-[1.05] tracking-[-0.03em] text-[#141413] dark:text-[#faf9f5]">
            A safety identity for the vehicle <br className="hidden sm:inline" />
            you already use every day.
          </h3>

          {/* Description */}
          <p className="font-sans text-sm sm:text-base leading-relaxed text-[#6c6a64] dark:text-[#a09d96]">
            Connecting motorists with verified emergency contacts, bystander relays, and immediate roadside assistance without displaying personal phone numbers or paper visiting cards on windshields.
          </p>

          {/* Identity Signal Line */}
          <div className="pt-2 pb-4">
            <IdentitySignal />
          </div>

          {/* Restrained Link */}
          <div>
            <a
              href={webUrl}
              className="group inline-flex items-center gap-1.5 font-mono text-xs font-medium uppercase tracking-wider text-[#141413] transition-colors hover:text-[#cc785c] dark:text-[#faf9f5] dark:hover:text-[#cc785c]"
            >
              <span>Explore VaahanSafe Platform</span>
              <span
                className="inline-block transition-transform duration-200 group-hover:translate-x-1"
                aria-hidden="true"
              >
                ↗
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
