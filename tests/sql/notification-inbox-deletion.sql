DO $tests$
DECLARE item public.notifications; other_owner text; affected integer;
BEGIN
  SELECT * INTO STRICT item FROM public.notifications
    WHERE deleted_at IS NULL AND read_at IS NULL AND archived_at IS NULL
      AND intent_id IS NOT NULL ORDER BY created_at DESC LIMIT 1;
  SELECT user_id INTO STRICT other_owner FROM public.notifications
    WHERE user_id <> item.user_id LIMIT 1;

  UPDATE public.notifications SET deleted_at=clock_timestamp()
    WHERE user_id=other_owner AND id IN (item.id) AND deleted_at IS NULL;
  GET DIAGNOSTICS affected=ROW_COUNT;
  IF affected<>0 THEN RAISE EXCEPTION 'Cross-account inbox deletion succeeded'; END IF;

  UPDATE public.notifications SET deleted_at=clock_timestamp()
    WHERE user_id=item.user_id AND id IN (item.id) AND deleted_at IS NULL;
  GET DIAGNOSTICS affected=ROW_COUNT;
  IF affected<>1 THEN RAISE EXCEPTION 'Owner inbox deletion failed'; END IF;

  INSERT INTO public.notifications SELECT (item).* ON CONFLICT(id) DO NOTHING;
  IF EXISTS(SELECT 1 FROM public.notifications WHERE id=item.id AND deleted_at IS NULL)
    OR NOT EXISTS(SELECT 1 FROM public.notification_intents WHERE id=item.intent_id) THEN
    RAISE EXCEPTION 'Deleted inbox item was restored or its audit intent was lost';
  END IF;
END; $tests$;
