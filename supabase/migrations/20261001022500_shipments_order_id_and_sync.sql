-- ============================================================================
-- VAAHANSAFE SHIPMENTS SCHEMA ALIGNMENT
-- Adds missing order_id, user_id, provider, tracking_reference, etc. to shipments
-- and installs two-way column synchronization with legacy courier columns.
-- ============================================================================

-- 1. Add missing columns to shipments
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS order_id text;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS user_id text;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS provider text DEFAULT 'MANUAL';
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS provider_shipment_id text;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS tracking_reference text;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS shipping_address_snapshot_json text;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS shipped_at timestamptz;

-- 2. Relax legacy NOT NULL on courier_code and provide default
ALTER TABLE public.shipments ALTER COLUMN courier_code DROP NOT NULL;
ALTER TABLE public.shipments ALTER COLUMN courier_code SET DEFAULT 'MANUAL';

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON public.shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_user_id ON public.shipments(user_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON public.shipments(tracking_reference);

-- 4. Install two-way column synchronization trigger
CREATE OR REPLACE FUNCTION public.sync_shipment_columns()
RETURNS trigger AS $$
BEGIN
  IF NEW.provider IS NULL AND NEW.courier_code IS NOT NULL THEN
    NEW.provider := NEW.courier_code;
  ELSIF NEW.courier_code IS NULL AND NEW.provider IS NOT NULL THEN
    NEW.courier_code := NEW.provider;
  END IF;

  IF NEW.tracking_reference IS NULL AND NEW.waybill_number IS NOT NULL THEN
    NEW.tracking_reference := NEW.waybill_number;
  ELSIF NEW.waybill_number IS NULL AND NEW.tracking_reference IS NOT NULL THEN
    NEW.waybill_number := NEW.tracking_reference;
  END IF;

  IF NEW.shipped_at IS NULL AND NEW.dispatched_at IS NOT NULL THEN
    NEW.shipped_at := NEW.dispatched_at;
  ELSIF NEW.dispatched_at IS NULL AND NEW.shipped_at IS NOT NULL THEN
    NEW.dispatched_at := NEW.shipped_at;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_shipment_columns ON public.shipments;
CREATE TRIGGER trg_sync_shipment_columns
BEFORE INSERT OR UPDATE ON public.shipments
FOR EACH ROW
EXECUTE FUNCTION public.sync_shipment_columns();

-- 5. User-scoped RLS policy for shipments
DROP POLICY IF EXISTS "Users can view own shipments" ON public.shipments;
CREATE POLICY "Users can view own shipments" ON public.shipments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text);
