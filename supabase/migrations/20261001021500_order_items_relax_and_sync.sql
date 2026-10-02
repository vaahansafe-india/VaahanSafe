-- ============================================================================
-- VAAHANSAFE ORDER ITEMS RECONCILIATION
-- Relax legacy NOT NULL on product_name and sync name <-> product_name
-- ============================================================================

ALTER TABLE public.order_items ALTER COLUMN product_name DROP NOT NULL;

-- Trigger to sync name and product_name, catalog_code and product_code
CREATE OR REPLACE FUNCTION public.sync_order_items_columns()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  IF NEW.name IS NOT NULL AND NEW.product_name IS NULL THEN
    NEW.product_name := NEW.name;
  ELSIF NEW.product_name IS NOT NULL AND NEW.name IS NULL THEN
    NEW.name := NEW.product_name;
  END IF;

  IF NEW.catalog_code IS NOT NULL AND NEW.product_code IS NULL THEN
    NEW.product_code := NEW.catalog_code;
  ELSIF NEW.product_code IS NOT NULL AND NEW.catalog_code IS NULL THEN
    NEW.catalog_code := NEW.product_code;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_items_sync ON public.order_items;

CREATE TRIGGER trg_order_items_sync
  BEFORE INSERT OR UPDATE ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_order_items_columns();
