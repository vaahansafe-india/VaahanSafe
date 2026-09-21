import * as React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";
import { BlogHeader } from "../../../components/BlogHeader";
import { BlogFooter } from "../../../components/BlogFooter";
import { BLOG_POSTS, ArticlePost } from "../../../lib/blog-data";

interface PostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) return { title: "Not Found" };

  return {
    title: `${post.title} — VaahanSafe Field Notes`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
    },
  };
}

export default async function BlogPostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) notFound();

  const relatedArticles = post.relatedSlugs
    .map((rSlug) => BLOG_POSTS.find((p) => p.slug === rSlug))
    .filter((p): p is ArticlePost => Boolean(p));

  return (
    <div className="flex min-h-screen flex-col bg-[#faf9f5] text-[#141413] antialiased selection:bg-[#cc785c]/20 selection:text-[#141413] dark:bg-[#181715] dark:text-[#faf9f5]">
      <BlogHeader />

      <main id="main-content" className="flex-1 py-12 sm:py-16 lg:py-20">
        <article className="mx-auto max-w-[700px] px-5 sm:px-8">
          {/* Breadcrumb / Category Metadata */}
          <div className="flex flex-wrap items-center gap-3 font-mono text-[9px] uppercase tracking-[0.2em] text-[#8e8b82]">
            <Link href="/" className="hover:text-[#cc785c] transition-colors">
              FIELD NOTES
            </Link>
            <span>/</span>
            <span className="text-[#cc785c]">{post.category}</span>
            <span>&bull;</span>
            <span>{post.date}</span>
            <span>&bull;</span>
            <span>{post.readingTime}</span>
          </div>

          {/* Large Serif Headline */}
          <h1 className="mt-6 font-serif text-3xl font-normal leading-[1.08] tracking-[-0.03em] text-[#141413] sm:text-4xl md:text-5xl dark:text-[#faf9f5]">
            {post.title}
          </h1>

          {/* Lead Intro Paragraph */}
          <p className="mt-6 text-base leading-relaxed text-[#3d3d3a] sm:text-lg sm:leading-8 dark:text-[#a09d96]">
            {post.intro}
          </p>

          <div className="my-10 h-px w-full bg-[#ded7cf] dark:bg-white/[0.08]" />

          {/* Article Body Sections */}
          <div className="space-y-8 text-sm leading-relaxed text-[#3d3d3a] sm:text-base sm:leading-8 dark:text-[#c4c0b8]">
            {post.body.map((section, idx) => (
              <div key={idx} className="space-y-4">
                {section.heading && (
                  <h2 className="font-serif text-2xl font-normal text-[#141413] dark:text-[#faf9f5]">
                    {section.heading}
                  </h2>
                )}
                {section.paragraphs.map((p, pIdx) => (
                  <p key={pIdx}>{p}</p>
                ))}
              </div>
            ))}
          </div>

          {/* Sourced Citations / References */}
          {post.references && post.references.length > 0 && (
            <div className="mt-14 rounded-xl border border-[#ded7cf] bg-[#f5f0e8] p-6 dark:border-white/[0.08] dark:bg-[#1f1e1b]">
              <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#cc785c]">
                References &amp; Regulatory Context
              </div>
              <ul className="mt-3 space-y-2 text-xs text-[#6c6a64] dark:text-[#a09d96]">
                {post.references.map((ref, rIdx) => (
                  <li key={rIdx} className="flex items-start gap-2 font-mono text-[11px]">
                    <span className="text-[#cc785c]">[{rIdx + 1}]</span>
                    <span>
                      {ref.citation} &bull;{" "}
                      <span className="text-[#8e8b82]">{ref.source}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Related Guides Cross-Linking */}
          {relatedArticles.length > 0 && (
            <div className="mt-14 border-t border-[#ded7cf] pt-10 dark:border-white/[0.08]">
              <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#8e8b82]">
                Related Field Notes
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {relatedArticles.map((rel) => (
                  <Link
                    key={rel.slug}
                    href={`/posts/${rel.slug}`}
                    className="
                      group flex flex-col justify-between rounded-xl border border-[#ded7cf]
                      bg-white p-5 transition-all hover:border-[#cc785c]
                      dark:border-white/[0.08] dark:bg-[#1f1e1b]
                    "
                  >
                    <div>
                      <span className="font-mono text-[8px] uppercase tracking-wider text-[#cc785c]">
                        {rel.category}
                      </span>
                      <div className="mt-2 font-serif text-lg font-medium text-[#141413] group-hover:text-[#cc785c] dark:text-[#faf9f5]">
                        {rel.title}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-1 font-mono text-[10px] text-[#8e8b82] group-hover:text-[#cc785c]">
                      <span>Read</span>
                      <VaahanIcon name="arrow-right" size={10} aria-hidden="true" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Return to Index */}
          <div className="mt-12 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-[#6c6a64] hover:text-[#cc785c] dark:text-[#a09d96]"
            >
              <span>← Back to all Field Notes</span>
            </Link>
          </div>
        </article>
      </main>

      <BlogFooter />
    </div>
  );
}
