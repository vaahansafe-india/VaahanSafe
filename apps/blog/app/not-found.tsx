import * as React from "react";
import Link from "next/link";
import { getPublishedArticles } from "@vaahansafe/content";
import { JournalSystemState } from "../components/system/JournalSystemState";
import { SystemStateActions } from "../components/system/SystemStateActions";

export default function JournalNotFound() {
  // Safely retrieve published stories; if D1 or content source is unavailable, fallback to empty array
  let recentStories: ReturnType<typeof getPublishedArticles> = [];
  try {
    recentStories = getPublishedArticles().slice(0, 3);
  } catch {
    recentStories = [];
  }

  return (
    <JournalSystemState
      statusCode="404"
      stateLabel="ERROR / 404 • LOST SIGNAL"
      headline={
        <>
          This story
          <br className="hidden sm:inline" /> isn&apos;t on the map.
        </>
      }
      description="The Journal page you're looking for may have moved, been unpublished, or the address may be incorrect. You can return to the publication archive or search for specific vehicle safety topics."
      railType="404"
      actions={
        <SystemStateActions
          primary={{
            label: "Back to Journal",
            href: "/",
          }}
          secondary={{
            label: "Search Journal →",
            href: "/search",
          }}
        />
      }
    >
      {recentStories.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#8e8b82] dark:text-[#77736d]">
            RECENT PUBLISHED STORIES
          </div>
          <ul className="divide-y divide-[#e6dfd8] dark:divide-[#2e2b27]">
            {recentStories.map((story) => (
              <li key={story.slug} className="py-3.5 first:pt-0 last:pb-0">
                <Link
                  href={`/articles/${story.slug}`}
                  className="group flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-4"
                >
                  <span className="font-serif text-base sm:text-lg text-[#141413] group-hover:text-[#cc785c] dark:text-[#faf9f5] dark:group-hover:text-[#cc785c] transition-colors">
                    {story.title}
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[#8e8b82] shrink-0">
                    {story.category} &bull; {story.readingTimeMinutes} MIN
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </JournalSystemState>
  );
}
