-- ============================================================================
-- VAAHANSAFE IN-APP NOTIFICATIONS DOMAIN ALIGNMENT
-- Adds intent_id, event_type, category, priority, body_safe, read_at, archived_at
-- to the notifications table and installs sync trigger with legacy columns.
-- ============================================================================

-- 1. Add domain columns to notifications table
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS intent_id text;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS event_type text;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS category text DEFAULT 'ACCOUNT';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS priority text DEFAULT 'NORMAL';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS body_safe text;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS action_type text DEFAULT 'NONE';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS action_target text;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS read_at timestamptz;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS archived_at timestamptz;

-- 2. Performance indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_intent ON public.notifications(intent_id);

-- 3. Install sync trigger between body/body_safe, type/event_type, is_read/read_at
CREATE OR REPLACE FUNCTION public.sync_notification_columns()
RETURNS trigger AS $$
BEGIN
  -- Sync body and body_safe
  IF NEW.body_safe IS NULL AND NEW.body IS NOT NULL THEN
    NEW.body_safe := NEW.body;
  ELSIF NEW.body IS NULL AND NEW.body_safe IS NOT NULL THEN
    NEW.body := NEW.body_safe;
  END IF;

  -- Sync event_type and type
  IF NEW.event_type IS NULL AND NEW.type IS NOT NULL THEN
    NEW.event_type := NEW.type;
  ELSIF NEW.type IS NULL AND NEW.event_type IS NOT NULL THEN
    NEW.type := NEW.event_type;
  END IF;

  -- Sync is_read and read_at
  IF NEW.read_at IS NOT NULL AND (NEW.is_read IS NULL OR NEW.is_read = 0) THEN
    NEW.is_read := 1;
  ELSIF NEW.is_read = 1 AND NEW.read_at IS NULL THEN
    NEW.read_at := clock_timestamp();
  ELSIF (NEW.is_read IS NULL OR NEW.is_read = 0) AND NEW.read_at IS NOT NULL THEN
    NEW.read_at := NULL;
  END IF;

  -- Default category and priority
  IF NEW.category IS NULL THEN
    NEW.category := 'ACCOUNT';
  END IF;
  IF NEW.priority IS NULL THEN
    NEW.priority := 'NORMAL';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_notification_columns ON public.notifications;
CREATE TRIGGER trg_sync_notification_columns
BEFORE INSERT OR UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.sync_notification_columns();

-- 4. User-scoped RLS policy for notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);
