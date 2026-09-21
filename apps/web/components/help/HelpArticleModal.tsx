"use client";

import * as React from "react";
import { useEffect } from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { HelpArticle } from "../../lib/help/help-content";

interface HelpArticleModalProps {
  article: HelpArticle | null;
  onClose: () => void;
}

export function HelpArticleModal({ article, onClose }: HelpArticleModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (article) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [article, onClose]);

  if (!article) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="article-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#09090b]/60 backdrop-blur-sm transition-opacity dark:bg-black/80"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div
        className="
          relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col
          overflow-hidden rounded-2xl border border-border
          bg-background shadow-2xl
          dark:border-white/[0.12] dark:bg-zinc-950
        "
      >
        {/* Sticky Header */}
        <div className="flex items-center justify-between border-b border-border bg-background px-6 py-4 dark:border-white/[0.08] dark:bg-zinc-950">
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
            <span>HELP / {article.categoryTitle}</span>
            <span>&bull;</span>
            <span className="text-[#cc785c]">ARTICLE / {article.articleNumber}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="
              flex h-8 w-8 items-center justify-center rounded-md
              text-muted-foreground transition-colors hover:bg-muted hover:text-foreground
              dark:hover:bg-white/[0.08] dark:hover:text-white
            "
            aria-label="Close guide"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto px-6 py-8 sm:px-10">
          <h2
            id="article-modal-title"
            className="font-serif text-3xl font-normal tracking-tight text-foreground sm:text-4xl dark:text-zinc-50"
          >
            {article.title}
          </h2>

          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base dark:text-zinc-400">
            {article.summary}
          </p>

          {/* Before you start */}
          {article.beforeYouStart && article.beforeYouStart.length > 0 && (
            <div className="mt-8 rounded-xl border border-border bg-muted/70 p-5 dark:border-white/[0.08] dark:bg-zinc-900">
              <div className="font-mono text-[9px] uppercase tracking-wider text-[#cc785c]">
                Before You Start
              </div>
              <ul className="mt-2 space-y-1.5 text-xs text-[#3f3f46] dark:text-zinc-400">
                {article.beforeYouStart.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-0.5 text-[#cc785c]">&bull;</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* What you need */}
          {article.whatYouNeed && article.whatYouNeed.length > 0 && (
            <div className="mt-4 rounded-xl border border-border bg-muted/70 p-5 dark:border-white/[0.08] dark:bg-zinc-900">
              <div className="font-mono text-[9px] uppercase tracking-wider text-[#5db8a6]">
                What You Need
              </div>
              <ul className="mt-2 space-y-1.5 text-xs text-[#3f3f46] dark:text-zinc-400">
                {article.whatYouNeed.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-0.5 text-[#5db8a6]">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Numbered Steps */}
          <div className="mt-10">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Resolution Steps
            </div>

            <div className="mt-4 space-y-4">
              {article.steps.map((step) => (
                <div
                  key={step.stepNumber}
                  className="rounded-xl border border-border bg-white p-5 dark:border-white/[0.08] dark:bg-zinc-900"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#cc785c]/15 font-mono text-[10px] font-bold text-[#cc785c]">
                      {step.stepNumber}
                    </span>
                    <h3 className="font-serif text-lg text-foreground dark:text-zinc-50">
                      {step.title}
                    </h3>
                  </div>
                  <p className="mt-2 pl-9 text-xs leading-relaxed text-muted-foreground sm:text-sm dark:text-zinc-400">
                    {step.instruction}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* What happens next */}
          <div className="mt-8 rounded-xl border border-border bg-white p-5 dark:border-white/[0.08] dark:bg-zinc-900">
            <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
              What Happens Next
            </div>
            <p className="mt-2 text-xs leading-relaxed text-[#3f3f46] sm:text-sm dark:text-zinc-400">
              {article.whatHappensNext}
            </p>
          </div>

          {/* Related Help */}
          {article.relatedHelp.length > 0 && (
            <div className="mt-8 border-t border-border pt-6 dark:border-white/[0.08]">
              <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                Related Documentation &amp; Help
              </div>
              <div className="mt-3 flex flex-wrap gap-3">
                {article.relatedHelp.map((rel, idx) => (
                  <a
                    key={idx}
                    href={rel.href}
                    className="
                      inline-flex items-center gap-1.5 rounded-lg border border-border
                      bg-muted px-3 py-1.5 font-mono text-[10px] text-foreground
                      transition-colors hover:border-[#cc785c]
                      dark:border-white/[0.1] dark:bg-zinc-900 dark:text-zinc-50
                    "
                  >
                    <span>{rel.title}</span>
                    <VaahanIcon name="arrow-right" size={10} aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
