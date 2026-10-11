-- Transfer custody extends the existing real partner, QR and reservation domain.
BEGIN;
ALTER TABLE public.admin_stock_transfers DROP CONSTRAINT admin_stock_transfers_status_check;
ALTER TABLE public.admin_stock_transfers
 ADD CONSTRAINT admin_stock_transfers_status_check CHECK(status IN ('REQUESTED','APPROVED','IN_TRANSIT','PARTIALLY_RECEIVED','DISCREPANCY','RECEIVED','RECONCILED','CLOSED','CANCELLED','REJECTED')),
 ADD COLUMN revision integer NOT NULL DEFAULT 1 CHECK(revision>0),
 ADD COLUMN carrier text NOT NULL DEFAULT '', ADD COLUMN tracking_reference text NOT NULL DEFAULT '',
 ADD COLUMN expected_arrival timestamptz, ADD COLUMN dispatched_at timestamptz, ADD COLUMN received_at timestamptz,
 ADD COLUMN received_quantity integer NOT NULL DEFAULT 0 CHECK(received_quantity>=0),
 ADD COLUMN damaged_quantity integer NOT NULL DEFAULT 0 CHECK(damaged_quantity>=0),
 ADD COLUMN missing_quantity integer NOT NULL DEFAULT 0 CHECK(missing_quantity>=0),
 ADD COLUMN resolved_quantity integer NOT NULL DEFAULT 0 CHECK(resolved_quantity>=0),
 ADD CONSTRAINT transfer_receipt_bound CHECK(received_quantity+damaged_quantity+missing_quantity<=quantity);
ALTER TABLE public.admin_stock_transfer_items ADD COLUMN receipt_state text NOT NULL DEFAULT 'PENDING' CHECK(receipt_state IN ('PENDING','RECEIVED','DAMAGED','MISSING','LOST'));
UPDATE public.admin_stock_transfer_items i SET receipt_state='RECEIVED' FROM public.admin_stock_transfers t WHERE t.id=i.transfer_id AND t.status='RECEIVED';
UPDATE public.admin_stock_transfers SET received_quantity=quantity WHERE status='RECEIVED';
-- RESTRICT retains the physical manifest and accountable operational trail.
CREATE TABLE public.admin_transfer_allocations(
 transfer_id text NOT NULL REFERENCES public.admin_stock_transfers(id) ON DELETE RESTRICT,
 batch_id text NOT NULL REFERENCES public.qr_batches(id) ON DELETE RESTRICT,
 quantity integer NOT NULL CHECK(quantity BETWEEN 1 AND 5000), PRIMARY KEY(transfer_id,batch_id));
INSERT INTO public.admin_transfer_allocations SELECT id,batch_id,quantity FROM public.admin_stock_transfers WHERE batch_id IS NOT NULL;
CREATE TABLE public.admin_transfer_events(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), transfer_id text NOT NULL REFERENCES public.admin_stock_transfers(id) ON DELETE RESTRICT,
 actor_id text NOT NULL REFERENCES public.admin_users(id) ON DELETE RESTRICT,
 action text NOT NULL, from_status text, to_status text NOT NULL, reason text NOT NULL,
 quantities jsonb NOT NULL DEFAULT '{}', occurred_at timestamptz NOT NULL DEFAULT clock_timestamp());
-- Idempotency binds the actor, command and payload; conflicting reuse is rejected.
CREATE TABLE public.admin_transfer_commands(
 request_id uuid PRIMARY KEY, actor_id text NOT NULL REFERENCES public.admin_users(id) ON DELETE RESTRICT,
 transfer_id text NOT NULL REFERENCES public.admin_stock_transfers(id) ON DELETE RESTRICT,
 payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.admin_stock_reconciliations ADD COLUMN transfer_id text REFERENCES public.admin_stock_transfers(id) ON DELETE RESTRICT;
CREATE UNIQUE INDEX admin_transfer_reconciliation ON public.admin_stock_reconciliations(transfer_id) WHERE transfer_id IS NOT NULL;
CREATE INDEX admin_transfer_event_cursor ON public.admin_transfer_events(transfer_id,occurred_at DESC,id DESC);
CREATE INDEX admin_transfer_event_actor ON public.admin_transfer_events(actor_id);
CREATE INDEX admin_transfer_command_transfer ON public.admin_transfer_commands(transfer_id);
CREATE INDEX admin_transfer_command_actor ON public.admin_transfer_commands(actor_id);
CREATE INDEX admin_transfer_cursor ON public.admin_stock_transfers(created_at DESC,id DESC);
CREATE INDEX admin_transfer_status_cursor ON public.admin_stock_transfers(status,created_at DESC,id DESC);
CREATE INDEX admin_transfer_allocation_batch ON public.admin_transfer_allocations(batch_id,transfer_id);
CREATE INDEX admin_transfer_reference_normalized ON public.admin_stock_transfers((replace(reference_code,'-','')) text_pattern_ops);
ALTER TABLE public.admin_transfer_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_transfer_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_transfer_commands ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_transfer_allocations,public.admin_transfer_events,public.admin_transfer_commands FROM anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.admin_transfer_allocations,public.admin_transfer_events,public.admin_transfer_commands TO service_role;

CREATE FUNCTION public.transfer_eligible(p_source text,p_batch text) RETURNS SETOF public.qr_stickers LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT q.* FROM public.qr_stickers q JOIN public.qr_batches b ON b.id=q.batch_id
 WHERE (p_batch IS NULL OR q.batch_id=p_batch) AND b.inventory_channel='OFFLINE_RETAIL' AND b.status IN ('PRINTED','RECEIVED','CLOSED')
 AND q.current_distributor_id IS NOT DISTINCT FROM p_source AND q.current_retailer_id IS NULL
 AND q.status=CASE WHEN p_source IS NULL THEN 'PRINTED' ELSE 'WITH_DISTRIBUTOR' END
 AND q.user_id IS NULL AND q.vehicle_id IS NULL AND q.activated_at IS NULL
 AND (b.printed_at IS NOT NULL OR EXISTS(SELECT 1 FROM public.qr_print_items x WHERE x.qr_id=q.id AND x.printed_at IS NOT NULL))
 AND NOT EXISTS(SELECT 1 FROM public.admin_stock_transfer_items i WHERE i.qr_id=q.id AND i.released_at IS NULL);
$$;
CREATE FUNCTION public.admin_transfer_options(p_session uuid,p_source text DEFAULT NULL,p_kind text DEFAULT 'partners',p_q text DEFAULT '',p_partner_kind text DEFAULT NULL,p_active boolean DEFAULT false) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE result jsonb;BEGIN PERFORM public.inventory_admin_actor(p_session);
 IF p_kind='partners' THEN
 SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]') INTO result FROM(SELECT id,reference_code,name,kind,city,status,verification_status,parent_distributor_id FROM public.admin_partners WHERE (p_partner_kind IS NULL OR kind=p_partner_kind) AND (NOT p_active OR status='ACTIVE') AND (p_source IS NULL OR parent_distributor_id=p_source) AND (NOT p_active OR kind<>'RETAILER' OR verification_status='VERIFIED') AND (p_q='' OR name ILIKE '%'||left(p_q,100)||'%' OR reference_code ILIKE left(p_q,100)||'%') ORDER BY name,id LIMIT 30)r;
 ELSIF p_kind='batches' THEN
 SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]') INTO result FROM(SELECT b.id,b.reference_code,0 available FROM public.qr_batches b WHERE EXISTS(SELECT 1 FROM public.admin_transfer_allocations a WHERE a.batch_id=b.id) AND (p_q='' OR b.reference_code ILIKE left(p_q,100)||'%') ORDER BY b.reference_code LIMIT 30)r;
 ELSIF p_kind='inventory' THEN
 SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]') INTO result FROM(SELECT b.id,b.reference_code,count(q.id)::integer available FROM public.qr_batches b JOIN public.transfer_eligible(p_source,NULL) q ON q.batch_id=b.id WHERE (p_q='' OR b.reference_code ILIKE left(p_q,100)||'%') GROUP BY b.id,b.reference_code ORDER BY b.reference_code LIMIT 30)r;
 ELSE RAISE EXCEPTION 'INVALID_TRANSFER';END IF;RETURN result;END;$$;

