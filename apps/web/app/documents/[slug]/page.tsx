import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { SiteHeader } from "../../../components/marketing/site-header";
import { SiteFooter } from "../../../components/marketing/site-footer";
import { calculateReadingTimeMinutes, getAllGuideSlugs, getGuideBySlug } from "../../../lib/documents/official-guides";

type PageProps = { params: Promise<{ slug: string }> };
export async function generateStaticParams() { return getAllGuideSlugs().map(slug => ({ slug })); }
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const guide = getGuideBySlug((await params).slug);
  return guide ? { title: `${guide.title} | VaahanSafe`, description: guide.purpose } : { title: "Document Not Found | VaahanSafe" };
}

function GuideLine({ text }: { text: string }) {
  const item = text.trim().match(/^(?:•|\d+\.)\s*(.*)$/);
  return <p className={item ? "vs-guide-list-line" : undefined}>{item ? item[1] : text}</p>;
}

export default async function Page({ params }: PageProps) {
  const guide = getGuideBySlug((await params).slug);
  if (!guide) notFound();
  const route = guide.diagram.map(part => part.trim().replace(/^\d{2}\s+/, "")).filter(part => part && part !== "↓" && part !== "→");
  const previous = guide.previousSlug && getGuideBySlug(guide.previousSlug);
  const next = guide.nextSlug && getGuideBySlug(guide.nextSlug);
  return <div className="vs-page"><SiteHeader /><main id="main-content" className="vs-page-main">
    <section className="vs-page-hero"><div className="vs-container"><Link className="vs-guide-back" href="/documents"><ArrowLeft size={16} /> All documents</Link><span className="vs-kicker">{guide.docId} / {guide.stepName}</span><h1>{guide.title}</h1><p>{guide.subtitle}</p><div className="vs-guide-meta"><span>Updated {guide.updatedAt}</span><span>{calculateReadingTimeMinutes(guide)} min read</span><span>{guide.sections.length} sections</span></div></div></section>
    <div className="vs-container vs-legal-layout"><aside aria-label="In this guide"><strong>IN THIS GUIDE</strong><a href="#guide-intro">At a glance</a>{route.length > 1 && <a href="#guide-journey">The sequence</a>}{guide.sections.map(section => <a key={section.id} href={`#${section.id}`}>{section.title}</a>)}<a href="#guide-next">Keep reading</a></aside>
      <div className="vs-legal-article vs-guide-article"><section id="guide-intro" className="vs-guide-start"><span className="vs-kicker">START HERE</span><h2>What this guide is for</h2><p className="vs-page-intro">{guide.purpose}</p><div className="vs-guide-overview"><strong>WHAT YOU’LL FIND</strong><ul>{guide.whatItCovers.map(item => <li key={item}>{item}</li>)}</ul></div></section>
        {route.length > 1 && <section id="guide-journey" className="vs-guide-journey"><span className="vs-kicker">THE SEQUENCE</span><h2>The path at a glance</h2><ol>{route.map((step, index) => <li key={`${step}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span><strong>{step}</strong></li>)}</ol></section>}
        {guide.sections.map((section, index) => <section id={section.id} key={section.id}><span className="vs-kicker">{String(index + 1).padStart(2, "0")} / IN DETAIL</span><h2>{section.title}</h2>{section.content.map((paragraph, paragraphIndex) => <GuideLine key={paragraphIndex} text={paragraph} />)}{section.subsections?.map(sub => <div className="vs-legal-subsection" key={sub.title}><h3>{sub.title}</h3>{sub.content.map((paragraph, paragraphIndex) => <GuideLine key={paragraphIndex} text={paragraph} />)}</div>)}{section.callout && <div className="vs-guide-callout"><strong>{section.callout.title}</strong>{(section.callout.left || section.callout.right) && <div className="vs-guide-callout-labels"><span>{section.callout.left}</span><span>{section.callout.right}</span></div>}{section.callout.text.split(/\n\n/).map(part => <p key={part}>{part}</p>)}</div>}</section>)}
        <section id="guide-next" className="vs-guide-next"><span className="vs-kicker">KEEP READING</span><h2>Find the next useful detail.</h2><p>Use the related references below, or continue through the guide collection in order.</p><div className="vs-guide-links">{guide.crossLinks.map(link => link.isExternal ? <a key={link.href} href={link.href}>{link.title}<ArrowUpRight size={17} /></a> : <Link key={link.href} href={link.href}>{link.title}<ArrowUpRight size={17} /></Link>)}</div><div className="vs-guide-pagination">{previous && <Link href={`/documents/${previous.slug}`}><ArrowLeft size={17} /><span><small>PREVIOUS GUIDE</small>{previous.title}</span></Link>}{next && <Link href={`/documents/${next.slug}`}><span><small>NEXT GUIDE</small>{next.title}</span><ArrowRight size={17} /></Link>}</div></section>
      </div>
    </div>
  </main><SiteFooter /></div>;
}
