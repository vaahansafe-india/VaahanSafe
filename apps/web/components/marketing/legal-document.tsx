import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { ScrollReveal } from "./scroll-reveal";

type Section = {
  readonly index: string;
  readonly id: string;
  readonly shortTitle: string;
  readonly heading: string;
  readonly summary: string;
  readonly subsections: readonly {
    readonly id: string;
    readonly title: string;
    readonly paragraphs: readonly string[];
    readonly bulletPoints?: readonly string[];
    readonly legalReviewNote?: string;
  }[];
};

export function LegalDocument({ title, subtitle, status, updated, sections, overview, variant }: { title: string; subtitle: string; status: string; updated: string; sections: readonly Section[]; overview?: { text: string; points: readonly string[] }; variant?: "privacy" }) {
  return <div className={`vs-page${variant === "privacy" ? " vs-privacy-document" : ""}`}>
    <SiteHeader />
    <main id="main-content" className="vs-page-main">
      <section className="vs-page-hero"><div className="vs-container"><span className="vs-kicker">POLICIES / {status === "ACTIVE" ? "CURRENT" : "DRAFT FOR LEGAL REVIEW"}</span><h1>{title}</h1><p>{subtitle}</p>{variant === "privacy" ? <div className="vs-privacy-meta" aria-label="Document details"><span>01 / POLICY DOCUMENT</span><span>{status === "ACTIVE" ? "CURRENT EDITION" : "DRAFT FOR LEGAL REVIEW"}</span><span>UPDATED {updated.toUpperCase()}</span></div> : <small className="vs-legal-date">Last updated: {updated}</small>}</div></section>
      <div className="vs-container vs-legal-layout">
        <aside aria-label="On this page"><strong>ON THIS PAGE</strong>{overview && <a href="#policy-overview">In plain language</a>}{sections.map(section => <a key={section.id} href={`#${section.id}`}>{section.index} {section.shortTitle}</a>)}</aside>
        <div className="vs-legal-article">
          {overview && <section id="policy-overview" className="vs-policy-overview"><span className="vs-kicker">START HERE</span><h2>In plain language.</h2><p className="vs-legal-summary">{overview.text}</p><ul>{overview.points.map(point => <li key={point}>{point}</li>)}</ul></section>}
          {sections.map(section => <section id={section.id} key={section.id}><ScrollReveal><span className="vs-kicker">{section.index} / {section.shortTitle}</span><h2>{section.heading}</h2><p className="vs-legal-summary">{section.summary}</p>{section.subsections.map(sub => <div className="vs-legal-subsection" key={sub.id}>{sub.title && <h3>{sub.title}</h3>}{sub.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}{sub.bulletPoints && <ul>{sub.bulletPoints.map(point => <li key={point}>{point}</li>)}</ul>}{sub.legalReviewNote && <p className="vs-policy-note">These details are pending final policy review. Contact support for the terms relevant to your account or purchase.</p>}</div>)}</ScrollReveal></section>)}
          <div className="vs-legal-end"><p>Need help understanding this document?</p><Link className="vs-text-link" href="/contact">Contact support <ArrowUpRight size={16} /></Link></div>
        </div>
      </div>
    </main>
    <SiteFooter />
  </div>;
}
