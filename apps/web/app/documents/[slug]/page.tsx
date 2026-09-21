import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "../../../components/marketing/site-header";
import { SiteFooter } from "../../../components/marketing/site-footer";
import { DocumentDetailReader } from "../../../components/documents/DocumentDetailReader";
import {
  getAllGuideSlugs,
  getGuideBySlug,
} from "../../../lib/documents/official-guides";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllGuideSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide) {
    return {
      title: "Document Not Found | VaahanSafe",
    };
  }

  return {
    title: `${guide.title} | VaahanSafe`,
    description: guide.purpose,
    openGraph: {
      title: `${guide.title} — VaahanSafe Official Reference`,
      description: guide.purpose,
      url: `https://vaahansafe.com/documents/${guide.slug}`,
      type: "article",
    },
    alternates: {
      canonical: `https://vaahansafe.com/documents/${guide.slug}`,
    },
  };
}

export default async function GuideDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: guide.title,
    description: guide.purpose,
    identifier: guide.docId,
    url: `https://vaahansafe.com/documents/${guide.slug}`,
    publisher: {
      "@type": "Organization",
      name: "VaahanSafe",
      url: "https://vaahansafe.com",
    },
    about: {
      "@type": "Thing",
      name: guide.subtitle,
    },
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader />

      <main id="main-content" className="flex-1">
        <DocumentDetailReader guide={guide} />
      </main>

      <SiteFooter />
    </div>
  );
}
