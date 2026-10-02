-- ============================================================================
-- VAAHANSAFE COMMERCE SCHEMA ALIGNMENT: ORDER ITEMS & PAYMENTS COLUMNS
-- Adds item_type, catalog_code, name, plan_id, snapshot_json to order_items
-- Adds attempt_number, payment_method, confirmed_at to payments
-- ============================================================================

-- 1. order_items columns
DO $$ BEGIN
  ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS item_type TEXT NOT NULL DEFAULT 'PRODUCT';
  ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS catalog_code TEXT;
  ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS name TEXT;
  ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS plan_id TEXT REFERENCES public.plans(id);
  ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS snapshot_json TEXT;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Populate catalog_code and name from product_code/product_name if existing
UPDATE public.order_items 
SET catalog_code = COALESCE(catalog_code, product_code),
    name = COALESCE(name, product_name)
WHERE catalog_code IS NULL OR name IS NULL;

-- 2. payments columns
DO $$ BEGIN
  ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS attempt_number INTEGER NOT NULL DEFAULT 1;
  ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_method TEXT;
  ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
