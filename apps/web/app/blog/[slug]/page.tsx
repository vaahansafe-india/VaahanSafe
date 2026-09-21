import * as React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";
import {
  getAllBlogPosts,
  getBlogPostBySlug,
  getRelatedBlogPosts,
} from "@vaahansafe/content";
import { ReadingProgressBar } from "../../../components/blog/ReadingProgressBar";

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const posts = getAllBlogPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) return { title: "Article Not Found — VaahanSafe" };

  return {
    title: `${post.title} — VaahanSafe Field Notes`,
    description: post.excerpt,
    openGraph: {
      title: `${post.title} — VaahanSafe`,
      description: post.excerpt,
      type: "article",
      publishedTime: post.publishedAt,
      authors: [post.author.name],
      tags: [...post.tags],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = getRelatedBlogPosts(slug, 2);

  return (
    <div className="bg-background text-foreground min-h-screen py-10 sm:py-16">
      <ReadingProgressBar />

      <main id="main-content" className="mx-auto max-w-3xl px-5 sm:px-8 space-y-12">
        {/* Navigation Breadcrumbs */}
        <nav aria-label="Breadcrumbs" className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          <Link href="/blog" className="hover:text-[#cc785c] transition-colors">
            Field Notes
          </Link>
          <span>/</span>
          <span className="text-[#cc785c] font-semibold">{post.category}</span>
          <span>&bull;</span>
          <span>{post.date}</span>
          <span>&bull;</span>
          <span>{post.readingTime}</span>
        </nav>

        {/* Article Headline */}
        <header className="space-y-6">
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal leading-[1.12] tracking-tight text-foreground">
            {post.title}
          </h1>

          {/* Author Byline */}
          <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-border/80 text-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#cc785c]/15 text-[#cc785c] font-mono text-xs font-bold">
                {post.author.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <div>
                <div className="font-medium text-foreground">{post.author.name}</div>
                <div className="text-[11px] text-muted-foreground">{post.author.role}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-md bg-muted px-2.5 py-1 font-mono text-[10px] text-muted-foreground border border-border/60">
                {post.readingTime}
              </span>
            </div>
          </div>
        </header>

        {/* Lead Intro Callout */}
        <div className="rounded-2xl border-l-4 border-[#cc785c] bg-card/60 p-5 sm:p-6 text-base sm:text-lg leading-relaxed text-foreground font-serif italic shadow-2xs">
          &ldquo;{post.intro}&rdquo;
        </div>

        {/* Main Article Body */}
        <article className="space-y-10 text-sm sm:text-base leading-relaxed text-foreground/90 font-sans">
          {post.body.map((section, idx) => (
            <section key={idx} className="space-y-4">
              {section.heading && (
                <h2 className="font-serif text-2xl sm:text-3xl font-medium text-foreground pt-4">
                  {section.heading}
                </h2>
              )}

              {section.paragraphs.map((p, pIdx) => (
                <p key={pIdx} className="leading-relaxed text-muted-foreground">
                  {p}
                </p>
              ))}

              {section.callout && (
                <div
                  className={`rounded-xl border p-4 sm:p-5 my-6 space-y-1.5 ${
                    section.callout.type === "statute"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200"
                      : section.callout.type === "warning"
                      ? "border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-200"
                      : "border-border/80 bg-muted/30 text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider font-bold">
                    <VaahanIcon
                      name={
                        section.callout.type === "warning"
                          ? "alert"
                          : section.callout.type === "statute"
                          ? "shield"
                          : "info"
                      }
                      size={14}
                    />
                    <span>{section.callout.title}</span>
                  </div>
                  <p className="text-xs sm:text-[13px] leading-relaxed opacity-95">
                    {section.callout.text}
                  </p>
                </div>
              )}
            </section>
          ))}
        </article>

        {/* References & Regulatory Citations */}
        {post.references && post.references.length > 0 && (
          <section className="rounded-2xl border border-border/80 bg-muted/20 p-5 sm:p-6 space-y-3">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#cc785c] font-semibold">
              <VaahanIcon name="document" size={14} />
              <span>Statutory References &amp; Legal Context</span>
            </div>
            <ul className="space-y-2 text-xs text-muted-foreground divide-y divide-border/40">
              {post.references.map((ref, idx) => (
                <li key={idx} className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span>{ref.citation}</span>
                  <span className="font-mono text-[10px] text-muted-foreground/80">
                    Source: {ref.source}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Article Tags */}
        <div className="flex flex-wrap items-center gap-2 pt-4">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-lg bg-card px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground border border-border/60"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Contextual Product CTA Box */}
        <div className="rounded-3xl border border-[#cc785c]/30 bg-gradient-to-br from-[#cc785c]/10 via-card to-card p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm">
          <div className="space-y-1.5 max-w-md">
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#cc785c] font-semibold">
              EQUIP YOUR VEHICLE
            </div>
            <h3 className="font-serif text-xl font-medium text-foreground">
              Protect Your Vehicle with VaahanSafe
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Industrial UV-cured optical decals with encrypted emergency contact routing, privacy-first passerby relay, and zero exposed phone numbers.
            </p>
          </div>

          <Link
            href="/pricing"
            className="
              inline-flex h-10 items-center justify-center gap-2
              rounded-xl bg-[#cc785c] px-5
              font-mono text-xs font-semibold uppercase tracking-wider
              text-white transition-all hover:bg-[#b8674d] shadow-xs shrink-0 self-start sm:self-center
            "
          >
            <span>View Safety Kits</span>
            <VaahanIcon name="arrow-right" size={13} aria-hidden="true" />
          </Link>
        </div>

        {/* Related Field Notes */}
        {relatedPosts.length > 0 && (
          <section className="pt-8 space-y-6 border-t border-border/80">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
              Related Field Notes
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {relatedPosts.map((rel) => (
                <Link
                  key={rel.slug}
                  href={`/blog/${rel.slug}`}
                  className="group rounded-2xl border border-border/70 bg-card p-5 space-y-2 hover:border-[#cc785c]/50 transition-all shadow-2xs hover:shadow-xs"
                >
                  <div className="font-mono text-[9px] uppercase tracking-wider text-[#cc785c] font-semibold">
                    {rel.category} &bull; {rel.readingTime}
                  </div>
                  <h4 className="font-serif text-base font-normal text-foreground group-hover:text-[#cc785c] transition-colors leading-snug">
                    {rel.title}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {rel.excerpt}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Back Link */}
        <div className="pt-6 text-center">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-[#cc785c] transition-colors"
          >
            <span>&larr; Return to all Field Notes</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
