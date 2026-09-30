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
import { SiteHeader } from "../../../components/marketing/site-header";
import { SiteFooter } from "../../../components/marketing/site-footer";

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
    <div className="vs-page"><SiteHeader /><div className="vs-blog-main py-10 sm:py-16">
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

        {post.keyTakeaways && post.keyTakeaways.length > 0 && <aside className="vs-journal-takeaways" aria-label="Key takeaways"><span className="vs-kicker">THE ESSENTIALS</span><h2>What to take away</h2><ul>{post.keyTakeaways.map(item => <li key={item}>{item}</li>)}</ul></aside>}

        {/* Main Article Body */}
        <article className="vs-journal-article-body space-y-10 text-sm sm:text-base leading-relaxed text-foreground/90 font-sans">
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

              {section.bullets && <ul className="vs-journal-bullets">{section.bullets.map(item => <li key={item}>{item}</li>)}</ul>}
              {section.steps && <ol className="vs-journal-steps">{section.steps.map(step => <li key={step.number}><span>{step.number}</span><div><h3>{step.title}</h3><p>{step.detail}</p></div></li>)}</ol>}
              {section.subsections?.map(sub => <div className="vs-journal-subsection" key={sub.title}><h3>{sub.title}</h3>{sub.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}{sub.bullets && <ul className="vs-journal-bullets">{sub.bullets.map(item => <li key={item}>{item}</li>)}</ul>}</div>)}
              {section.table && <div className="vs-table-scroll" role="region" aria-label={section.table.caption ?? section.heading ?? "Article table"} tabIndex={0}><table className="vs-reference-table">{section.table.caption && <caption>{section.table.caption}</caption>}<thead><tr>{section.table.headers.map(header => <th scope="col" key={header}>{header}</th>)}</tr></thead><tbody>{section.table.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => cellIndex === 0 ? <th scope="row" key={cellIndex}>{cell}</th> : <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></div>}
              {section.quote && <blockquote className="vs-journal-quote"><p>{section.quote.text}</p>{section.quote.attribution && <footer>{section.quote.attribution}</footer>}</blockquote>}
              {section.figure?.url && <figure className="vs-journal-figure"><img src={section.figure.url} alt={section.figure.alt} loading="lazy" /><figcaption>{section.figure.caption}</figcaption></figure>}

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

        {post.checklist && <section className="vs-journal-checklist" aria-labelledby="article-checklist"><span className="vs-kicker">PRACTICAL CHECKLIST</span><h2 id="article-checklist">{post.checklist.title}</h2><ul>{post.checklist.items.map(item => <li key={item}>{item}</li>)}</ul></section>}
        {post.faq && post.faq.length > 0 && <section className="vs-page-faq" aria-labelledby="article-questions"><span className="vs-kicker">COMMON QUESTIONS</span><h2 id="article-questions">A few useful answers.</h2>{post.faq.map(item => <details className="vs-faq-item" key={item.question}><summary>{item.question}<span aria-hidden="true">+</span></summary><p>{item.answer}</p></details>)}</section>}

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
                  {ref.url ? <a href={ref.url} className="vs-source-link">{ref.citation} <span aria-hidden="true">↗</span></a> : <span>{ref.citation}</span>}
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
              EXPLORE THE PRODUCT
            </div>
            <h3 className="font-serif text-xl font-medium text-foreground">
              See how VaahanSafe fits your vehicle
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Learn about the physical QR, the public safety view, setup routes and optional services. Check your account for the capabilities currently available to you.
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
            <span>Explore product and plans</span>
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
    </div><SiteFooter /></div>
  );
}
