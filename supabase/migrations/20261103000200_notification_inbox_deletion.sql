BEGIN;

-- A retry must not resurrect a deleted inbox item. Preserve the inbox ID,
-- notification intent, and delivery audit trail.
ALTER TABLE public.notifications ADD COLUMN deleted_at timestamptz;

ALTER POLICY "Users can view own notifications" ON public.notifications
  USING (user_id = (SELECT auth.uid())::text AND deleted_at IS NULL);

ALTER POLICY "Users can update own notifications" ON public.notifications
  USING (user_id = (SELECT auth.uid())::text AND deleted_at IS NULL)
  WITH CHECK (user_id = (SELECT auth.uid())::text AND deleted_at IS NULL);

COMMIT;
