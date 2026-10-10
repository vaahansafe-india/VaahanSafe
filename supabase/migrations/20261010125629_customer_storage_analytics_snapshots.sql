BEGIN;

-- One server-only definition of finalized original storage. Quota reservations
-- (thumbnails, pending uploads and cleanup) remain a separate vault policy metric.
CREATE VIEW public.customer_storage_originals WITH (security_invoker=true) AS
SELECT d.id AS document_id,d.owner_user_id,d.vehicle_id,d.category,d.title,d.security_mode,d.expires_at,
       d.created_at AS document_created_at,r.id AS version_id,r.version_number,r.mime_type,
       r.file_size_bytes,r.created_at AS version_created_at,(r.version_number=d.current_version) AS is_current,
       coalesce(left(v.registration_number,2)||'••••'||right(v.registration_number,4),'Account documents') AS vehicle_label,
       coalesce(v.make||' '||v.model,'Account documents') AS vehicle_name
FROM public.customer_documents d
JOIN public.customer_document_versions r ON r.document_id=d.id AND r.status='READY'
LEFT JOIN public.vehicles v ON v.id=d.vehicle_id
WHERE d.status='READY' AND d.deleted_at IS NULL
  AND EXISTS(SELECT 1 FROM public.customer_document_versions current_file WHERE current_file.document_id=d.id AND current_file.version_number=d.current_version AND current_file.status='READY')
  AND (d.vehicle_id IS NULL OR (v.deleted_at IS NULL AND v.status<>'DELETED' AND v.user_id=d.owner_user_id::text));
REVOKE ALL ON public.customer_storage_originals FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.customer_storage_originals TO service_role;

CREATE TABLE public.customer_storage_snapshots (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 -- Keep measurement history when accounts change; no cascading audit deletion.
 owner_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
 transaction_key text NOT NULL,
 recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(owner_user_id,transaction_key)
);
CREATE INDEX customer_storage_snapshots_owner_time ON public.customer_storage_snapshots(owner_user_id,recorded_at DESC,id DESC);
CREATE TABLE public.customer_storage_snapshot_items (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 -- Snapshots and their measurements are retained together; explicit retention
 -- work must handle both rather than silently cascading historical records.
 snapshot_id uuid NOT NULL REFERENCES public.customer_storage_snapshots(id) ON DELETE RESTRICT,
 -- Historical vehicle identities must survive transfer or retirement.
 vehicle_id text REFERENCES public.vehicles(id) ON DELETE RESTRICT,
 category text NOT NULL CHECK(length(category) BETWEEN 1 AND 64),
 mime_type text NOT NULL CHECK(mime_type IN ('application/pdf','image/jpeg','image/png','image/webp')),
 security_mode text NOT NULL CHECK(security_mode IN ('ACCOUNT','VAULT_PIN','DOCUMENT_PASSWORD')),
 expires_at date,
 bytes bigint NOT NULL CHECK(bytes>=0),
 versions integer NOT NULL CHECK(versions>=0)
);
CREATE INDEX customer_storage_snapshot_items_snapshot ON public.customer_storage_snapshot_items(snapshot_id);
CREATE INDEX customer_storage_snapshot_items_vehicle ON public.customer_storage_snapshot_items(vehicle_id);
ALTER TABLE public.customer_storage_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_storage_snapshot_items ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.customer_storage_snapshots,public.customer_storage_snapshot_items FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT ON public.customer_storage_snapshots,public.customer_storage_snapshot_items TO service_role;

