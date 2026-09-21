import type { Metadata } from "next";
import * as React from "react";
import { getAllBlogPosts, getFeaturedBlogPost } from "@vaahansafe/content";
import { BlogIndexClient } from "../../components/blog/BlogIndexClient";

export const metadata: Metadata = {
  title: "Field Notes & Road Safety Guides — VaahanSafe Journal",
  description:
    "Authoritative educational essays and guides on roadside emergency response, optical QR glass placement, CMVR compliance, and vehicle privacy architecture.",
  openGraph: {
    title: "VaahanSafe Field Notes & Road Safety Journal",
    description:
      "Authoritative educational essays and guides on roadside emergency response, optical QR glass placement, CMVR compliance, and vehicle privacy architecture.",
    type: "website",
  },
};

export default function BlogIndexPage() {
  const posts = getAllBlogPosts();
  const featuredPost = getFeaturedBlogPost();

  return (
    <div className="bg-background text-foreground min-h-screen py-10 sm:py-16">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10 space-y-12">
        {/* Editorial Publication Header */}
        <div className="space-y-4 max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#cc785c] animate-pulse" />
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#cc785c] font-semibold">
              VaahanSafe &bull; Field Notes &amp; Safety Journal
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-foreground leading-[1.08]">
            Guides for the road, <br className="hidden sm:block" />
            <span className="text-[#cc785c]">the vehicle, and the identity.</span>
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Educational essays, regulatory analyses, and field protocols on roadside emergency management, optical automotive glazing, and zero-exposure vehicle identity.
          </p>

          {/* Narrative Process Step Rail */}
          <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground pt-2">
            <span className="rounded bg-muted px-2 py-0.5 border border-border/60 font-semibold text-foreground">
              01 Understand
            </span>
            <span className="text-[#cc785c]">&rarr;</span>
            <span className="rounded bg-[#cc785c]/10 text-[#cc785c] px-2 py-0.5 border border-[#cc785c]/25 font-semibold">
              02 Prepare
            </span>
            <span className="text-[#cc785c]">&rarr;</span>
            <span className="rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 border border-emerald-500/20 font-semibold">
              03 Respond Safely
            </span>
          </div>
        </div>

        {/* Client Interactive Filter & Posts Directory */}
        <BlogIndexClient initialPosts={posts} featuredPost={featuredPost} />
      </div>
    </div>
  );
}
