import * as React from "react";
import { COMPARISON_ROWS } from "../../app/pricing/plans-config";

export function PlanComparisonTable() {
  const categories = Array.from(new Set(COMPARISON_ROWS.map((r) => r.category)));

  return (
    <section
      aria-labelledby="comparison-heading"
      className="
        border-b border-border
        bg-background
        py-16 sm:py-20 lg:py-24
        dark:border-border
        dark:bg-zinc-950
      "
    >
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10">
        <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground dark:text-zinc-500">
          <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
          <span>05 / Detailed Comparison</span>
        </div>

        <div className="mt-4 max-w-[720px]">
          <h2
            id="comparison-heading"
            className="
              font-serif text-3xl font-normal tracking-[-0.03em]
              text-foreground sm:text-4xl
              dark:text-zinc-50
            "
          >
            Side-by-side feature architecture.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base dark:text-zinc-400">
            Every plan operates around the same verifiable vehicle identity. Capabilities scale based on notification immediacy, contact density, and enterprise fleet governance.
          </p>
        </div>

        {/* Desktop Comparison Table */}
        <div className="mt-12 hidden overflow-hidden rounded-2xl border border-border bg-white lg:block dark:border-white/[0.08] dark:bg-zinc-900">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/80 font-mono text-[10px] uppercase tracking-wider text-foreground dark:border-white/[0.08] dark:bg-zinc-900 dark:text-zinc-50">
                <th scope="col" className="p-5 w-2/5">Capability / Requirement</th>
                <th scope="col" className="p-5 w-1/5">Essential Safety</th>
                <th scope="col" className="p-5 w-1/5 text-[#cc785c]">Active Protection</th>
                <th scope="col" className="p-5 w-1/5">Fleet & Commercial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0eae1] dark:divide-white/[0.06] text-xs">
              {categories.map((category) => {
                const rows = COMPARISON_ROWS.filter((r) => r.category === category);
                return (
                  <React.Fragment key={category}>
                    <tr className="bg-background font-mono text-[9px] uppercase tracking-wider text-muted-foreground dark:bg-zinc-950">
                      <td colSpan={4} className="px-5 py-2.5 font-semibold">
                        {category}
                      </td>
                    </tr>
                    {rows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-muted/30 dark:hover:bg-white/[0.02]">
                        <td className="p-5 font-medium text-foreground dark:text-zinc-50">
                          {row.name}
                        </td>
                        <td className="p-5 text-muted-foreground dark:text-zinc-400">
                          {row.essential}
                        </td>
                        <td className="p-5 font-medium text-foreground dark:text-zinc-50">
                          {row.active}
                        </td>
                        <td className="p-5 text-muted-foreground dark:text-zinc-400">
                          {row.fleet}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked Cards */}
        <div className="mt-8 space-y-6 lg:hidden">
          {categories.map((category) => {
            const rows = COMPARISON_ROWS.filter((r) => r.category === category);
            return (
              <div
                key={category}
                className="overflow-hidden rounded-xl border border-border bg-white p-5 dark:border-white/[0.08] dark:bg-zinc-900"
              >
                <div className="font-mono text-[9px] uppercase tracking-wider text-[#cc785c]">
                  {category}
                </div>

                <div className="mt-4 divide-y divide-[#f0eae1] dark:divide-white/[0.06]">
                  {rows.map((row, idx) => (
                    <div key={idx} className="py-3 text-xs">
                      <div className="font-medium text-foreground dark:text-zinc-50">
                        {row.name}
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-2 font-mono text-[10px]">
                        <div>
                          <span className="block text-muted-foreground">Essential</span>
                          <span className="text-[#3f3f46] dark:text-zinc-400">{row.essential}</span>
                        </div>
                        <div>
                          <span className="block text-[#cc785c]">Active</span>
                          <span className="text-foreground font-medium dark:text-zinc-50">{row.active}</span>
                        </div>
                        <div>
                          <span className="block text-muted-foreground">Fleet</span>
                          <span className="text-[#3f3f46] dark:text-zinc-400">{row.fleet}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
