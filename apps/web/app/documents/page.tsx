import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, FileText } from "lucide-react";
import { OFFICIAL_GUIDES, calculateReadingTimeMinutes } from "../../lib/documents/official-guides";
import { SiteHeader } from "../../components/marketing/site-header";
import { SiteFooter } from "../../components/marketing/site-footer";

export const metadata: Metadata = { title: "Documents & Guides | VaahanSafe", description: "Product, activation, placement, safety, privacy and service guides for VaahanSafe." };
const policies = [
  { title: "Privacy policy", href: "/privacy", description: "Account data, public safety information and your privacy choices." },
  { title: "Terms of service", href: "/terms", description: "Account, vehicle, QR and service responsibilities." },
  { title: "Refund policy", href: "/refund-policy", description: "How a purchase problem or refund request is reviewed." },
  { title: "Shipping policy", href: "/shipping-policy", description: "Order fulfilment, delivery and tracking guidance." },
  { title: "Subscription terms", href: "/subscription-terms", description: "Optional plan features, billing and renewal conditions." },
  { title: "Cookie policy", href: "/cookie-policy", description: "How website cookies support essential functions." },
  { title: "Disclaimer", href: "/disclaimer", description: "The limits of safety information and emergency contact tools." },
];
export default function Page() {
  return <div className="vs-page"><SiteHeader /><main id="main-content" className="vs-page-main">
    <section className="vs-page-hero"><div className="vs-container"><span className="vs-kicker">THE LIBRARY / GUIDES & POLICIES</span><h1>Good guidance,<br /><em>close at hand.</em></h1><p>Everything you need to understand the product, set up your vehicle identity, choose what can be shared and find the right support path.</p></div></section>
    <section className="vs-page-body"><div className="vs-container">
      <div className="vs-doc-intro"><div><span className="vs-kicker">A PLACE TO START</span><h2>Follow the step you are on.</h2><p>New to VaahanSafe? Begin with the Product Guide, then use Quick Start for setup. If you already have a retail kit, use the Activation Guide. Keep the separate scratch proof private and enter it only in the official activation flow.</p></div><Link className="vs-button vs-button-dark" href="/documents/quick-start">Open quick start <ArrowUpRight size={18} /></Link></div>
      <nav className="vs-doc-journey" aria-label="Guide topics">{OFFICIAL_GUIDES.map(guide => <a key={guide.slug} href={`#guide-${guide.slug}`}><span>{guide.number}</span>{guide.stepName}</a>)}</nav>
      <div className="vs-section-heading"><span className="vs-kicker">01 / PRODUCT GUIDES</span><h2>Read the guide that fits.</h2><p>Each document covers a distinct part of the journey. You can read them in order or go directly to the detail you need.</p></div>
      <div className="vs-doc-grid">{OFFICIAL_GUIDES.map(guide => <Link id={`guide-${guide.slug}`} href={`/documents/${guide.slug}`} key={guide.slug}><span><FileText size={19} aria-hidden="true" /> {guide.docId}</span><strong>{guide.title}</strong><p>{guide.subtitle}</p><small>{calculateReadingTimeMinutes(guide)} min read · {guide.sections.length} sections</small><b>Read guide <ArrowUpRight size={17} /></b></Link>)}</div>
      <div className="vs-section-heading vs-doc-policy-heading"><span className="vs-kicker">02 / POLICIES</span><h2>The details that matter.</h2><p>These pages explain privacy, account use, purchases and service conditions. Documents awaiting final legal review are marked on their own pages.</p></div>
      <div className="vs-doc-policies">{policies.map(policy => <Link key={policy.href} href={policy.href}><span><strong>{policy.title}</strong><small>{policy.description}</small></span><ArrowUpRight size={19} aria-hidden="true" /></Link>)}</div>
      <div className="vs-resource-panel"><span className="vs-kicker">03 / WHEN YOU NEED SUPPORT</span><h2>Bring the right reference.</h2><p>For an order or account issue, include the relevant reference and the step you are completing. Do not send an OTP, password, card detail or activation proof. If someone is in immediate danger in India, call 112.</p><Link className="vs-button vs-button-dark" href="/help">Open help centre <ArrowUpRight size={18} /></Link></div>
    </div></section>
  </main><SiteFooter /></div>;
}
