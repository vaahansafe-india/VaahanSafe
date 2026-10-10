import type { ReactNode } from "react";
import { VaahanIcon } from "@vaahansafe/icons";

export function ProjectionBoundary({ children }: { children: ReactNode }) {
  return (
    <section
      aria-labelledby="public-safety-heading"
      className="space-y-5 border-b border-border py-1 pb-6"
    >
      <div>
        <h2
          id="public-safety-heading"
          className="font-serif text-2xl font-semibold"
        >
          Public safety information
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Only information approved by the vehicle owner is shown.
        </p>
      </div>
      <div className="grid min-w-0 gap-x-5 gap-y-5 min-[360px]:grid-cols-2">
        {children}
      </div>
      <p className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
        <VaahanIcon name="info" size={17} className="mt-0.5 shrink-0" />
        Information is provided by the vehicle owner and may not be medically
        verified.
      </p>
    </section>
  );
}
