-- Add variant_of_asset_id column to media_assets in Supabase PostgreSQL
ALTER TABLE public.media_assets 
ADD COLUMN IF NOT EXISTS variant_of_asset_id TEXT;

CREATE INDEX IF NOT EXISTS idx_media_assets_variant ON public.media_assets(variant_of_asset_id);
