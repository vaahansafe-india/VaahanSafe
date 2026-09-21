/**
 * VaahanSafe Journal & Content Domain Types
 */

export type BlogCategory =
  | "Vehicle Safety"
  | "QR & Identity"
  | "Safety Guides"
  | "Privacy"
  | "Product"
  | "VaahanSafe Updates"
  | "VaahanSafe Guides"
  | "Privacy & DPDP"
  | "Ownership & Care"
  | "Legal & Compliance";

export type PublicationStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";

export interface JournalCategoryInfo {
  name: BlogCategory;
  slug: string;
  indexNumber: string; // e.g., "01"
  description: string;
  headline: string;
  spotlightDeck?: string;
  iconName?: string;
  order: number;
}

export interface StatutoryCitation {
  citation: string;
  source: string;
  url?: string;
  relevance?: string;
}

export interface ArticleCallout {
  type: "note" | "warning" | "statute" | "privacy" | "safety" | "important";
  title: string;
  text: string;
}

export interface ArticleFigureData {
  url?: string;
  alt: string;
  caption: string;
  aspectRatio?: "16/9" | "4/3" | "1/1" | "21/9";
  isDiagram?: boolean;
}

export interface ArticleTable {
  headers: readonly string[];
  rows: readonly (readonly string[])[];
  caption?: string;
}

export interface ArticleStep {
  number: string;
  title: string;
  detail: string;
  badge?: string;
}

export interface ArticleSubsection {
  title: string;
  paragraphs: readonly string[];
  bullets?: readonly string[];
}

export interface ArticleFaq {
  question: string;
  answer: string;
}

export interface ArticleSection {
  heading?: string;
  id?: string;
  paragraphs: readonly string[];
  callout?: ArticleCallout;
  figure?: ArticleFigureData;
  quote?: {
    text: string;
    attribution?: string;
  };
  bullets?: readonly string[];
  subsections?: readonly ArticleSubsection[];
  table?: ArticleTable;
  steps?: readonly ArticleStep[];
}

export interface GuideStep {
  number: string; // "01", "02", etc.
  label: string; // "PREPARE", "PLACE", "CONTROL"
  title: string;
  description: string;
}

export interface ArticleAuthor {
  name: string;
  role: string;
  avatar?: string;
}

export type EditorialFrame =
  | "FULL_BLEED"
  | "OFFSET_LANDSCAPE"
  | "TALL_PORTRAIT"
  | "CROPPED_DETAIL"
  | "INSET_TECHNICAL"
  | "DARK_FIELD";

export type ArticleMediaRole = "HERO" | "THUMBNAIL" | "OG" | "INLINE" | "DIAGRAM";

export interface ArticleFocalPoint {
  x: number;
  y: number;
}

export interface PublicEditorialMedia {
  publicId?: string;
  src?: string;
  alt: string;
  width?: number;
  height?: number;
  aspectRatio?: string;
  caption?: string;
  frame?: EditorialFrame;
  role?: ArticleMediaRole;
  focalPoint?: ArticleFocalPoint;
  priority?: boolean;
  isFallback?: boolean;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  deck?: string;
  intro: string;
  category: BlogCategory;
  categorySlug: string;
  status: PublicationStatus;
  date: string;
  publishedAt: string;
  updatedAt?: string;
  readingTime: string;
  readingTimeMinutes: number;
  isFeatured?: boolean;
  isGuide?: boolean;
  guideSteps?: readonly GuideStep[];
  author: ArticleAuthor;
  heroMedia?: PublicEditorialMedia;
  previewMedia?: PublicEditorialMedia;
  editorialMedia?: PublicEditorialMedia;
  mediaRoles?: Partial<Record<ArticleMediaRole, PublicEditorialMedia>>;
  body: readonly ArticleSection[];
  references?: readonly StatutoryCitation[];
  relatedSlugs: readonly string[];
  tags: readonly string[];
  officialDocumentRef?: {
    title: string;
    href: string;
  };
  hasDarkSection?: boolean;
  darkSectionContent?: {
    eyebrow: string;
    title: string;
    paragraphs: readonly string[];
    linkText?: string;
    linkHref?: string;
  };
  contentMarkdown?: string;
  featuredImageUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  keyTakeaways?: readonly string[];
  faq?: readonly ArticleFaq[];
  checklist?: {
    title: string;
    items: readonly string[];
  };
  wordCount?: number;
}

export type ArticlePost = BlogPost;
