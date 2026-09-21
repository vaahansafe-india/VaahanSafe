import * as React from "react";
import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";
import { HELP_QUICK_ACTIONS } from "../../lib/help/help-content";

export function HelpQuickActions() {
  return (
    <section
      aria-labelledby="quick-actions-heading"
      className="
        border-b border-border
        bg-muted/50
        py-12 sm:py-14
        dark:border-border
        dark:bg-zinc-900/50
      "
    >
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground dark:text-zinc-500">
            <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
            <h2 id="quick-actions-heading" className="m-0 font-mono text-[9px] uppercase tracking-[0.2em]">
              Frequent Tasks &amp; Actions
            </h2>
          </div>

          <span className="font-mono text-[9px] text-muted-foreground">
            DIRECT PATHWAYS
          </span>
        </div>

        {/* Editorial Action Rows */}
        <div className="mt-6 divide-y divide-border border-t border-b border-border dark:divide-white/[0.08] dark:border-white/[0.08]">
          {HELP_QUICK_ACTIONS.map((action) => (
            <Link
              key={action.id}
              href={action.href}
              className="
                group flex flex-col justify-between gap-3 py-4.5
                transition-colors hover:bg-white/60 sm:flex-row sm:items-center sm:py-4
                dark:hover:bg-white/[0.02]
              "
            >
              <div className="flex items-center gap-4">
                {action.badge && (
                  <span className="shrink-0 rounded bg-[#cc785c]/10 px-2 py-0.5 font-mono text-[9px] font-medium tracking-wider text-[#cc785c]">
                    {action.badge}
                  </span>
                )}
                <div>
                  <div className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground group-hover:text-[#cc785c] dark:text-zinc-50 dark:group-hover:text-[#cc785c]">
                    {action.label}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground dark:text-zinc-400">
                    {action.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground group-hover:text-[#cc785c]">
                <span>Open Guide</span>
                <VaahanIcon
                  name="arrow-right"
                  size={12}
                  className="transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
