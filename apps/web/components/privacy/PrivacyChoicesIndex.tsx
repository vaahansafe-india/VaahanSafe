import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { PRIVACY_CHOICES_ITEMS } from "../../app/privacy/privacy-policy-content";

export function PrivacyChoicesIndex() {
  return (
    <div
      className="
        my-10 rounded-[20px]
        border border-border
        bg-background p-6 sm:p-8
        dark:border-white/[0.08]
        dark:bg-zinc-950
      "
    >
      <div className="flex items-center gap-3">
        <span className="font-mono text-[8px] font-medium uppercase tracking-[0.2em] text-[#cc785c]">
          Privacy Controls Index
        </span>
        <span className="h-px w-6 bg-[#cc785c]/40" />
      </div>

      <h3 className="mt-3 font-serif text-2xl font-normal tracking-[-0.02em] text-foreground sm:text-3xl dark:text-zinc-50">
        Your information should remain understandable and manageable.
      </h3>

      <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-[13px] dark:text-zinc-400">
        Use the following direct shortcuts to review or update your privacy preferences within the customer portal:
      </p>

      {/* Elegant Action Index */}
      <div className="mt-6 divide-y divide-border border-y border-border dark:divide-white/[0.08] dark:border-white/[0.08]">
        {PRIVACY_CHOICES_ITEMS.map((item) => (
          <a
            key={item.index}
            href={item.href}
            className="
              group flex items-center justify-between
              py-4 transition-colors
              hover:bg-black/[0.02] dark:hover:bg-white/[0.02]
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-[#cc785c]/30
            "
          >
            <div className="flex items-start gap-4 min-w-0 pr-4">
              <span className="font-mono text-[9px] font-semibold text-[#cc785c]">
                {item.index}
              </span>

              <div>
                <h4 className="text-sm font-medium text-foreground group-hover:text-[#cc785c] transition-colors dark:text-zinc-50">
                  {item.title}
                </h4>
                <p className="mt-0.5 text-xs text-[#71717a] dark:text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 font-mono text-[8px] uppercase tracking-[0.14em] text-muted-foreground group-hover:text-[#cc785c] transition-colors dark:text-zinc-400">
              <span className="hidden sm:inline">{item.actionLabel}</span>
              <VaahanIcon
                name={item.isExternal ? "external-link" : "arrow-right"}
                size={12}
                className="transition-transform duration-150 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