CREATE FUNCTION public.admin_transfer_command(p_session uuid,p_id text,p_revision integer,p_action text,p_values jsonb,p_reason text,p_request uuid) RETURNS text LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE actor text;old public.admin_stock_transfers;target text;dest public.admin_partners;src text;allocation jsonb;ids text[];n integer;total integer:=0;prior public.admin_transfer_commands;payload jsonb;next_state text;codes text[];category text;affected integer;rq integer;dq integer;mq integer;pending integer;rec text;resolution text;
BEGIN
 actor:=public.inventory_admin_actor(p_session,true,true);
 IF p_request IS NULL OR p_reason IS NULL OR length(trim(p_reason)) NOT BETWEEN 10 AND 500 OR p_values IS NULL THEN RAISE EXCEPTION 'INVALID_TRANSFER';END IF;
 payload:=jsonb_build_object('id',p_id,'revision',p_revision,'action',p_action,'values',p_values,'reason',trim(p_reason));
 -- Serializes retries before inventory selection, even when the initial response was lost.
 PERFORM pg_advisory_xact_lock(hashtextextended(p_request::text,0));
 SELECT * INTO prior FROM public.admin_transfer_commands WHERE request_id=p_request;
 IF FOUND THEN IF prior.actor_id<>actor OR prior.payload<>payload THEN RAISE EXCEPTION 'REQUEST_CONFLICT';END IF;RETURN prior.transfer_id;END IF;
 IF p_action='request' THEN
  src:=nullif(p_values->>'source','');target:='transfer_'||gen_random_uuid()::text;
  -- A stable partner lock order is shared by all custody commands.
  PERFORM id FROM public.admin_partners WHERE id IN(src,p_values->>'destination') ORDER BY id FOR UPDATE;
  SELECT * INTO dest FROM public.admin_partners WHERE id=p_values->>'destination';
  IF dest.id IS NULL OR dest.status<>'ACTIVE' OR src IS NOT DISTINCT FROM dest.id THEN RAISE EXCEPTION 'PARTNER_UNAVAILABLE';END IF;
  IF src IS NULL THEN IF dest.kind<>'DISTRIBUTOR' THEN RAISE EXCEPTION 'INVALID_ROUTE';END IF;
  ELSE IF dest.kind<>'RETAILER' OR dest.parent_distributor_id IS DISTINCT FROM src OR dest.verification_status<>'VERIFIED' OR NOT EXISTS(SELECT 1 FROM public.admin_partners WHERE id=src AND kind='DISTRIBUTOR' AND status='ACTIVE') THEN RAISE EXCEPTION 'INVALID_ROUTE';END IF;END IF;
  IF jsonb_typeof(p_values->'allocations') IS DISTINCT FROM 'array' OR jsonb_array_length(p_values->'allocations') NOT BETWEEN 1 AND 20 THEN RAISE EXCEPTION 'INVALID_TRANSFER';END IF;
  FOR allocation IN SELECT value FROM jsonb_array_elements(p_values->'allocations') LOOP
   n:=(allocation->>'quantity')::integer;IF n IS NULL OR n NOT BETWEEN 1 AND 5000 THEN RAISE EXCEPTION 'INVALID_TRANSFER';END IF;total:=total+n;
  END LOOP;
  IF total>5000 THEN RAISE EXCEPTION 'INVALID_TRANSFER';END IF;
  INSERT INTO public.admin_stock_transfers(id,reference_code,source_partner_id,destination_partner_id,batch_id,quantity) VALUES(target,'VS-TRF-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)),src,dest.id,p_values->'allocations'->0->>'batch',total);
  FOR allocation IN SELECT value FROM jsonb_array_elements(p_values->'allocations') ORDER BY value->>'batch' LOOP
   n:=(allocation->>'quantity')::integer;
   -- Lock both batch lifecycle and identities; unique unreleased reservations protect cross-command races.
   PERFORM id FROM public.qr_batches WHERE id=allocation->>'batch' FOR UPDATE;
   SELECT array_agg(id) INTO ids FROM(SELECT q.id FROM public.qr_stickers q WHERE q.id IN(SELECT e.id FROM public.transfer_eligible(src,allocation->>'batch')e) ORDER BY q.id LIMIT n FOR UPDATE OF q SKIP LOCKED)x;
   IF coalesce(cardinality(ids),0)<>n THEN RAISE EXCEPTION 'INSUFFICIENT_STOCK';END IF;
   INSERT INTO public.admin_transfer_allocations VALUES(target,allocation->>'batch',n);
   INSERT INTO public.admin_stock_transfer_items(transfer_id,qr_id) SELECT target,unnest(ids);
  END LOOP;next_state:='REQUESTED';
 ELSE
  SELECT source_partner_id INTO src FROM public.admin_stock_transfers WHERE id=p_id;
  PERFORM a.id FROM public.admin_partners a WHERE a.id IN(src,(SELECT destination_partner_id FROM public.admin_stock_transfers WHERE id=p_id)) ORDER BY a.id FOR UPDATE;
  SELECT * INTO old FROM public.admin_stock_transfers WHERE id=p_id FOR UPDATE;
  IF old.id IS NULL THEN RAISE EXCEPTION 'TRANSFER_NOT_FOUND';END IF;
  IF p_revision IS NULL OR old.revision<>p_revision THEN RAISE EXCEPTION 'TRANSFER_CHANGED';END IF;target:=old.id;
  SELECT * INTO dest FROM public.admin_partners WHERE id=old.destination_partner_id;
  PERFORM b.id FROM public.qr_batches b JOIN public.admin_transfer_allocations a ON a.batch_id=b.id WHERE a.transfer_id=target ORDER BY b.id FOR UPDATE OF b;
  PERFORM q.id FROM public.qr_stickers q JOIN public.admin_stock_transfer_items i ON i.qr_id=q.id WHERE i.transfer_id=target ORDER BY q.id FOR UPDATE OF q;
  IF p_action IN ('approve','dispatch') THEN
   IF dest.status<>'ACTIVE' OR (src IS NOT NULL AND (dest.parent_distributor_id IS DISTINCT FROM src OR dest.verification_status<>'VERIFIED' OR NOT EXISTS(SELECT 1 FROM public.admin_partners WHERE id=src AND status='ACTIVE'))) THEN RAISE EXCEPTION 'PARTNER_UNAVAILABLE';END IF;
   IF EXISTS(SELECT 1 FROM public.admin_transfer_allocations a JOIN public.qr_batches b ON b.id=a.batch_id WHERE a.transfer_id=target AND b.status NOT IN ('PRINTED','RECEIVED','CLOSED')) THEN RAISE EXCEPTION 'STOCK_CHANGED';END IF;
   IF (SELECT count(*) FROM public.admin_stock_transfer_items i JOIN public.qr_stickers q ON q.id=i.qr_id WHERE i.transfer_id=target AND i.released_at IS NULL AND q.current_distributor_id IS NOT DISTINCT FROM src AND q.current_retailer_id IS NULL AND q.status=CASE WHEN src IS NULL THEN 'PRINTED' ELSE 'WITH_DISTRIBUTOR' END AND q.user_id IS NULL AND q.vehicle_id IS NULL AND q.activated_at IS NULL)<>old.quantity THEN RAISE EXCEPTION 'STOCK_CHANGED';END IF;
   IF p_action='approve' AND old.status='REQUESTED' THEN next_state:='APPROVED';
   ELSIF p_action='dispatch' AND old.status='APPROVED' THEN
    next_state:='IN_TRANSIT';
    IF length(coalesce(p_values->>'carrier',''))>100 OR length(coalesce(p_values->>'tracking',''))>150 THEN RAISE EXCEPTION 'INVALID_TRANSFER';END IF;
    UPDATE public.admin_stock_transfers SET dispatched_at=now(),carrier=coalesce(p_values->>'carrier',''),tracking_reference=coalesce(p_values->>'tracking',''),expected_arrival=nullif(p_values->>'expectedArrival','')::timestamptz WHERE id=target;
    IF src IS NULL THEN
     UPDATE public.qr_stickers SET status='IN_TRANSIT_DISTRIBUTOR',lifecycle_state='IN_TRANSIT_DISTRIBUTOR',updated_at=now() WHERE id IN(SELECT qr_id FROM public.admin_stock_transfer_items WHERE transfer_id=target);
     INSERT INTO public.qr_status_history(id,qr_id,from_status,to_status,reason_code,actor_type,actor_id,created_at) SELECT gen_random_uuid()::text,qr_id,'PRINTED','IN_TRANSIT_DISTRIBUTOR','ADMIN_STOCK_TRANSFER','ADMIN',actor,now() FROM public.admin_stock_transfer_items WHERE transfer_id=target;
    END IF;
   ELSE RAISE EXCEPTION 'INVALID_TRANSITION';END IF;
  ELSIF p_action IN ('cancel','reject') AND old.status IN ('REQUESTED','APPROVED') THEN
   next_state:=CASE WHEN p_action='cancel' THEN 'CANCELLED' ELSE 'REJECTED' END;
   UPDATE public.admin_stock_transfer_items SET released_at=now() WHERE transfer_id=target AND released_at IS NULL;
  ELSIF p_action IN ('receive','resolve') THEN
   IF p_action='receive' AND old.status NOT IN ('IN_TRANSIT','PARTIALLY_RECEIVED','DISCREPANCY') THEN RAISE EXCEPTION 'INVALID_TRANSITION';END IF;
   IF p_action='resolve' AND old.status<>'DISCREPANCY' THEN RAISE EXCEPTION 'INVALID_TRANSITION';END IF;
   FOR category IN SELECT unnest(CASE WHEN p_action='receive' THEN ARRAY['received','damaged','missing'] ELSE ARRAY['found','lost'] END) LOOP
    IF jsonb_typeof(coalesce(p_values->category,'[]'))<>'array' THEN RAISE EXCEPTION 'INVALID_RECEIPT';END IF;
    SELECT array_agg(x) INTO codes FROM jsonb_array_elements_text(coalesce(p_values->category,'[]'))x;
    IF coalesce(cardinality(codes),0)>5000 OR (SELECT count(DISTINCT x) FROM unnest(codes)x)<>coalesce(cardinality(codes),0) THEN RAISE EXCEPTION 'INVALID_RECEIPT';END IF;
    IF codes IS NULL THEN CONTINUE;END IF;total:=total+cardinality(codes);
    IF (SELECT count(*) FROM public.admin_stock_transfer_items i JOIN public.qr_stickers q ON q.id=i.qr_id WHERE i.transfer_id=target AND i.released_at IS NULL AND q.visible_code=ANY(codes) AND i.receipt_state=CASE WHEN p_action='receive' THEN 'PENDING' ELSE 'MISSING' END AND q.user_id IS NULL AND q.vehicle_id IS NULL AND q.activated_at IS NULL AND q.current_distributor_id IS NOT DISTINCT FROM src AND q.current_retailer_id IS NULL AND q.status=CASE WHEN src IS NULL THEN 'IN_TRANSIT_DISTRIBUTOR' ELSE 'WITH_DISTRIBUTOR' END)<>cardinality(codes) THEN RAISE EXCEPTION 'INVALID_RECEIPT';END IF;
    IF category IN ('received','found','damaged','lost') THEN
     resolution:=CASE WHEN category='damaged' THEN 'DAMAGED' WHEN category='lost' THEN 'LOST' WHEN src IS NULL THEN 'WITH_DISTRIBUTOR' ELSE 'WITH_RETAILER' END;
     INSERT INTO public.qr_status_history(id,qr_id,from_status,to_status,reason_code,actor_type,actor_id,created_at) SELECT gen_random_uuid()::text,q.id,q.status,resolution,'ADMIN_STOCK_TRANSFER','ADMIN',actor,now() FROM public.qr_stickers q JOIN public.admin_stock_transfer_items i ON i.qr_id=q.id WHERE i.transfer_id=target AND q.visible_code=ANY(codes);
     UPDATE public.qr_stickers q SET status=resolution,lifecycle_state=resolution,current_distributor_id=CASE WHEN category='lost' THEN src WHEN src IS NULL THEN dest.id ELSE src END,current_retailer_id=CASE WHEN src IS NOT NULL AND category<>'lost' THEN dest.id ELSE NULL END,updated_at=now() WHERE q.id IN(SELECT qr_id FROM public.admin_stock_transfer_items WHERE transfer_id=target) AND q.visible_code=ANY(codes);
    END IF;
    UPDATE public.admin_stock_transfer_items i SET receipt_state=CASE WHEN category IN ('received','found') THEN 'RECEIVED' ELSE upper(category) END,released_at=CASE WHEN category IN ('received','found','lost') THEN now() ELSE NULL END FROM public.qr_stickers q WHERE q.id=i.qr_id AND i.transfer_id=target AND q.visible_code=ANY(codes);
   END LOOP;
   IF p_action='resolve' AND total=0 THEN RAISE EXCEPTION 'INVALID_RECEIPT';END IF;
   IF p_action='receive' AND coalesce((p_values->>'finalReceipt')::boolean,false) THEN UPDATE public.admin_stock_transfer_items SET receipt_state='MISSING' WHERE transfer_id=target AND receipt_state='PENDING';END IF;
   SELECT count(*) FILTER(WHERE receipt_state='RECEIVED'),count(*) FILTER(WHERE receipt_state='DAMAGED'),count(*) FILTER(WHERE receipt_state IN ('MISSING','LOST')),count(*) FILTER(WHERE receipt_state='PENDING') INTO rq,dq,mq,pending FROM public.admin_stock_transfer_items WHERE transfer_id=target;
   IF p_action='receive' AND rq=old.received_quantity AND dq=old.damaged_quantity AND mq=old.missing_quantity THEN RAISE EXCEPTION 'INVALID_RECEIPT';END IF;
   next_state:=CASE WHEN dq+mq>0 THEN 'DISCREPANCY' WHEN pending>0 THEN 'PARTIALLY_RECEIVED' ELSE 'RECEIVED' END;
   UPDATE public.admin_stock_transfers SET received_quantity=rq,damaged_quantity=dq,missing_quantity=mq,received_at=CASE WHEN pending=0 THEN coalesce(received_at,now()) ELSE NULL END WHERE id=target;
   IF dq+mq>0 THEN
    INSERT INTO public.admin_stock_reconciliations(id,partner_id,transfer_id,expected_quantity,counted_quantity) VALUES('reconciliation_'||gen_random_uuid()::text,dest.id,target,old.quantity,rq+dq) ON CONFLICT(transfer_id) WHERE transfer_id IS NOT NULL DO UPDATE SET counted_quantity=excluded.counted_quantity,updated_at=clock_timestamp();
   END IF;
  ELSIF p_action='reconcile' AND old.status IN ('RECEIVED','DISCREPANCY') THEN
   IF EXISTS(SELECT 1 FROM public.admin_stock_transfer_items WHERE transfer_id=target AND receipt_state IN ('PENDING','MISSING')) THEN RAISE EXCEPTION 'UNRESOLVED_RECEIPT';END IF;
   next_state:='RECONCILED';UPDATE public.admin_stock_transfer_items SET released_at=coalesce(released_at,now()) WHERE transfer_id=target;
   UPDATE public.admin_stock_reconciliations SET status='CLOSED',updated_at=clock_timestamp() WHERE transfer_id=target;
   UPDATE public.admin_stock_transfers SET resolved_quantity=damaged_quantity+missing_quantity WHERE id=target;
  ELSIF p_action='close' AND old.status='RECONCILED' THEN next_state:='CLOSED';
  ELSE RAISE EXCEPTION 'INVALID_TRANSITION';END IF;
  UPDATE public.admin_stock_transfers SET status=next_state,revision=revision+1,updated_at=clock_timestamp() WHERE id=target;
 END IF;
 INSERT INTO public.admin_transfer_commands(request_id,actor_id,transfer_id,payload) VALUES(p_request,actor,target,payload);
 INSERT INTO public.admin_transfer_events(transfer_id,actor_id,action,from_status,to_status,reason,quantities) SELECT target,actor,p_action,old.status,next_state,trim(p_reason),jsonb_build_object('requested',quantity,'received',received_quantity,'damaged',damaged_quantity,'missing',missing_quantity) FROM public.admin_stock_transfers WHERE id=target;
 INSERT INTO public.admin_audit_logs(actor_id,action,resource_type,resource_id,reason,request_id,before_summary,after_summary) VALUES(actor,'transfer.'||p_action,'transfers',target,trim(p_reason),p_request,jsonb_build_object('status',old.status,'revision',old.revision),jsonb_build_object('status',next_state,'transfer',target));
 RETURN target;
END;$$;

CREATE VIEW public.admin_transfer_projection WITH(security_invoker=true) AS
 SELECT t.*,coalesce(s.name,'Central inventory') source_name,s.reference_code source_reference,s.kind source_kind,
 d.name destination_name,d.reference_code destination_reference,d.kind destination_kind,
 CASE WHEN t.status IN ('IN_TRANSIT','PARTIALLY_RECEIVED','DISCREPANCY') AND t.expected_arrival<now() THEN true ELSE false END overdue,
 (t.status='DISCREPANCY' OR t.status='PARTIALLY_RECEIVED' OR (t.status='IN_TRANSIT' AND t.expected_arrival<now())) attention
 FROM public.admin_stock_transfers t LEFT JOIN public.admin_partners s ON s.id=t.source_partner_id JOIN public.admin_partners d ON d.id=t.destination_partner_id;
REVOKE ALL ON public.admin_transfer_projection FROM anon,authenticated;GRANT SELECT ON public.admin_transfer_projection TO service_role;
CREATE FUNCTION public.transfer_filter_clause(p_filters jsonb) RETURNS text LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER SET search_path='' AS $$
DECLARE clause text:='true';BEGIN
 IF coalesce(p_filters->>'q','')<>'' THEN clause:=clause||' AND replace(p.reference_code,''-'','''') LIKE replace(upper($1->>''q''),''-'','''')||''%''';END IF;
 IF coalesce(p_filters->>'status','')<>'' THEN clause:=clause||' AND p.status=$1->>''status''';END IF;
 IF coalesce(p_filters->>'source','')<>'' THEN clause:=clause||' AND coalesce(p.source_partner_id,''central'')=$1->>''source''';END IF;
 IF coalesce(p_filters->>'destination','')<>'' THEN clause:=clause||' AND p.destination_partner_id=$1->>''destination''';END IF;
 IF coalesce(p_filters->>'batch','')<>'' THEN clause:=clause||' AND EXISTS(SELECT 1 FROM public.admin_transfer_allocations a WHERE a.transfer_id=p.id AND a.batch_id=$1->>''batch'')';END IF;
 IF coalesce(p_filters->>'movement','')='central' THEN clause:=clause||' AND p.source_partner_id IS NULL';ELSIF p_filters->>'movement'='retail' THEN clause:=clause||' AND p.source_partner_id IS NOT NULL';END IF;
 IF coalesce(p_filters->>'from','')<>'' THEN clause:=clause||' AND p.created_at>=($1->>''from'')::date';END IF;
 IF coalesce(p_filters->>'to','')<>'' THEN clause:=clause||' AND p.created_at<(($1->>''to'')::date+interval ''1 day'')';END IF;
 IF p_filters->>'view'='attention' THEN clause:=clause||' AND p.attention';
 ELSIF p_filters->>'view'='transit' THEN clause:=clause||' AND p.status IN (''IN_TRANSIT'',''PARTIALLY_RECEIVED'')';
 ELSIF p_filters->>'view'='reconcile' THEN clause:=clause||' AND p.status IN (''RECEIVED'',''DISCREPANCY'')';
 ELSIF p_filters->>'view'='approvals' THEN clause:=clause||' AND p.status=''REQUESTED''';
 ELSIF p_filters->>'view'='closed' THEN clause:=clause||' AND p.status=''CLOSED''';END IF;RETURN clause;END;$$;
CREATE FUNCTION public.admin_transfer_list(p_session uuid,p_filters jsonb DEFAULT '{}',p_cursor jsonb DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE result jsonb;clause text;BEGIN PERFORM public.inventory_admin_actor(p_session);clause:=public.transfer_filter_clause(p_filters);
 IF p_cursor IS NOT NULL THEN clause:=clause||' AND (p.created_at,p.id)<(($2->>''created_at'')::timestamptz,$2->>''id'')';END IF;
 EXECUTE 'SELECT coalesce(jsonb_agg(to_jsonb(r)),''[]'') FROM(SELECT p.* FROM public.admin_transfer_projection p WHERE '||clause||' ORDER BY p.created_at DESC,p.id DESC LIMIT 51)r' INTO result USING p_filters,p_cursor;RETURN result;END;$$;
CREATE FUNCTION public.admin_transfer_summary(p_session uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE result jsonb;BEGIN PERFORM public.inventory_admin_actor(p_session);
 SELECT jsonb_build_object('active',count(*) FILTER(WHERE status NOT IN ('CLOSED','CANCELLED','REJECTED')),'transit',count(*) FILTER(WHERE status IN ('IN_TRANSIT','PARTIALLY_RECEIVED')),'attention',count(*) FILTER(WHERE attention),'receivedToday',count(*) FILTER(WHERE received_at >=date_trunc('day',now() AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'Asia/Kolkata')) INTO result FROM public.admin_transfer_projection;RETURN result;END;$$;
CREATE FUNCTION public.admin_transfer_detail(p_session uuid,p_id text) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE result jsonb;BEGIN PERFORM public.inventory_admin_actor(p_session);
 SELECT jsonb_build_object('transfer',to_jsonb(t),'allocations',coalesce((SELECT jsonb_agg(jsonb_build_object('batch_id',a.batch_id,'reference_code',b.reference_code,'quantity',a.quantity)) FROM public.admin_transfer_allocations a JOIN public.qr_batches b ON b.id=a.batch_id WHERE a.transfer_id=t.id),'[]'),'reconciliation',(SELECT jsonb_build_object('id',r.id,'status',r.status,'expected',r.expected_quantity,'counted',r.counted_quantity,'variance',r.variance) FROM public.admin_stock_reconciliations r WHERE r.transfer_id=t.id)) INTO result FROM public.admin_transfer_projection t WHERE t.id=p_id;
 IF result IS NULL THEN RAISE EXCEPTION 'TRANSFER_NOT_FOUND';END IF;RETURN result;END;$$;
CREATE FUNCTION public.admin_transfer_history(p_session uuid,p_id text,p_section text DEFAULT 'timeline',p_cursor jsonb DEFAULT NULL,p_q text DEFAULT '') RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE result jsonb;actor text;privileged boolean;BEGIN actor:=public.inventory_admin_actor(p_session);SELECT role IN ('SUPER_ADMIN','OPS_ADMIN') INTO privileged FROM public.admin_users WHERE id=actor;
 IF p_section='timeline' THEN SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]') INTO result FROM(SELECT e.id,e.action,e.from_status,e.to_status,CASE WHEN privileged THEN e.reason ELSE NULL END reason,e.quantities,e.occurred_at created_at,a.name actor_name FROM public.admin_transfer_events e JOIN public.admin_users a ON a.id=e.actor_id WHERE e.transfer_id=p_id AND (p_cursor IS NULL OR (e.occurred_at,e.id)<((p_cursor->>'created_at')::timestamptz,(p_cursor->>'id')::uuid)) ORDER BY e.occurred_at DESC,e.id DESC LIMIT 21)r;
 ELSIF p_section='contents' THEN SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]') INTO result FROM(SELECT q.id,q.visible_code,q.status,i.receipt_state,b.reference_code batch_reference,coalesce(ret.name,dist.name,'Central inventory') custodian,i.reserved_at created_at FROM public.admin_stock_transfer_items i JOIN public.qr_stickers q ON q.id=i.qr_id JOIN public.qr_batches b ON b.id=q.batch_id LEFT JOIN public.admin_partners dist ON dist.id=q.current_distributor_id LEFT JOIN public.admin_partners ret ON ret.id=q.current_retailer_id WHERE i.transfer_id=p_id AND (p_q='' OR q.visible_code ILIKE left(p_q,100)||'%') AND (p_cursor IS NULL OR (i.reserved_at,q.id)<((p_cursor->>'created_at')::timestamptz,p_cursor->>'id')) ORDER BY i.reserved_at DESC,q.id DESC LIMIT 51)r;
 ELSIF p_section='audit' THEN SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]') INTO result FROM(SELECT a.id,a.action,u.name actor_name,CASE WHEN privileged THEN a.reason ELSE NULL END reason,a.created_at FROM public.admin_audit_logs a LEFT JOIN public.admin_users u ON u.id=a.actor_id WHERE a.resource_type='transfers' AND a.resource_id=p_id AND (p_cursor IS NULL OR (a.created_at,a.id)<((p_cursor->>'created_at')::timestamptz,(p_cursor->>'id')::uuid)) ORDER BY a.created_at DESC,a.id DESC LIMIT 21)r;
 ELSE RAISE EXCEPTION 'INVALID_TRANSFER';END IF;RETURN result;END;$$;

-- Legacy partner commands remain authenticated, but physical transitions must use
-- the central approval/receipt/revision model. The UI links to that workspace.
CREATE OR REPLACE FUNCTION public.admin_distributor_request_transfer(p_session uuid,p_id text,p_batch text,p_quantity integer,p_reason text,p_request uuid) RETURNS text LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$ BEGIN RETURN public.admin_transfer_command(p_session,NULL,NULL,'request',jsonb_build_object('destination',p_id,'allocations',jsonb_build_array(jsonb_build_object('batch',p_batch,'quantity',p_quantity))),p_reason,p_request);END;$$;
CREATE OR REPLACE FUNCTION public.admin_retailer_request_transfer(p_session uuid,p_id text,p_source text,p_batch text,p_quantity integer,p_reason text,p_request uuid) RETURNS text LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$ BEGIN RETURN public.admin_transfer_command(p_session,NULL,NULL,'request',jsonb_build_object('source',p_source,'destination',p_id,'allocations',jsonb_build_array(jsonb_build_object('batch',p_batch,'quantity',p_quantity))),p_reason,p_request);END;$$;
CREATE OR REPLACE FUNCTION public.admin_distributor_transfer_transition(p_session uuid,p_id text,p_transfer text,p_from text,p_to text,p_reason text,p_request uuid) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$ BEGIN PERFORM public.inventory_admin_actor(p_session,true);RAISE EXCEPTION 'TRANSFER_CONTROL_REQUIRED';END;$$;
CREATE OR REPLACE FUNCTION public.admin_retailer_transfer_transition(p_session uuid,p_id text,p_transfer text,p_from text,p_to text,p_reason text,p_request uuid) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$ BEGIN PERFORM public.inventory_admin_actor(p_session,true);RAISE EXCEPTION 'TRANSFER_CONTROL_REQUIRED';END;$$;
-- Existing network projections/guards also need to recognize every open custody state.
DO $compat$ DECLARE r record;definition text;BEGIN
 FOR r IN SELECT p.oid FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname IN ('admin_retailer_save','admin_distributor_link_retailer','admin_retailer_detail','admin_distributor_detail','admin_retailer_review_reconciliation','admin_distributor_review_reconciliation') LOOP
  definition:=pg_get_functiondef(r.oid);definition:=replace(definition,'status IN (''REQUESTED'',''IN_TRANSIT'')','status IN (''REQUESTED'',''APPROVED'',''IN_TRANSIT'',''PARTIALLY_RECEIVED'',''DISCREPANCY'',''RECEIVED'',''RECONCILED'')');
  IF definition LIKE '%review_reconciliation%' THEN definition:=replace(definition,'actor:=public.inventory_admin_actor(p_session,true);','actor:=public.inventory_admin_actor(p_session,true);IF EXISTS(SELECT 1 FROM public.admin_stock_reconciliations WHERE id=p_record AND transfer_id IS NOT NULL) THEN RAISE EXCEPTION ''TRANSFER_CONTROL_REQUIRED'';END IF;');END IF;
  EXECUTE definition;
 END LOOP;
END;$compat$;
ALTER TABLE public.admin_export_jobs ADD COLUMN transfer_filters jsonb,ADD COLUMN transfer_ids text[];
CREATE FUNCTION public.admin_request_transfer_export(p_session uuid,p_filters jsonb,p_ids text[],p_request uuid) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE actor text;job uuid;BEGIN actor:=public.inventory_admin_actor(p_session);
 IF cardinality(p_ids)>100 OR cardinality(p_ids)=0 OR (p_ids IS NOT NULL AND (SELECT count(*) FROM public.admin_stock_transfers WHERE id=ANY(p_ids))<>cardinality(p_ids)) THEN RAISE EXCEPTION 'INVALID_SELECTION';END IF;
 IF (SELECT count(*) FROM public.admin_export_jobs WHERE actor_id=actor AND created_at>now()-interval '1 hour')>=10 THEN RAISE EXCEPTION 'EXPORT_RATE_LIMIT';END IF;
 INSERT INTO public.admin_export_jobs(actor_id,module_key,transfer_filters,transfer_ids,selection_at) VALUES(actor,'transfers',p_filters,p_ids,now()) RETURNING id INTO job;
 INSERT INTO public.admin_audit_logs(actor_id,action,resource_type,resource_id,reason,request_id,after_summary) VALUES(actor,'EXPORT_REQUESTED','reports',job::text,'Scoped transfer custody report',p_request,jsonb_build_object('module','transfers','selected',coalesce(cardinality(p_ids),0)));RETURN job;END;$$;
CREATE FUNCTION public.admin_transfer_export_page(p_job uuid,p_cursor jsonb DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE job record;clause text;result jsonb;BEGIN
 SELECT j.transfer_filters,j.transfer_ids,j.selection_at INTO job FROM public.admin_export_jobs j JOIN public.admin_users a ON a.id=j.actor_id WHERE j.id=p_job AND j.module_key='transfers' AND j.status='PROCESSING' AND j.expires_at>now() AND a.status='ACTIVE' AND a.role IN ('SUPER_ADMIN','OPS_ADMIN','READ_ONLY_ANALYST');IF NOT FOUND THEN RAISE EXCEPTION 'EXPORT_UNAVAILABLE';END IF;
 clause:=public.transfer_filter_clause(coalesce(job.transfer_filters,'{}'))||' AND p.created_at<=$2 AND ($3 IS NULL OR p.id=ANY($3))';IF p_cursor IS NOT NULL THEN clause:=clause||' AND (p.created_at,p.id)<(($4->>''created_at'')::timestamptz,$4->>''id'')';END IF;
 EXECUTE 'SELECT coalesce(jsonb_agg(to_jsonb(r)),''[]'') FROM(SELECT p.reference_code,p.source_name,p.destination_name,p.quantity,p.status,p.received_quantity,p.damaged_quantity,p.missing_quantity,p.carrier,p.tracking_reference,p.expected_arrival,p.created_at,p.id FROM public.admin_transfer_projection p WHERE '||clause||' ORDER BY p.created_at DESC,p.id DESC LIMIT 500)r' INTO result USING coalesce(job.transfer_filters,'{}'),coalesce(job.selection_at,now()),job.transfer_ids,p_cursor;RETURN result;END;$$;
REVOKE ALL ON FUNCTION public.admin_request_transfer_export(uuid,jsonb,text[],uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.admin_request_transfer_export(uuid,jsonb,text[],uuid) TO service_role;
CREATE OR REPLACE VIEW public.admin_distributor_projection WITH(security_invoker=true) AS
WITH custody AS (
 SELECT current_distributor_id AS id,count(*) FILTER(WHERE status='WITH_DISTRIBUTOR')::integer AS on_hand
 FROM public.qr_stickers WHERE current_distributor_id IS NOT NULL AND current_retailer_id IS NULL AND NOT EXISTS(SELECT 1 FROM public.admin_stock_transfer_items ti JOIN public.admin_stock_transfers tr ON tr.id=ti.transfer_id WHERE ti.qr_id=qr_stickers.id AND ti.released_at IS NULL AND tr.status IN ('IN_TRANSIT','PARTIALLY_RECEIVED','DISCREPANCY')) GROUP BY current_distributor_id
), transfers AS (
 SELECT destination_partner_id AS id,coalesce(sum(quantity-received_quantity-damaged_quantity-missing_quantity) FILTER(WHERE status IN ('IN_TRANSIT','PARTIALLY_RECEIVED','DISCREPANCY')),0)::integer AS in_transit,
 count(*) FILTER(WHERE status IN ('REQUESTED','APPROVED','IN_TRANSIT','PARTIALLY_RECEIVED','DISCREPANCY','RECEIVED','RECONCILED'))::integer AS open_transfers,max(updated_at) AS moved_at
 FROM public.admin_stock_transfers GROUP BY destination_partner_id
), retailers AS (SELECT parent_distributor_id AS id,count(*)::integer AS retailer_count FROM public.admin_partners WHERE kind='RETAILER' AND parent_distributor_id IS NOT NULL GROUP BY parent_distributor_id),
 territories AS (SELECT partner_id AS id,count(*)::integer AS territory_count FROM public.admin_partner_territories GROUP BY partner_id),
 reconciliation AS (SELECT partner_id AS id,coalesce(sum(abs(variance)) FILTER(WHERE status<>'CLOSED'),0)::integer AS unresolved_variance,count(*) FILTER(WHERE status<>'CLOSED' AND variance<>0)::integer AS reconciliation_issues FROM public.admin_stock_reconciliations GROUP BY partner_id)
SELECT p.id,p.reference_code,p.name,p.city,p.status,p.verification_status,p.state_code,p.district_code,
 s.name AS state_name,d.name AS district_name,coalesce(c.on_hand,0) AS on_hand,coalesce(t.in_transit,0) AS in_transit,
 coalesce(t.open_transfers,0) AS open_transfers,coalesce(r.retailer_count,0) AS retailer_count,coalesce(a.territory_count,0) AS territory_count,
 coalesce(v.unresolved_variance,0) AS unresolved_variance,coalesce(v.reconciliation_issues,0) AS reconciliation_issues,
 p.created_at,p.updated_at,greatest(p.updated_at,t.moved_at) AS last_activity_at
FROM public.admin_partners p LEFT JOIN public.admin_geo_states s ON s.code=p.state_code
LEFT JOIN public.admin_geo_districts d ON d.code=p.district_code LEFT JOIN custody c ON c.id=p.id
LEFT JOIN transfers t ON t.id=p.id LEFT JOIN retailers r ON r.id=p.id LEFT JOIN territories a ON a.id=p.id
LEFT JOIN reconciliation v ON v.id=p.id WHERE p.kind='DISTRIBUTOR';
CREATE OR REPLACE VIEW public.admin_retailer_projection WITH(security_invoker=true) AS
WITH stock AS(
 SELECT q.current_retailer_id AS id,
 count(*) FILTER(WHERE q.status='WITH_RETAILER' AND q.activated_at IS NULL AND q.user_id IS NULL AND q.vehicle_id IS NULL)::integer AS on_hand,
 count(*) FILTER(WHERE q.status='WITH_RETAILER' AND q.activated_at IS NULL AND q.user_id IS NULL AND q.vehicle_id IS NULL AND i.qr_id IS NOT NULL)::integer AS reserved,
 count(*) FILTER(WHERE b.inventory_channel='OFFLINE_RETAIL' AND q.activated_at>=date_trunc('day',now() AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'Asia/Kolkata')::integer AS activations_today,
 count(*) FILTER(WHERE b.inventory_channel='OFFLINE_RETAIL' AND q.activated_at>=now()-interval '7 days')::integer AS activations_7d,
 count(*) FILTER(WHERE b.inventory_channel='OFFLINE_RETAIL' AND q.activated_at>=now()-interval '30 days')::integer AS activations_30d,
 max(q.activated_at) FILTER(WHERE b.inventory_channel='OFFLINE_RETAIL') AS last_activation_at
 FROM public.qr_stickers q LEFT JOIN public.qr_batches b ON b.id=q.batch_id
 LEFT JOIN public.admin_stock_transfer_items i ON i.qr_id=q.id AND i.released_at IS NULL
 WHERE q.current_retailer_id IS NOT NULL GROUP BY q.current_retailer_id
), movement AS(
 SELECT destination_partner_id AS id,coalesce(sum(quantity-received_quantity-damaged_quantity-missing_quantity) FILTER(WHERE status IN ('IN_TRANSIT','PARTIALLY_RECEIVED','DISCREPANCY')),0)::integer AS in_transit,
 max(updated_at) FILTER(WHERE status='RECEIVED') AS last_receipt_at,max(updated_at) AS moved_at
 FROM public.admin_stock_transfers GROUP BY destination_partner_id
), reconciliation AS(
 SELECT partner_id AS id,coalesce(sum(abs(variance)) FILTER(WHERE status<>'CLOSED'),0)::integer AS unresolved_variance,
 count(*) FILTER(WHERE status<>'CLOSED' AND variance<>0)::integer AS reconciliation_issues FROM public.admin_stock_reconciliations GROUP BY partner_id
)
SELECT p.id,p.reference_code,p.name,p.city,p.status,p.verification_status,p.state_code,p.district_code,s.name AS state_name,d.name AS district_name,
 p.parent_distributor_id,dp.name AS distributor_name,dp.reference_code AS distributor_reference,dp.status AS distributor_status,p.stock_threshold,
 coalesce(c.on_hand,0) AS on_hand,coalesce(c.reserved,0) AS reserved,coalesce(c.on_hand,0)-coalesce(c.reserved,0) AS available,
 coalesce(m.in_transit,0) AS in_transit,coalesce(c.activations_today,0) AS activations_today,coalesce(c.activations_7d,0) AS activations_7d,
 coalesce(c.activations_30d,0) AS activations_30d,c.last_activation_at,m.last_receipt_at,coalesce(v.unresolved_variance,0) AS unresolved_variance,
 coalesce(v.reconciliation_issues,0) AS reconciliation_issues,p.created_at,p.updated_at,greatest(p.updated_at,m.moved_at,c.last_activation_at) AS last_activity_at
FROM public.admin_partners p LEFT JOIN public.admin_partners dp ON dp.id=p.parent_distributor_id LEFT JOIN public.admin_geo_states s ON s.code=p.state_code
LEFT JOIN public.admin_geo_districts d ON d.code=p.district_code LEFT JOIN stock c ON c.id=p.id LEFT JOIN movement m ON m.id=p.id
LEFT JOIN reconciliation v ON v.id=p.id WHERE p.kind='RETAILER';

DO $grants$ DECLARE r record;BEGIN FOR r IN SELECT p.oid::regprocedure sig FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND (p.proname LIKE 'admin_transfer_%' OR p.proname IN ('transfer_eligible','transfer_filter_clause')) LOOP EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated',r.sig);EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role',r.sig);END LOOP;END;$grants$;
NOTIFY pgrst,'reload schema';
COMMIT;
