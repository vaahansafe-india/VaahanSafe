"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Search, X } from "lucide-react";
import type { BlogPost } from "@vaahansafe/content";

interface BlogIndexClientProps {
  initialPosts: readonly BlogPost[];
  featuredPost: BlogPost;
}

export function BlogIndexClient({ initialPosts, featuredPost }: BlogIndexClientProps) {
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const categories = [...new Set(initialPosts.map(post => post.category))];
  const filtering = category !== "All" || query.trim().length > 0;
  const posts = useMemo(() => initialPosts.filter(post => {
    const searchable = [post.title, post.excerpt, post.intro, post.category, post.author.name, ...post.tags,
      ...post.body.flatMap(section => [section.heading ?? "", ...section.paragraphs])].join(" ").toLowerCase();
    return (category === "All" || post.category === category) && searchable.includes(query.trim().toLowerCase());
  }), [initialPosts, category, query]);
  const visible = filtering ? posts : posts.filter(post => post.slug !== featuredPost.slug);

  return <div className="vs-journal-directory">
    <div className="vs-journal-tools">
      <label className="vs-help-search"><Search size={20} aria-hidden="true" /><span className="sr-only">Search journal articles</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search placement, privacy, setup…" />{query && <button type="button" aria-label="Clear search" onClick={() => setQuery("")}><X size={18} /></button>}</label>
      <div className="vs-journal-filters" role="group" aria-label="Filter by topic">{["All", ...categories].map(item => <button type="button" key={item} aria-pressed={category === item} onClick={() => setCategory(item)}>{item === "All" ? "All articles" : item}</button>)}</div>
    </div>
    {!filtering && <section className="vs-journal-feature" aria-labelledby="featured-title">
      <div className="vs-journal-feature-label"><span className="vs-kicker">EDITOR’S PICK</span><span>{featuredPost.category}</span><span>{featuredPost.readingTime}</span></div>
      <div><h2 id="featured-title"><Link href={`/blog/${featuredPost.slug}`}>{featuredPost.title}</Link></h2><p>{featuredPost.excerpt}</p><div className="vs-journal-byline">{featuredPost.author.name} · {featuredPost.date}</div><Link className="vs-button vs-button-dark" href={`/blog/${featuredPost.slug}`}>Read the article <ArrowUpRight size={18} /></Link></div>
    </section>}
    <section aria-labelledby="journal-results"><div className="vs-journal-results"><h2 id="journal-results">{filtering ? "Search results" : "Explore the journal"}</h2><p role="status" aria-live="polite">{visible.length} {visible.length === 1 ? "article" : "articles"}{filtering && <button type="button" onClick={() => { setCategory("All"); setQuery(""); }}>Clear filters</button>}</p></div>
      {visible.length ? <div className="vs-journal-grid">{visible.map(post => <article key={post.slug}><div className="vs-journal-meta"><span>{post.category}</span><span>{post.readingTime}</span></div><h3><Link href={`/blog/${post.slug}`}>{post.title}</Link></h3><p>{post.excerpt}</p><div className="vs-journal-card-footer"><span>{post.date}</span><Link href={`/blog/${post.slug}`} aria-label={`Read ${post.title}`}>Read article <ArrowUpRight size={17} /></Link></div></article>)}</div> : <div className="vs-content-notice"><strong>No articles match these filters.</strong><p>Try a broader word such as “placement”, “privacy” or “QR”, or clear the filters to browse all published articles.</p></div>}
    </section>
    <section className="vs-resource-panel"><span className="vs-kicker">PUT THE READING INTO PRACTICE</span><h2>Need instructions for your next step?</h2><p>The journal explains the ideas behind the product. Our document library covers setup, activation, placement, privacy and looking after your QR. For an account or order issue, use the help centre.</p><div className="vs-ds-actions"><Link className="vs-button vs-button-dark" href="/documents">Open the guide library <ArrowUpRight size={18} /></Link><Link className="vs-text-link" href="/help">Visit the help centre <ArrowUpRight size={18} /></Link></div></section>
  </div>;
}
