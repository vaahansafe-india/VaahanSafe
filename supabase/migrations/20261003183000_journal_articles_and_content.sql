-- ==============================================================================
-- Migration: 20261003183000_journal_articles_and_content.sql
-- Description: Supabase PostgreSQL Schema for VaahanSafe Blog & Journal Subsystem
-- Includes RLS policies, indexing, and Cloudflare R2 media compatibility.
-- ==============================================================================

-- 1. Journal Categories
CREATE TABLE IF NOT EXISTS public.journal_categories (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  index_number TEXT NOT NULL DEFAULT '01',
  description TEXT,
  headline TEXT,
  spotlight_deck TEXT,
  icon_name TEXT,
  order_num INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_journal_categories_slug ON public.journal_categories (slug);
CREATE INDEX IF NOT EXISTS idx_journal_categories_active ON public.journal_categories (is_active, order_num);

-- 2. Journal Authors
CREATE TABLE IF NOT EXISTS public.journal_authors (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  avatar TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_journal_authors_slug ON public.journal_authors (slug);

-- 3. Journal Articles
CREATE TABLE IF NOT EXISTS public.journal_articles (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  deck TEXT,
  intro TEXT NOT NULL,
  category TEXT NOT NULL,
  category_slug TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PUBLISHED' CHECK (status IN ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED')),
  date_display TEXT NOT NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reading_time TEXT NOT NULL DEFAULT '5 min read',
  reading_time_minutes INTEGER NOT NULL DEFAULT 5,
  word_count INTEGER NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_guide BOOLEAN NOT NULL DEFAULT false,
  featured_image_url TEXT,
  hero_media JSONB,
  preview_media JSONB,
  editorial_media JSONB,
  author_id TEXT REFERENCES public.journal_authors(id) ON UPDATE CASCADE ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  key_takeaways JSONB NOT NULL DEFAULT '[]'::jsonb,
  body JSONB NOT NULL DEFAULT '[]'::jsonb,
  checklist JSONB,
  faq JSONB,
  references_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  related_slugs JSONB NOT NULL DEFAULT '[]'::jsonb,
  official_document_ref JSONB,
  has_dark_section BOOLEAN NOT NULL DEFAULT false,
  dark_section_content JSONB,
  content_markdown TEXT,
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_journal_articles_slug ON public.journal_articles (slug);
CREATE INDEX IF NOT EXISTS idx_journal_articles_pub ON public.journal_articles (status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_journal_articles_cat ON public.journal_articles (category_slug, status);
CREATE INDEX IF NOT EXISTS idx_journal_articles_featured ON public.journal_articles (is_featured, published_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.journal_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_articles ENABLE ROW LEVEL SECURITY;

-- Public Read Policies
DROP POLICY IF EXISTS "Public can view active journal categories" ON public.journal_categories;
CREATE POLICY "Public can view active journal categories"
  ON public.journal_categories FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Public can view active journal authors" ON public.journal_authors;
CREATE POLICY "Public can view active journal authors"
  ON public.journal_authors FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public can view published journal articles" ON public.journal_articles;
CREATE POLICY "Public can view published journal articles"
  ON public.journal_articles FOR SELECT
  TO anon, authenticated
  USING (status = 'PUBLISHED' AND published_at <= NOW());

-- Service Role (Admin & Edge) Policies
DROP POLICY IF EXISTS "Service role has full access to journal_categories" ON public.journal_categories;
CREATE POLICY "Service role has full access to journal_categories"
  ON public.journal_categories FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role has full access to journal_authors" ON public.journal_authors;
CREATE POLICY "Service role has full access to journal_authors"
  ON public.journal_authors FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role has full access to journal_articles" ON public.journal_articles;
CREATE POLICY "Service role has full access to journal_articles"
  ON public.journal_articles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
