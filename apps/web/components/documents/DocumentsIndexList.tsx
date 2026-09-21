import * as React from "react";
import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";
import { DOCUMENT_SECTIONS } from "../../lib/documents/documents-content";

export function DocumentsIndexList() {
  return (
    <section
      aria-labelledby="documents-index-heading"
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
          <span>Official Document Catalog</span>
        </div>

        <div className="mt-4 max-w-[760px]">
          <h2
            id="documents-index-heading"
            className="
              font-serif text-3xl font-normal tracking-[-0.03em]
              text-foreground sm:text-4xl lg:text-5xl
              dark:text-zinc-50
            "
          >
            The canonical index.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base dark:text-zinc-400">
            Select any document below to inspect complete technical specifications, statutory terms, or operational guidelines.
          </p>
        </div>

        {/* 4 Grouped Sections */}
        <div className="mt-14 space-y-16">
          {DOCUMENT_SECTIONS.map((section) => (
            <div key={section.index} className="space-y-6">
              {/* Section Header */}
              <div className="border-b border-border pb-3 dark:border-white/[0.08]">
                <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-wider">
                  <span className="text-[#cc785c]">SECTION {section.index}</span>
                  <span className="text-muted-foreground">{section.documents.length} Records</span>
                </div>
                <h3 className="mt-2 font-serif text-2xl text-foreground dark:text-zinc-50">
                  {section.title}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground dark:text-zinc-400">
                  {section.description}
                </p>
              </div>

              {/* Editorial Document Rows */}
              <div className="divide-y divide-border border-t border-b border-border dark:divide-white/[0.08] dark:border-white/[0.08]">
                {section.documents.map((doc) => {
                  const isExternal = doc.isExternal;
                  const LinkComponent = isExternal ? "a" : Link;
                  const linkProps = isExternal
                    ? { href: doc.href, target: "_blank", rel: "noopener noreferrer" }
                    : { href: doc.href };

                  return (
                    <LinkComponent
                      key={doc.id}
                      {...(linkProps as any)}
                      className="
                        group flex flex-col justify-between gap-4 py-5
                        transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:py-5
                        dark:hover:bg-white/[0.02]
                      "
                    >
                      <div className="flex items-start gap-4">
                        <span className="shrink-0 font-mono text-xs font-semibold text-muted-foreground">
                          {doc.number}
                        </span>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-serif text-lg font-medium text-foreground group-hover:text-[#cc785c] dark:text-zinc-50 dark:group-hover:text-[#cc785c]">
                              {doc.title}
                            </span>
                            <span className="rounded bg-[#e4e4e7] px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider text-muted-foreground dark:bg-white/[0.08] dark:text-zinc-400">
                              {doc.documentType}
                            </span>
                          </div>

                          <p className="mt-1 max-w-[680px] text-xs leading-relaxed text-muted-foreground dark:text-zinc-400">
                            {doc.summary}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 font-mono text-[10px] text-muted-foreground group-hover:text-[#cc785c]">
                        <span>View Document</span>
                        <VaahanIcon
                          name={isExternal ? "external-link" : "arrow-right"}
                          size={11}
                          className="transition-transform group-hover:translate-x-1"
                          aria-hidden="true"
                        />
                      </div>
                    </LinkComponent>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
