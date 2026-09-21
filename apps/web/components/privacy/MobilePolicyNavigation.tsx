"use client";

import * as React from "react";
import {
  Button,
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@vaahansafe/ui/components";
import { VaahanIcon } from "@vaahansafe/icons";
import { POLICY_SECTIONS, type PolicySection } from "../../app/privacy/privacy-policy-content";

interface MobilePolicyNavigationProps {
  sections?: readonly PolicySection[];
}

export function MobilePolicyNavigation({
  sections = POLICY_SECTIONS,
}: MobilePolicyNavigationProps) {
  const [open, setOpen] = React.useState(false);

  const scrollToSection = (id: string) => {
    setOpen(false);
    // Give time for sheet exit animation then scroll
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        const yOffset = -76;
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: "smooth" });
        history.pushState(null, "", `#${id}`);
      }
    }, 150);
  };

  return (
    <div className="sticky top-16 z-30 flex items-center justify-between border-b border-border bg-background/95 px-5 py-3 backdrop-blur-md lg:hidden dark:border-border dark:bg-zinc-950/95">
      <div className="flex items-center gap-2 font-mono text-[7px] uppercase tracking-[0.16em] text-muted-foreground dark:text-zinc-400">
        <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
        <span>Privacy Policy</span>
        <span className="text-muted-foreground/70 dark:text-zinc-500">•</span>
        <span>{sections.length} Sections</span>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 rounded-full border-border px-3 font-mono text-[8px] uppercase tracking-[0.14em] text-foreground hover:border-[#cc785c] hover:text-[#cc785c] dark:border-zinc-700 dark:text-zinc-50"
          >
            <span>Browse sections</span>
            <VaahanIcon name="chevron-down" size={10} aria-hidden="true" />
          </Button>
        </SheetTrigger>

        <SheetContent
          side="bottom"
          className="
            max-h-[85vh] overflow-y-auto
            rounded-t-[20px]
            border-t border-border
            bg-background
            p-6
            dark:border-border
            dark:bg-zinc-950
          "
        >
          <SheetHeader className="text-left">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
              <SheetTitle className="font-mono text-xs uppercase tracking-[0.18em] text-foreground dark:text-zinc-50">
                Policy Navigation
              </SheetTitle>
            </div>
            <SheetDescription className="font-mono text-[7px] uppercase tracking-[0.14em] text-muted-foreground dark:text-zinc-500">
              Jump directly to any section
            </SheetDescription>
          </SheetHeader>

          <hr className="my-4 border-border dark:border-white/[0.08]" />

          <nav aria-label="Mobile policy sections index" className="flex flex-col gap-1">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => scrollToSection(section.id)}
                className="
                  flex items-center justify-between
                  rounded-md px-3 py-2.5 text-left text-xs
                  text-[#3f3f46] transition-colors
                  hover:bg-black/[0.03] hover:text-[#cc785c]
                  dark:text-zinc-200 dark:hover:bg-white/[0.04]
                "
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[8px] tracking-[0.12em] text-muted-foreground/70 dark:text-zinc-500">
                    {section.index}
                  </span>
                  <span className="font-medium">{section.shortTitle}</span>
                </div>

                <VaahanIcon
                  name="arrow-right"
                  size={12}
                  className="text-muted-foreground/70 dark:text-zinc-500"
                  aria-hidden="true"
                />
              </button>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
