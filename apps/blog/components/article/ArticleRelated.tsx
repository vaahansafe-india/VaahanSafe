import * as React from "react";
import Link from "next/link";
import { BlogPost } from "@vaahansafe/content";

interface ArticleRelatedProps {
  articles: readonly BlogPost[];
}

export function ArticleRelated({ articles }: ArticleRelatedProps) {
  if (articles.length === 0) return null;

  return (
    <section aria-label="Related Journal Stories" className="pt-10 border-t border-[#e6dfd8] dark:border-[#2e2b27] space-y-6">
      <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#8e8b82]">
        CONTINUE / JOURNAL
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {articles.map((story) => (
          <Link
            key={story.slug}
            href={`/articles/${story.slug}`}
            className="
              group block rounded-2xl border border-[#e6dfd8]
              bg-[#f5f0e8]/40 p-6 space-y-2.5 transition-all
              hover:border-[#cc785c]/40 hover:bg-[#f5f0e8]/80 hover:shadow-xs
              dark:border-[#2e2b27] dark:bg-[#1f1e1b]/40 dark:hover:bg-[#1f1e1b]/80
            "
          >
            <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-wider text-[#8e8b82]">
              <span className="text-[#cc785c] font-semibold">{story.category}</span>
              <span>{story.readingTime}</span>
            </div>

            <h3 className="font-serif text-lg sm:text-xl font-normal text-[#141413] dark:text-[#faf9f5] group-hover:text-[#cc785c] transition-colors leading-snug">
              {story.title}
            </h3>

            <p className="text-xs text-[#6c6a64] dark:text-[#a09d96] line-clamp-2">
              {story.excerpt}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