CREATE FUNCTION public.record_customer_storage_snapshot(p_owner uuid) RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE snapshot uuid;
BEGIN
 -- Serializes measurements per account so concurrent commits have a truthful
 -- ordering. Called by deferred triggers after the complete vault transaction.
 PERFORM pg_advisory_xact_lock(hashtextextended(p_owner::text,73192));
 INSERT INTO public.customer_storage_snapshots(owner_user_id,transaction_key)
 VALUES(p_owner,pg_current_xact_id()::text)
 ON CONFLICT(owner_user_id,transaction_key) DO NOTHING RETURNING id INTO snapshot;
 IF snapshot IS NULL THEN RETURN; END IF;
 INSERT INTO public.customer_storage_snapshot_items(snapshot_id,vehicle_id,category,mime_type,security_mode,expires_at,bytes,versions)
 SELECT snapshot,o.vehicle_id,o.category,o.mime_type,o.security_mode,o.expires_at,sum(o.file_size_bytes),count(*)::integer
 FROM public.customer_storage_originals o WHERE o.owner_user_id=p_owner
 GROUP BY o.vehicle_id,o.category,o.mime_type,o.security_mode,o.expires_at;
END $$;

CREATE FUNCTION public.capture_customer_storage_snapshot() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE prior_owner uuid; next_owner uuid; affected_owner uuid;
BEGIN
 IF TG_TABLE_NAME='customer_documents' THEN
   IF TG_OP='UPDATE' AND (OLD.owner_user_id,OLD.vehicle_id,OLD.category,OLD.security_mode,OLD.expires_at,OLD.current_version,OLD.status,OLD.deleted_at)
       IS NOT DISTINCT FROM (NEW.owner_user_id,NEW.vehicle_id,NEW.category,NEW.security_mode,NEW.expires_at,NEW.current_version,NEW.status,NEW.deleted_at) THEN RETURN NULL; END IF;
   IF TG_OP<>'INSERT' THEN prior_owner:=OLD.owner_user_id; END IF;
   IF TG_OP<>'DELETE' THEN next_owner:=NEW.owner_user_id; END IF;
 ELSIF TG_TABLE_NAME='customer_document_versions' THEN
   IF TG_OP='UPDATE' AND (OLD.document_id,OLD.status,OLD.file_size_bytes,OLD.mime_type) IS NOT DISTINCT FROM (NEW.document_id,NEW.status,NEW.file_size_bytes,NEW.mime_type) THEN RETURN NULL; END IF;
   IF TG_OP<>'INSERT' THEN SELECT owner_user_id INTO prior_owner FROM public.customer_documents WHERE id=OLD.document_id; END IF;
   IF TG_OP<>'DELETE' THEN SELECT owner_user_id INTO next_owner FROM public.customer_documents WHERE id=NEW.document_id; END IF;
 ELSE
   IF (OLD.user_id,OLD.status,OLD.deleted_at) IS NOT DISTINCT FROM (NEW.user_id,NEW.status,NEW.deleted_at) THEN RETURN NULL; END IF;
   prior_owner:=OLD.user_id::uuid; next_owner:=NEW.user_id::uuid;
 END IF;
 FOR affected_owner IN SELECT DISTINCT x FROM unnest(ARRAY[prior_owner,next_owner]) x WHERE x IS NOT NULL ORDER BY x LOOP
   PERFORM public.record_customer_storage_snapshot(affected_owner);
 END LOOP;
 RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION public.record_customer_storage_snapshot(uuid),public.capture_customer_storage_snapshot() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.record_customer_storage_snapshot(uuid),public.capture_customer_storage_snapshot() TO service_role;

CREATE CONSTRAINT TRIGGER customer_documents_storage_snapshot AFTER INSERT OR UPDATE OR DELETE ON public.customer_documents
 DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.capture_customer_storage_snapshot();
CREATE CONSTRAINT TRIGGER customer_versions_storage_snapshot AFTER INSERT OR UPDATE OR DELETE ON public.customer_document_versions
 DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.capture_customer_storage_snapshot();
CREATE CONSTRAINT TRIGGER customer_vehicle_storage_snapshot AFTER UPDATE ON public.vehicles
 DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.capture_customer_storage_snapshot();

-- Begin tracking now with real measured baselines, never with invented history.
DO $$ DECLARE owner uuid; BEGIN
 FOR owner IN SELECT DISTINCT owner_user_id FROM public.customer_documents UNION SELECT owner_user_id FROM public.customer_vault_usage LOOP
   PERFORM public.record_customer_storage_snapshot(owner);
 END LOOP;
END $$;
COMMIT;
