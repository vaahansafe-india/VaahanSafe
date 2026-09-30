"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Search, X } from "lucide-react";
import { HELP_CATEGORIES, type HelpArticle } from "../../lib/help/help-content";
import { searchHelpArticles } from "../../lib/help/help-search";
import { ScrollReveal } from "./scroll-reveal";

export function PublicHelpCenter() {
  const [query, setQuery] = useState("");
  const [article, setArticle] = useState<HelpArticle | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const results = query.trim() ? searchHelpArticles(query) : [];

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (article && !element.open) element.showModal();
    if (!article && element.open) element.close();
    if (!article) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [article]);

  return <>
    <section className="vs-page-hero"><div className="vs-container"><span className="vs-kicker">HELP / A CLEAR NEXT STEP</span><h1>A little guidance.<br /><em>A useful answer.</em></h1><p>Find the steps for setup, activation, account details, safety choices, orders and replacement.</p><form className="vs-help-search" role="search" onSubmit={event => event.preventDefault()}><Search size={20} aria-hidden="true" /><label className="sr-only" htmlFor="help-query">Search help articles</label><input id="help-query" type="search" placeholder="Search activation, payment, placement..." value={query} onChange={event => setQuery(event.target.value)} /></form></div></section>
    <section className="vs-page-body"><div className="vs-container">
      <div className="vs-help-quick"><Link href="/help/activation">Activate a retail kit <ArrowUpRight size={17} /></Link><Link href="/help/replacement">Replace a QR <ArrowUpRight size={17} /></Link><Link href="/refund-policy">Understand refunds <ArrowUpRight size={17} /></Link><Link href="/documents/qr-placement">Check placement <ArrowUpRight size={17} /></Link></div>
      {query.trim() ? <div className="vs-help-results"><p role="status">{results.length} {results.length === 1 ? "answer" : "answers"} for &ldquo;{query}&rdquo;</p>{results.map(({ article: result }) => <button key={result.id} type="button" onClick={() => setArticle(result)}><span>{result.categoryTitle}</span><strong>{result.title}</strong><p>{result.summary}</p><ArrowRight size={18} /></button>)}{!results.length && <div className="vs-content-notice"><strong>No matching guide yet.</strong><p>Try a shorter term such as activation, order or contact. For an account-specific issue, email support@vaahansafe.com with a relevant reference.</p><Link className="vs-text-link" href="/contact">Contact support <ArrowUpRight size={16} /></Link></div>}</div> : <div className="vs-help-categories">{HELP_CATEGORIES.map((category, index) => <ScrollReveal key={category.id} delay={index % 2 * 0.07}><section><span className="vs-kicker">{String(index + 1).padStart(2, "0")} / GUIDANCE</span><h2>{category.title}</h2><p>{category.description}</p><div>{category.articles.map(item => <button type="button" key={item.id} onClick={() => setArticle(item)}>{item.title}<ArrowRight size={16} /></button>)}</div></section></ScrollReveal>)}</div>}
      <div className="vs-help-support"><span className="vs-kicker">PERSONAL SUPPORT</span><h2>Still need a hand?</h2><p>Tell us which step is unclear and include the relevant order or VaahanSafe reference. Keep passwords, OTPs and activation proofs out of your message.</p><Link className="vs-button vs-button-dark" href="/contact">Contact support <ArrowUpRight size={16} /></Link></div>
    </div></section>
    <dialog className="vs-help-dialog" ref={dialog} onCancel={() => setArticle(null)} onClose={() => setArticle(null)} onClick={event => { if (event.target === event.currentTarget) setArticle(null); }}>
      {article && <div><header><span className="vs-kicker">HELP / {article.categoryTitle}</span><button type="button" autoFocus onClick={() => setArticle(null)} aria-label="Close guide" title="Close guide"><X size={21} /></button></header><div className="vs-help-dialog-body"><h2>{article.title}</h2><p className="vs-content-summary">{article.summary}</p>{article.beforeYouStart && article.beforeYouStart.length > 0 && <section><h3>Before you start</h3><ul>{article.beforeYouStart.map(item => <li key={item}>{item}</li>)}</ul></section>}{article.whatYouNeed && article.whatYouNeed.length > 0 && <section><h3>What you need</h3><ul>{article.whatYouNeed.map(item => <li key={item}>{item}</li>)}</ul></section>}<ol className="vs-help-resolution">{article.steps.map(step => <li key={step.stepNumber}><span>{String(step.stepNumber).padStart(2, "0")}</span><div><h3>{step.title}</h3><p>{step.instruction}</p></div></li>)}</ol><section><h3>What happens next</h3><p>{article.whatHappensNext}</p></section><div className="vs-guide-links">{article.relatedHelp.filter(link => !link.href.startsWith("#")).map(link => <Link key={link.href} href={link.href}>{link.title}<ArrowUpRight size={16} /></Link>)}</div></div></div>}
    </dialog>
  </>;
}
