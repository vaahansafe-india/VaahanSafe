BEGIN;
-- Preserve the existing canonical in-app notification; request receipt is not
-- approval, payment success or a dispatch promise. No new provider is introduced.
CREATE FUNCTION public.replacement_request_notification() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE intent text:='intent_replacement_'||md5(NEW.id);notice text:='notif_replacement_'||md5(NEW.id);BEGIN
 IF NEW.status<>'REQUESTED' THEN RETURN NEW;END IF;
 INSERT INTO public.notification_intents(id,event_type,recipient_user_id,category,priority,template_key,template_version,payload_json,source_type,source_id,dedupe_key,status,created_at,dispatched_at)
 VALUES(intent,'QR_REPLACEMENT_REQUESTED',NEW.user_id,'SAFETY','HIGH','CANONICAL_IN_APP',1,'{}','REPLACEMENT',NEW.id,'replacement-request:'||NEW.id,'PROCESSED',now(),now()) ON CONFLICT(dedupe_key) DO NOTHING;
 INSERT INTO public.notifications(id,user_id,intent_id,event_type,category,priority,title,body_safe,action_type,action_target,created_at)
 VALUES(notice,NEW.user_id,intent,'QR_REPLACEMENT_REQUESTED','SAFETY','HIGH','Replacement request received','Request '||NEW.reference_code||' is awaiting review. A verified paid replacement-kit order is required before allocation.','VIEW_QR','/qr/replace/'||NEW.id,now()) ON CONFLICT(id) DO NOTHING;
 RETURN NEW;END;$$;
REVOKE ALL ON FUNCTION public.replacement_request_notification() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.replacement_request_notification() TO service_role;
CREATE TRIGGER replacement_request_notification AFTER INSERT ON public.replacement_requests FOR EACH ROW EXECUTE FUNCTION public.replacement_request_notification();
NOTIFY pgrst,'reload schema';
COMMIT;
