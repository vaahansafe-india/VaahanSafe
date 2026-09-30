import { ParallaxImage } from "./parallax-image";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { ScrollReveal } from "./scroll-reveal";

export type PublicPageContent = {
  eyebrow: string;
  title: string;
  accent?: string;
  description: string;
  intro?: string;
  cards?: readonly { title: string; text: string }[];
  links?: readonly { label: string; href: string }[];
  images?: readonly { src: string; alt: string; label: string }[];
  cutout?: { src: string; alt: string; caption: string };
  notice?: { title: string; text: string };
  sections?: readonly { id: string; title: string; summary: string; paragraphs?: readonly string[]; points?: readonly string[]; link?: { label: string; href: string } }[];
  faqs?: readonly { question: string; answer: string }[];
};

export function PublicPage({ content }: { content: PublicPageContent }) {
  return <div className="vs-page"><SiteHeader /><main id="main-content" className="vs-page-main">
    <section className="vs-page-hero"><div className="vs-container"><span className="vs-kicker">{content.eyebrow}</span><h1>{content.title} {content.accent && <em>{content.accent}</em>}</h1><p>{content.description}</p></div></section>
    <section className="vs-page-body"><div className="vs-container">
      {content.intro && <ScrollReveal><p className="vs-page-intro">{content.intro}</p></ScrollReveal>}
      {content.images && <div className="vs-page-image-grid">{content.images.map(image => <figure key={image.src}><ParallaxImage src={image.src} alt={image.alt} sizes="(max-width:700px) 100vw, 50vw" /><figcaption>{image.label}</figcaption></figure>)}</div>}
      {content.cutout && <figure className="vs-cutout"><div><Image src={content.cutout.src} alt={content.cutout.alt} fill sizes="(max-width:700px) 90vw, 800px" /></div><figcaption>{content.cutout.caption}</figcaption></figure>}
      {content.notice && <div className="vs-content-notice"><strong>{content.notice.title}</strong><p>{content.notice.text}</p></div>}
      {content.cards && <div className="vs-fact-grid">{content.cards.map((card, index) => <ScrollReveal delay={index * 0.06} key={card.title}><article><span>{String(index + 1).padStart(2, "0")}</span><h2>{card.title}</h2><p>{card.text}</p></article></ScrollReveal>)}</div>}
      {content.sections && <div className="vs-content-layout"><aside aria-label="On this page"><strong>ON THIS PAGE</strong>{content.sections.map(section => <a href={`#${section.id}`} key={section.id}>{section.title}</a>)}</aside><div className="vs-content-article">{content.sections.map((section, index) => <section id={section.id} key={section.id}><ScrollReveal><span className="vs-kicker">{String(index + 1).padStart(2, "0")} / IN DETAIL</span><h2>{section.title}</h2><p className="vs-content-summary">{section.summary}</p>{section.paragraphs?.map(paragraph => <p key={paragraph}>{paragraph}</p>)}{section.points && <ul>{section.points.map(point => <li key={point}>{point}</li>)}</ul>}{section.link && <Link className="vs-text-link" href={section.link.href}>{section.link.label}<ArrowUpRight size={16} /></Link>}</ScrollReveal></section>)}</div></div>}
      {content.faqs && <div className="vs-page-faq"><span className="vs-kicker">COMMON QUESTIONS</span><h2>A few useful answers.</h2>{content.faqs.map(faq => <details className="vs-faq-item" key={faq.question}><summary>{faq.question}<span>+</span></summary><p>{faq.answer}</p></details>)}</div>}
      {content.links && <div className="vs-page-actions">{content.links.map(link => link.href.startsWith("http") || link.href.startsWith("mailto:") ? <a key={link.href} className="vs-button vs-button-dark" href={link.href}>{link.label}<ArrowUpRight size={16} /></a> : <Link key={link.href} className="vs-button vs-button-dark" href={link.href}>{link.label}<ArrowUpRight size={16} /></Link>)}</div>}
    </div></section>
  </main><SiteFooter /></div>;
}
