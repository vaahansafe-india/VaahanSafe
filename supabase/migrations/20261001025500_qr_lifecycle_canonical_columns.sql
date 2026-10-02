-- Migration: Canonical columns for qr_scan_events, qr_status_history, and qr_activation_attempts
-- Resolves: 
-- 1. column "result" does not exist in qr_scan_events (STATE: 42703)
-- 2. column "reason_code" does not exist in qr_status_history (STATE: 42703)
-- 3. relation "public.qr_activation_attempts" does not exist (STATE: 42P01)

-- 1. qr_scan_events
ALTER TABLE public.qr_scan_events 
  ADD COLUMN IF NOT EXISTS result TEXT NOT NULL DEFAULT 'RESOLVED_ACTIVE';

ALTER TABLE public.qr_scan_events 
  ADD COLUMN IF NOT EXISTS state TEXT;

ALTER TABLE public.qr_scan_events 
  ADD COLUMN IF NOT EXISTS user_agent_family TEXT;

ALTER TABLE public.qr_scan_events 
  ADD COLUMN IF NOT EXISTS referrer_class TEXT NOT NULL DEFAULT 'DIRECT_SCAN';

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

-- 2. qr_status_history
ALTER TABLE public.qr_status_history 
  ADD COLUMN IF NOT EXISTS reason_code TEXT;

ALTER TABLE public.qr_status_history 
  ADD COLUMN IF NOT EXISTS actor_type TEXT NOT NULL DEFAULT 'SYSTEM';

ALTER TABLE public.qr_status_history 
  ADD COLUMN IF NOT EXISTS actor_id TEXT;

ALTER TABLE public.qr_status_history 
  ADD COLUMN IF NOT EXISTS metadata_json TEXT;

CREATE OR REPLACE FUNCTION public.sync_qr_status_history_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reason_code IS NOT NULL AND NEW.change_reason IS NULL THEN
    NEW.change_reason := NEW.reason_code;
  ELSIF NEW.change_reason IS NOT NULL AND NEW.reason_code IS NULL THEN
    NEW.reason_code := NEW.change_reason;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_qr_status_history_columns ON public.qr_status_history;
CREATE TRIGGER trg_sync_qr_status_history_columns
BEFORE INSERT OR UPDATE ON public.qr_status_history
FOR EACH ROW
EXECUTE FUNCTION public.sync_qr_status_history_columns();

-- Backfill reason_code for existing rows in qr_status_history
UPDATE public.qr_status_history SET reason_code = COALESCE(change_reason, 'LIFECYCLE_TRANSITION') WHERE reason_code IS NULL;

-- 3. qr_activation_attempts table creation
CREATE TABLE IF NOT EXISTS public.qr_activation_attempts (
    id TEXT PRIMARY KEY,
    qr_id TEXT NOT NULL REFERENCES public.qr_stickers(id) ON DELETE CASCADE,
    user_id TEXT,
    outcome TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Enable RLS and setup policies
ALTER TABLE public.qr_scan_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_activation_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on qr_scan_events" ON public.qr_scan_events;
CREATE POLICY "Service role full access on qr_scan_events"
  ON public.qr_scan_events FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on qr_status_history" ON public.qr_status_history;
CREATE POLICY "Service role full access on qr_status_history"
  ON public.qr_status_history FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on qr_activation_attempts" ON public.qr_activation_attempts;
CREATE POLICY "Service role full access on qr_activation_attempts"
  ON public.qr_activation_attempts FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can insert scan events" ON public.qr_scan_events;
CREATE POLICY "Anyone can insert scan events"
  ON public.qr_scan_events FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view scan events for their own assigned QRs" ON public.qr_scan_events;
CREATE POLICY "Users can view scan events for their own assigned QRs"
  ON public.qr_scan_events FOR SELECT TO authenticated
  USING (
    qr_id IN (SELECT qr_id FROM public.qr_assignments WHERE user_id = auth.uid()::text)
    OR
    vehicle_id IN (SELECT id FROM public.vehicles WHERE user_id = auth.uid()::text)
  );

DROP POLICY IF EXISTS "Users can view status history for their assigned QRs" ON public.qr_status_history;
CREATE POLICY "Users can view status history for their assigned QRs"
  ON public.qr_status_history FOR SELECT TO authenticated
  USING (
    qr_id IN (SELECT qr_id FROM public.qr_assignments WHERE user_id = auth.uid()::text)
  );

DROP POLICY IF EXISTS "Users can view own activation attempts" ON public.qr_activation_attempts;
CREATE POLICY "Users can view own activation attempts"
  ON public.qr_activation_attempts FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()::text
  );
