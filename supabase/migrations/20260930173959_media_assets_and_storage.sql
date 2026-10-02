-- ============================================================================
-- VAAHANSAFE CLOUDFLARE R2 MEDIA ASSETS & OBJECT STORAGE METADATA
-- Integrates Cloudflare R2 Object Storage with Supabase PostgreSQL metadata
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE storage_bucket_type AS ENUM ('PUBLIC', 'PRIVATE', 'EXPORT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE media_owner_type AS ENUM (
    'USER', 'VEHICLE', 'SUPPORT_TICKET', 'BLOG_POST', 
    'GALLERY_ITEM', 'DOCUMENT', 'ORDER', 'QR_BATCH', 
    'REPORT', 'SYSTEM'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE media_visibility AS ENUM ('PUBLIC', 'PRIVATE', 'INTERNAL');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE media_status AS ENUM ('UPLOADING', 'READY', 'QUARANTINED', 'DELETED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket storage_bucket_type NOT NULL DEFAULT 'PUBLIC',
  object_key TEXT UNIQUE NOT NULL, -- Unique Cloudflare R2 path / key
  owner_type media_owner_type NOT NULL,
  owner_id UUID NOT NULL,
  visibility media_visibility NOT NULL DEFAULT 'PUBLIC',
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL CHECK (size_bytes >= 0),
  sha256 TEXT,
  width INT,
  height INT,
  alt_text TEXT,
  status media_status NOT NULL DEFAULT 'UPLOADING',
  original_filename TEXT,
  storage_etag TEXT,
  public_url TEXT, -- Pre-computed CDN delivery URL on Cloudflare
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ready_at TIMESTAMPTZ,
  quarantined_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_assets_owner ON public.media_assets (owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_status ON public.media_assets (status);
CREATE INDEX IF NOT EXISTS idx_media_assets_object_key ON public.media_assets (object_key);
CREATE INDEX IF NOT EXISTS idx_media_assets_bucket_status ON public.media_assets (bucket, status);

CREATE TRIGGER trg_media_assets_updated_at
  BEFORE UPDATE ON public.media_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

-- Public assets (READY and PUBLIC) can be read by anyone
CREATE POLICY "Public media assets are viewable by all"
  ON public.media_assets FOR SELECT
  TO anon, authenticated
  USING (visibility = 'PUBLIC' AND status = 'READY');

-- Authenticated users can view their own media assets
CREATE POLICY "Users can view their own media assets"
  ON public.media_assets FOR SELECT
  TO authenticated
  USING (owner_id = (SELECT auth.uid()));

-- Authenticated users can register uploads for themselves
CREATE POLICY "Users can insert their own media assets"
  ON public.media_assets FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = (SELECT auth.uid()));

-- Authenticated users can update their own media assets
CREATE POLICY "Users can update their own media assets"
  ON public.media_assets FOR UPDATE
  TO authenticated
  USING (owner_id = (SELECT auth.uid()))
  WITH CHECK (owner_id = (SELECT auth.uid()));
