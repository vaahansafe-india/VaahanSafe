"use client";

import * as React from "react";
import { SAFETY_SECTIONS, type SafetySection } from "../../app/safety-disclaimer/safety-disclaimer-content";

interface SafetyNavigationProps {
  sections?: readonly SafetySection[];
}

export function SafetyNavigation({
  sections = SAFETY_SECTIONS,
}: SafetyNavigationProps) {
  const [activeId, setActiveId] = React.useState<string>(sections[0]?.id ?? "core-disclaimer");

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-20% 0% -60% 0%",
        threshold: 0,
      }
    );

    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [sections]);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -80;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
      history.pushState(null, "", `#${id}`);
      setActiveId(id);
    }
  };

  return (
    <nav
      aria-label="Safety disclaimer document index"
      className="
        sticky top-24 hidden
        w-[260px] shrink-0
        self-start
        lg:block
      "
    >
      <div className="border-b border-border pb-3 dark:border-white/[0.08]">
        <span className="font-mono text-[6px] uppercase tracking-[0.2em] text-muted-foreground dark:text-zinc-500">
          Document Index
        </span>
        <h3 className="mt-1 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-foreground dark:text-zinc-50">
          Safety Disclaimer
        </h3>
      </div>

      <ul className="mt-4 max-h-[calc(100vh-180px)] space-y-0.5 overflow-y-auto pr-1">
        {sections.map((section) => {
          const isActive = activeId === section.id;
          return (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                onClick={(e) => scrollToSection(e, section.id)}
                aria-current={isActive ? "true" : undefined}
                className={`
                  group flex items-center justify-between
                  rounded-md px-2.5 py-1.5
                  text-xs transition-colors
                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-[#cc785c]/30
                  ${
                    isActive
                      ? "bg-black/[0.03] font-medium text-foreground dark:bg-white/[0.05] dark:text-zinc-50"
                      : "text-muted-foreground hover:text-foreground dark:text-zinc-400 dark:hover:text-zinc-50"
                  }
                `}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`
                      font-mono text-[8px] tracking-[0.12em]
                      ${
                        isActive
                          ? "text-[#cc785c] font-semibold"
                          : "text-muted-foreground/70 group-hover:text-muted-foreground dark:text-zinc-500"
                      }
                    `}
                  >
                    {section.index}
                  </span>

                  <span className="truncate">{section.shortTitle}</span>
                </div>

                {isActive && (
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#cc785c]"
                  />
                )}
              </a>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 border-t border-border pt-4 dark:border-white/[0.08]">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground dark:text-zinc-500">
          <span className="h-1 w-1 rounded-full bg-[#5db8a6]" />
          <span>{sections.length} Active Disclaimer Sections</span>
        </div>
      </div>
    </nav>
  );
}
