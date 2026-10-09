-- Comprehensive search matching (public ID, visible code, batch reference, status) and activation filter alignment.
CREATE OR REPLACE FUNCTION public.inventory_filter_clause(p_filters jsonb) RETURNS text
LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER SET search_path='' AS $$
DECLARE clause text := 'true';
BEGIN
 IF coalesce(p_filters->>'q','')<>'' THEN
  clause:=clause||' AND s.id IN (
    SELECT id FROM public.qr_stickers WHERE public_id ILIKE ''%''||($1->>''q'')||''%''
    UNION SELECT id FROM public.qr_stickers WHERE visible_code ILIKE ''%''||($1->>''q'')||''%''
    UNION SELECT z.id FROM public.qr_stickers z JOIN public.qr_batches zb ON zb.id=z.batch_id WHERE zb.reference_code ILIKE ''%''||($1->>''q'')||''%''
    UNION SELECT id FROM public.qr_stickers WHERE status ILIKE ($1->>''q'')||''%''
  )';
 END IF;
 IF jsonb_array_length(coalesce(p_filters->'statuses','[]'))>0 THEN clause:=clause||' AND s.status=ANY(ARRAY(SELECT jsonb_array_elements_text($1->''statuses'')))'; END IF;
 IF jsonb_array_length(coalesce(p_filters->'lifecycles','[]'))>0 THEN clause:=clause||' AND s.lifecycle_state=ANY(ARRAY(SELECT jsonb_array_elements_text($1->''lifecycles'')))'; END IF;
 IF coalesce(p_filters->>'batch','')<>'' THEN clause:=clause||' AND s.batch_id=$1->>''batch'''; END IF;
 IF coalesce(p_filters->>'channel','')<>'' THEN clause:=clause||' AND b.inventory_channel=$1->>''channel'''; END IF;
 IF p_filters->>'activation'='active' THEN clause:=clause||' AND (s.activated_at IS NOT NULL OR s.status=''ACTIVATED'')'; END IF;
 IF p_filters->>'activation'='inactive' THEN clause:=clause||' AND s.activated_at IS NULL AND s.status<>''ACTIVATED'''; END IF;
 IF p_filters->>'custody'='retailer' THEN clause:=clause||' AND s.current_retailer_id IS NOT NULL'; END IF;
 IF p_filters->>'custody'='distributor' THEN clause:=clause||' AND s.current_distributor_id IS NOT NULL AND s.current_retailer_id IS NULL'; END IF;
 IF p_filters->>'custody'='unrecorded' THEN clause:=clause||' AND s.current_distributor_id IS NULL AND s.current_retailer_id IS NULL'; END IF;
 IF coalesce(p_filters->>'from','')<>'' THEN clause:=clause||' AND s.created_at>=($1->>''from'')::date'; END IF;
 IF coalesce(p_filters->>'to','')<>'' THEN clause:=clause||' AND s.created_at<($1->>''to'')::date+interval ''1 day'''; END IF;
 IF p_filters->>'risk'='failed' THEN clause:=clause||' AND (s.activation_attempts>0 OR EXISTS(SELECT 1 FROM public.qr_activation_secrets sec WHERE sec.qr_id=s.id AND sec.failed_attempts>0))'; END IF;
 IF p_filters->>'risk'='blocked' THEN clause:=clause||' AND s.status=''BLOCKED'''; END IF;
 IF p_filters->>'risk'='replacement' THEN clause:=clause||' AND s.replaced_by_qr_id IS NOT NULL'; END IF;
 IF p_filters->>'print'='recorded' THEN clause:=clause||' AND (b.printed_at IS NOT NULL OR EXISTS(SELECT 1 FROM public.qr_print_items pi WHERE pi.qr_id=s.id AND pi.printed_at IS NOT NULL))'; END IF;
 IF p_filters->>'print'='unrecorded' THEN clause:=clause||' AND b.printed_at IS NULL AND NOT EXISTS(SELECT 1 FROM public.qr_print_items pi WHERE pi.qr_id=s.id AND pi.printed_at IS NOT NULL)'; END IF;
 RETURN clause;
END; $$;
