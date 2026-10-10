BEGIN;
-- A Worker may mark its own lease failed only before attempting database
-- finalization. An ambiguous finalization is resolved through state/replay.
CREATE FUNCTION public.vault_fail_upload(p_hash text,p_lease uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE ver public.customer_document_versions%ROWTYPE;
BEGIN
 SELECT * INTO ver FROM public.customer_document_versions WHERE upload_token_hash=p_hash FOR UPDATE;
 IF ver.id IS NULL THEN RETURN '{"error":"NOT_FOUND"}'; END IF;
 IF ver.status='READY' THEN RETURN '{"ready":true}'; END IF;
 IF ver.status='UPLOADING' AND ver.lease_id=p_lease THEN
  UPDATE public.customer_document_versions SET status='FAILED' WHERE id=ver.id;
  IF NOT EXISTS(SELECT 1 FROM public.customer_document_versions WHERE document_id=ver.document_id AND status IN ('PENDING_UPLOAD','UPLOADING','READY')) THEN
   UPDATE public.customer_documents SET status='FAILED' WHERE id=ver.document_id AND current_version=0 AND deleted_at IS NULL;
  END IF;
 END IF;
 RETURN jsonb_build_object('status',(SELECT status FROM public.customer_document_versions WHERE id=ver.id));
END $$;
REVOKE ALL ON FUNCTION public.vault_fail_upload(text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.vault_fail_upload(text,uuid) TO service_role;
COMMIT;
