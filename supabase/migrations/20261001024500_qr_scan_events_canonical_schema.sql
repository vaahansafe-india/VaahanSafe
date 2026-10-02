-- Migration: Canonical columns & triggers for public.qr_scan_events
-- Resolves: SUPABASE_SQL_ERROR: column "result" does not exist (STATE: 42703)

ALTER TABLE public.qr_scan_events 
  ADD COLUMN IF NOT EXISTS result TEXT NOT NULL DEFAULT 'RESOLVED_ACTIVE';

ALTER TABLE public.qr_scan_events 
  ADD COLUMN IF NOT EXISTS state TEXT;

ALTER TABLE public.qr_scan_events 
  ADD COLUMN IF NOT EXISTS user_agent_family TEXT;

ALTER TABLE public.qr_scan_events 
  ADD COLUMN IF NOT EXISTS referrer_class TEXT NOT NULL DEFAULT 'DIRECT_SCAN';

-- Trigger to synchronize state and region
CREATE OR REPLACE FUNCTION public.sync_scan_events_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.state IS NOT NULL AND NEW.region IS NULL THEN
    NEW.region := NEW.state;
  ELSIF NEW.region IS NOT NULL AND NEW.state IS NULL THEN
    NEW.state := NEW.region;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_scan_events_columns ON public.qr_scan_events;
CREATE TRIGGER trg_sync_scan_events_columns
BEFORE INSERT OR UPDATE ON public.qr_scan_events
FOR EACH ROW
EXECUTE FUNCTION public.sync_scan_events_columns();

-- Ensure performance index exists
CREATE INDEX IF NOT EXISTS idx_qr_scan_events_qr_created ON public.qr_scan_events(qr_id, created_at DESC);

-- Enable RLS and define policies
ALTER TABLE public.qr_scan_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert scan events" ON public.qr_scan_events;
CREATE POLICY "Anyone can insert scan events"
  ON public.qr_scan_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view scan events for their own assigned QRs" ON public.qr_scan_events;
CREATE POLICY "Users can view scan events for their own assigned QRs"
  ON public.qr_scan_events
  FOR SELECT
  TO authenticated
  USING (
    qr_id IN (
      SELECT qr_id FROM public.qr_assignments
      WHERE user_id = auth.uid()::text
    )
    OR
    vehicle_id IN (
      SELECT id FROM public.vehicles
      WHERE user_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Service role full access on qr_scan_events" ON public.qr_scan_events;
CREATE POLICY "Service role full access on qr_scan_events"
  ON public.qr_scan_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
