-- Risk Intelligence uses the existing admin production data model.
-- No examples or accounts are seeded. Rules flag observations, never establish fraud.
BEGIN;
CREATE TABLE public.risk_cases (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), reference_code text NOT NULL UNIQUE DEFAULT ('CASE-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,16))),
 title text NOT NULL CHECK(length(title) BETWEEN 1 AND 200),priority text NOT NULL CHECK(priority IN ('INFORMATIONAL','REVIEW','HIGH_ATTENTION','CRITICAL_SECURITY')),
 status text NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN','INVESTIGATING','MONITORING','RESOLVED','CLOSED')),
 -- RESTRICT: investigations and operator responsibility must survive account/QR changes.
 primary_qr_id text REFERENCES public.qr_stickers(id) ON DELETE RESTRICT,
 assigned_admin_id text REFERENCES public.admin_users(id) ON DELETE RESTRICT,
 resolution text,resolution_reason text,revision integer NOT NULL DEFAULT 0 CHECK(revision>=0),
 opened_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),resolved_at timestamptz,closed_at timestamptz
);
CREATE UNIQUE INDEX risk_one_open_case_qr ON public.risk_cases(primary_qr_id) WHERE status IN ('OPEN','INVESTIGATING','MONITORING');
CREATE INDEX risk_case_cursor ON public.risk_cases(opened_at DESC,id DESC);
CREATE INDEX risk_case_assignee ON public.risk_cases(assigned_admin_id,status);
CREATE INDEX risk_case_reference ON public.risk_cases(reference_code text_pattern_ops);
CREATE TABLE public.risk_signals (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),reference_code text NOT NULL UNIQUE DEFAULT ('SIG-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,16))),
 rule_key text NOT NULL,rule_version integer NOT NULL CHECK(rule_version>0),source_type text NOT NULL CHECK(source_type IN ('ACTIVATION','SCAN')),
 source_event_id text NOT NULL,title text NOT NULL,category text NOT NULL CHECK(category IN ('ACTIVATION','SCAN','REPLACEMENT','LIFECYCLE')),
 severity text NOT NULL CHECK(severity IN ('INFORMATIONAL','REVIEW','HIGH_ATTENTION','CRITICAL_SECURITY')),
 review_status text NOT NULL DEFAULT 'UNREVIEWED' CHECK(review_status IN ('UNREVIEWED','INVESTIGATING','MONITORING','RESOLVED','DISMISSED')),
 -- RESTRICT: risk evidence must not disappear if the QR or vehicle is deleted.
 qr_id text NOT NULL REFERENCES public.qr_stickers(id) ON DELETE RESTRICT,
 vehicle_id text REFERENCES public.vehicles(id) ON DELETE RESTRICT,
 case_id uuid REFERENCES public.risk_cases(id) ON DELETE RESTRICT,
 observed_at timestamptz NOT NULL,first_observed_at timestamptz NOT NULL,event_count integer NOT NULL DEFAULT 1 CHECK(event_count>0),
 evidence_summary text NOT NULL CHECK(length(evidence_summary)<=1000),resolution text,resolution_reason text,resolved_at timestamptz,
 revision integer NOT NULL DEFAULT 0 CHECK(revision>=0),created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(rule_key,rule_version,source_type,source_event_id),CHECK(first_observed_at<=observed_at)
);
CREATE INDEX risk_signal_cursor ON public.risk_signals(observed_at DESC,id DESC);
CREATE INDEX risk_signal_status_cursor ON public.risk_signals(review_status,observed_at DESC,id DESC);
CREATE INDEX risk_signal_severity_cursor ON public.risk_signals(severity,observed_at DESC,id DESC);
CREATE INDEX risk_signal_qr_cursor ON public.risk_signals(qr_id,observed_at DESC,id DESC);
CREATE INDEX risk_signal_case ON public.risk_signals(case_id,observed_at DESC,id DESC);
CREATE INDEX risk_signal_vehicle ON public.risk_signals(vehicle_id);
CREATE INDEX risk_signal_reference ON public.risk_signals(reference_code text_pattern_ops);
CREATE TABLE public.risk_signal_events (
 -- RESTRICT: normalized evidence remains retained alongside the signal.
 signal_id uuid NOT NULL REFERENCES public.risk_signals(id) ON DELETE RESTRICT,
 source_type text NOT NULL,source_event_id text NOT NULL,title text NOT NULL,description text NOT NULL,
 occurred_at timestamptz NOT NULL,PRIMARY KEY(signal_id,source_type,source_event_id)
);
CREATE TABLE public.risk_commands (
 request_id uuid PRIMARY KEY,actor_id text NOT NULL REFERENCES public.admin_users(id) ON DELETE RESTRICT,
 kind text NOT NULL,target_id uuid NOT NULL,payload jsonb NOT NULL,result jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX risk_command_actor ON public.risk_commands(actor_id,created_at DESC);
DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['risk_cases','risk_signals','risk_signal_events','risk_commands'] LOOP
 EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon,authenticated',t);
 EXECUTE format('REVOKE ALL ON public.%I FROM service_role',t);
 EXECUTE format('GRANT SELECT,INSERT ON public.%I TO service_role',t);
 END LOOP; END; $$;
GRANT UPDATE ON public.risk_cases,public.risk_signals TO service_role;
CREATE TRIGGER risk_evidence_immutable BEFORE UPDATE OR DELETE ON public.risk_signal_events FOR EACH ROW EXECUTE FUNCTION public.admin_audit_immutable();
CREATE TRIGGER risk_commands_immutable BEFORE UPDATE OR DELETE ON public.risk_commands FOR EACH ROW EXECUTE FUNCTION public.admin_audit_immutable();
CREATE TRIGGER risk_signals_retained BEFORE DELETE ON public.risk_signals FOR EACH ROW EXECUTE FUNCTION public.admin_audit_immutable();
CREATE TRIGGER risk_cases_retained BEFORE DELETE ON public.risk_cases FOR EACH ROW EXECUTE FUNCTION public.admin_audit_immutable();

-- Typed observation rules. No velocity thresholds or inferred geography are invented.
-- Factual source outcomes are selected once; evidence is snapshotted without secrets/hashes.
CREATE FUNCTION public.risk_capture_event(p_source text,p_event text) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE qr text; vehicle text; happened timestamptz; outcome text; title text; explanation text; sev text; category text; rule text; signal uuid;
BEGIN
 IF p_source='ACTIVATION' THEN
  SELECT a.qr_id,q.vehicle_id,a.created_at,a.outcome INTO qr,vehicle,happened,outcome FROM public.qr_activation_attempts a JOIN public.qr_stickers q ON q.id=a.qr_id WHERE a.id=p_event AND a.outcome<>'SUCCESS';
  IF qr IS NULL THEN RETURN;END IF;
  category:='ACTIVATION';rule:='activation.rejected';sev:='REVIEW';
  CASE outcome
   WHEN 'VEHICLE_MISMATCH' THEN title:='Potential vehicle identity mismatch';explanation:='The activation service rejected a vehicle association that did not match its expected identity.';
   WHEN 'QR_LOCKED' THEN title:='Activation protection engaged';explanation:='The activation service rejected an attempt while this QR was locked by its existing protection policy.';
   WHEN 'RATE_LIMITED' THEN title:='Activation rate limit reached';explanation:='The activation service rejected a request under its existing attempt-rate policy.';
   WHEN 'ALREADY_ACTIVATED' THEN title:='Attempt to claim an activated QR';explanation:='An activation attempt was rejected because this QR already had an activation. Review owner or support context before deciding.';
   WHEN 'INVALID_SECRET' THEN title:='Activation proof rejected';explanation:='The activation service rejected a submitted possession proof. This can be an entry error; review related events before deciding.';
   ELSE title:='Activation rejected';explanation:='The activation service recorded an unsuccessful claim. No conclusion about intent has been established.';
  END CASE;
 ELSIF p_source='SCAN' THEN
  SELECT a.qr_id,q.vehicle_id,a.created_at,a.result INTO qr,vehicle,happened,outcome FROM public.qr_scan_events a JOIN public.qr_stickers q ON q.id=a.qr_id WHERE a.id=p_event AND a.result IN ('RESOLVED_BLOCKED','RESOLVED_REPLACED');
  IF qr IS NULL THEN RETURN;END IF;
  category:='LIFECYCLE';rule:='scan.unavailable_identity';sev:='INFORMATIONAL';
  IF outcome='RESOLVED_REPLACED' THEN title:='Activity on a replaced QR';explanation:='The public resolver recorded a scan that resolved to the replacement state. This may be expected during sticker handover; inspect replacement context.';
  ELSE title:='Activity on a blocked QR';explanation:='The public resolver recorded an interaction with a blocked identity. The resolver protection remained in effect.';END IF;
 ELSE RAISE EXCEPTION 'INVALID_SOURCE';END IF;
 INSERT INTO public.risk_signals(rule_key,rule_version,source_type,source_event_id,title,category,severity,qr_id,vehicle_id,observed_at,first_observed_at,evidence_summary)
 VALUES(rule,1,p_source,p_event,title,category,sev,qr,vehicle,happened,happened,explanation) ON CONFLICT(rule_key,rule_version,source_type,source_event_id) DO NOTHING RETURNING id INTO signal;
 IF signal IS NOT NULL THEN INSERT INTO public.risk_signal_events(signal_id,source_type,source_event_id,title,description,occurred_at) VALUES(signal,p_source,p_event,title,explanation,happened);END IF;
END;$$;
CREATE FUNCTION public.risk_source_insert() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF TG_TABLE_NAME='qr_activation_attempts' THEN PERFORM public.risk_capture_event('ACTIVATION',NEW.id::text);ELSE PERFORM public.risk_capture_event('SCAN',NEW.id::text);END IF;RETURN NEW;
END;$$;
-- These production writes already use service_role. One indexed lookup + one insert;
-- no historical correlation or heavy aggregation runs in the customer request.
CREATE TRIGGER risk_activation_event AFTER INSERT ON public.qr_activation_attempts FOR EACH ROW WHEN(NEW.outcome<>'SUCCESS') EXECUTE FUNCTION public.risk_source_insert();
CREATE TRIGGER risk_scan_event AFTER INSERT ON public.qr_scan_events FOR EACH ROW WHEN(NEW.result IN ('RESOLVED_BLOCKED','RESOLVED_REPLACED')) EXECUTE FUNCTION public.risk_source_insert();

CREATE FUNCTION public.risk_admin_actor(p_session uuid,p_write boolean DEFAULT false) RETURNS text LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path='' AS $$
DECLARE actor text;BEGIN
 SELECT a.id INTO actor FROM public.admin_sessions s JOIN public.admin_users a ON a.id=s.admin_id
 WHERE s.id=p_session AND s.revoked_at IS NULL AND s.expires_at>now() AND s.created_at>now()-interval '4 hours' AND s.email_verified_at IS NOT NULL AND a.status='ACTIVE'
 AND a.role IN ('SUPER_ADMIN','OPS_ADMIN','SUPPORT_AGENT','READ_ONLY_ANALYST') AND (NOT p_write OR a.role IN ('SUPER_ADMIN','OPS_ADMIN'));
 IF actor IS NULL THEN RAISE EXCEPTION 'ADMIN_REQUIRED';END IF;RETURN actor;
END;$$;
CREATE VIEW public.admin_risk_projection WITH(security_invoker=true) AS
 SELECT s.id,s.reference_code,s.title,s.category,s.severity,s.review_status,s.rule_key,s.rule_version,s.observed_at,s.first_observed_at,s.event_count,s.evidence_summary,s.revision,
 s.qr_id,q.visible_code,q.status AS qr_status,s.vehicle_id,nullif(trim(coalesce(v.make,'')||' '||coalesce(v.model,'')),'') AS vehicle_label,
 CASE WHEN v.registration_number IS NOT NULL THEN substr(v.registration_number,1,4)||' •••• '||right(v.registration_number,4) END AS registration_masked,
 CASE WHEN v.user_id IS NOT NULL THEN 'CUS-••'||upper(right(md5(v.user_id::text),6)) END AS customer_reference,
 s.case_id,c.reference_code AS case_reference,c.status AS case_status,a.name AS assigned_name
 FROM public.risk_signals s LEFT JOIN public.qr_stickers q ON q.id=s.qr_id LEFT JOIN public.vehicles v ON v.id=s.vehicle_id
 LEFT JOIN public.risk_cases c ON c.id=s.case_id LEFT JOIN public.admin_users a ON a.id=c.assigned_admin_id;
REVOKE ALL ON public.admin_risk_projection FROM PUBLIC,anon,authenticated;GRANT SELECT ON public.admin_risk_projection TO service_role;

-- No function-local SET: allow PostgreSQL to inline this SQL projection so that
-- LIMIT/cursor predicates reach the observed_at index. Relations are qualified;
-- this invoker function is private to the server service role.
CREATE FUNCTION public.risk_filtered(p_filters jsonb,p_actor text) RETURNS SETOF public.admin_risk_projection LANGUAGE sql STABLE SECURITY INVOKER AS $$
 SELECT r.id,r.reference_code,r.title,r.category,r.severity,r.review_status,r.rule_key,r.rule_version,r.observed_at,r.first_observed_at,r.event_count,r.evidence_summary,r.revision,r.qr_id,r.visible_code,r.qr_status,r.vehicle_id,r.vehicle_label,r.registration_masked,r.customer_reference,r.case_id,r.case_reference,r.case_status,r.assigned_name FROM public.admin_risk_projection r WHERE true
 AND (coalesce(p_filters->>'severity','')='' OR r.severity=p_filters->>'severity')
 AND (coalesce(p_filters->>'category','')='' OR r.category=p_filters->>'category')
 AND (coalesce(p_filters->>'status','')='' OR r.review_status=p_filters->>'status')
 AND (coalesce(p_filters->>'scope','')<>'high_attention' OR (r.severity IN ('HIGH_ATTENTION','CRITICAL_SECURITY') AND r.review_status NOT IN ('RESOLVED','DISMISSED')))
 AND (coalesce(p_filters->>'period','')<>'24h' OR r.observed_at>=now()-interval '24 hours')
 AND (coalesce(p_filters->>'lifecycle','')='' OR r.qr_status=p_filters->>'lifecycle')
 AND (coalesce(p_filters->>'from','')='' OR r.observed_at>=(p_filters->>'from')::date::timestamp AT TIME ZONE 'Asia/Kolkata')
 AND (coalesce(p_filters->>'to','')='' OR r.observed_at<((p_filters->>'to')::date+1)::timestamp AT TIME ZONE 'Asia/Kolkata')
 AND (coalesce(p_filters->>'scope','')<>'resolved_today' OR EXISTS(SELECT 1 FROM public.risk_signals x WHERE x.id=r.id AND x.resolved_at>=date_trunc('day',now() AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'Asia/Kolkata'))
 AND (coalesce(p_filters->>'hasCase','')='' OR ((p_filters->>'hasCase'='yes')=(r.case_id IS NOT NULL)))
 AND (coalesce(p_filters->>'assignment','')='' OR EXISTS(SELECT 1 FROM public.risk_cases c WHERE c.id=r.case_id AND c.assigned_admin_id=p_actor AND p_filters->>'assignment'='mine') OR (p_filters->>'assignment'='unassigned' AND r.assigned_name IS NULL))
 AND (coalesce(p_filters->>'q','')='' OR r.reference_code LIKE (p_filters->>'q')||'%' OR r.visible_code LIKE (p_filters->>'q')||'%' OR r.case_reference LIKE (p_filters->>'q')||'%' OR r.customer_reference LIKE (p_filters->>'q')||'%' OR EXISTS(SELECT 1 FROM public.vehicles v WHERE v.id=r.vehicle_id AND upper(replace(v.registration_number,' ','')) LIKE replace(p_filters->>'q',' ','')||'%'));
$$;
CREATE FUNCTION public.admin_risk_signals(p_session uuid,p_filters jsonb DEFAULT '{}',p_cursor jsonb DEFAULT NULL,p_limit integer DEFAULT 51) RETURNS SETOF public.admin_risk_projection LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path='' AS $$
DECLARE actor text;BEGIN actor:=public.risk_admin_actor(p_session);
 RETURN QUERY SELECT r.id,r.reference_code,r.title,r.category,r.severity,r.review_status,r.rule_key,r.rule_version,r.observed_at,r.first_observed_at,r.event_count,r.evidence_summary,r.revision,r.qr_id,r.visible_code,r.qr_status,r.vehicle_id,r.vehicle_label,r.registration_masked,r.customer_reference,r.case_id,r.case_reference,r.case_status,r.assigned_name
 FROM public.risk_filtered(p_filters,actor) r WHERE (p_cursor IS NULL OR (r.observed_at,r.id)<((p_cursor->>'at')::timestamptz,(p_cursor->>'id')::uuid)) ORDER BY r.observed_at DESC,r.id DESC LIMIT least(greatest(p_limit,1),501);
END;$$;
CREATE FUNCTION public.admin_risk_summary(p_session uuid) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path='' AS $$
BEGIN PERFORM public.risk_admin_actor(p_session);RETURN (SELECT jsonb_build_object('unreviewed',count(*) FILTER(WHERE review_status='UNREVIEWED'),'high',count(*) FILTER(WHERE severity IN ('HIGH_ATTENTION','CRITICAL_SECURITY') AND review_status NOT IN ('RESOLVED','DISMISSED')),'investigating',count(*) FILTER(WHERE review_status='INVESTIGATING'),'monitoring',count(*) FILTER(WHERE review_status='MONITORING'),'resolvedToday',count(*) FILTER(WHERE resolved_at>=date_trunc('day',now() AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'Asia/Kolkata')) FROM public.risk_signals);END;$$;
CREATE FUNCTION public.admin_risk_pulse(p_session uuid) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path='' AS $$
DECLARE events jsonb;BEGIN PERFORM public.risk_admin_actor(p_session);SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY r.observed_at DESC,r.id DESC),'[]') INTO events FROM (SELECT id,reference_code,title,severity,observed_at FROM public.risk_signals WHERE observed_at>=now()-interval '24 hours' ORDER BY observed_at DESC,id DESC LIMIT 101) r;
 RETURN jsonb_build_object('from',now()-interval '24 hours','to',now(),'events',(SELECT coalesce(jsonb_agg(e.value),'[]') FROM jsonb_array_elements(events) WITH ORDINALITY e WHERE e.ordinality<=100),'truncated',jsonb_array_length(events)>100);END;$$;
CREATE FUNCTION public.admin_risk_patterns(p_session uuid,p_filters jsonb DEFAULT '{}') RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path='' AS $$
DECLARE actor text;BEGIN actor:=public.risk_admin_actor(p_session);RETURN (SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]') FROM (SELECT category,severity,qr_status AS lifecycle,count(*) AS total,count(*) FILTER(WHERE review_status='UNREVIEWED') AS unreviewed,count(*) FILTER(WHERE review_status='DISMISSED') AS dismissed FROM public.risk_filtered(p_filters,actor) p GROUP BY category,severity,qr_status ORDER BY count(*) DESC LIMIT 100) r);END;$$;
CREATE FUNCTION public.admin_risk_cases(p_session uuid,p_filters jsonb DEFAULT '{}',p_cursor jsonb DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path='' AS $$
DECLARE actor text;BEGIN actor:=public.risk_admin_actor(p_session);RETURN (SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY r.opened_at DESC,r.id DESC),'[]') FROM (
 SELECT c.id,c.reference_code,c.title,c.priority,c.status,a.name AS assigned_name,c.opened_at,c.updated_at,c.revision,c.resolution,c.resolution_reason,(SELECT count(*) FROM public.risk_signals s WHERE s.case_id=c.id) AS signal_count
 FROM public.risk_cases c LEFT JOIN public.admin_users a ON a.id=c.assigned_admin_id
 WHERE (p_cursor IS NULL OR (c.opened_at,c.id)<((p_cursor->>'at')::timestamptz,(p_cursor->>'id')::uuid))
 AND (coalesce(p_filters->>'q','')='' OR c.reference_code LIKE (p_filters->>'q')||'%' OR EXISTS(SELECT 1 FROM public.risk_signals s WHERE s.case_id=c.id AND s.id IN (SELECT id FROM public.risk_filtered(p_filters,actor))))
 AND (coalesce(p_filters->>'severity','')='' OR c.priority=p_filters->>'severity')
 AND (coalesce(p_filters->>'status','')='' OR c.status=CASE p_filters->>'status' WHEN 'UNREVIEWED' THEN 'OPEN' ELSE p_filters->>'status' END)
 AND (coalesce(p_filters->>'assignment','')='' OR (p_filters->>'assignment'='mine' AND c.assigned_admin_id=actor) OR (p_filters->>'assignment'='unassigned' AND c.assigned_admin_id IS NULL))
 AND (coalesce(p_filters->>'from','')='' OR c.opened_at>=(p_filters->>'from')::date::timestamp AT TIME ZONE 'Asia/Kolkata')
 AND (coalesce(p_filters->>'period','')<>'24h' OR c.opened_at>=now()-interval '24 hours')
 AND (coalesce(p_filters->>'to','')='' OR c.opened_at<((p_filters->>'to')::date+1)::timestamp AT TIME ZONE 'Asia/Kolkata')
 AND (coalesce(p_filters->>'category','')='' AND coalesce(p_filters->>'lifecycle','')='' AND coalesce(p_filters->>'hasCase','')='' AND coalesce(p_filters->>'scope','')='' OR EXISTS(SELECT 1 FROM public.risk_signals s WHERE s.case_id=c.id AND s.id IN (SELECT id FROM public.risk_filtered(p_filters,actor))))
 ORDER BY c.opened_at DESC,c.id DESC LIMIT 51) r);END;$$;

-- Private RPCs revalidate sessions. All consumers use bounded, masked projections.
CREATE FUNCTION public.admin_risk_signal_detail(p_session uuid,p_id uuid) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path='' AS $$
DECLARE s public.admin_risk_projection; events jsonb; context_events jsonb; related jsonb; audit jsonb; c jsonb;BEGIN
 PERFORM public.risk_admin_actor(p_session);s:=(SELECT r FROM public.admin_risk_projection r WHERE r.id=p_id);IF s.id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND';END IF;
 SELECT coalesce(jsonb_agg(to_jsonb(e) ORDER BY e.occurred_at,e.id),'[]') INTO events FROM (
  SELECT source_event_id AS id,source_type AS source,title,description,occurred_at,'source evidence'::text AS relation,NULL::text AS reference FROM public.risk_signal_events WHERE signal_id=p_id ORDER BY occurred_at DESC,source_event_id DESC LIMIT 51
 ) e;
 SELECT coalesce(jsonb_agg(to_jsonb(e) ORDER BY e.occurred_at,e.id),'[]') INTO context_events FROM (
  (SELECT a.id,'ACTIVATION'::text AS source,CASE WHEN a.outcome='SUCCESS' THEN 'Activation accepted' ELSE 'Activation rejected' END AS title,replace(a.outcome,'_',' ') AS description,a.created_at AS occurred_at,'same QR · context'::text AS relation,NULL::text AS reference,NULL::text AS href FROM public.qr_activation_attempts a WHERE a.qr_id=s.qr_id AND a.created_at BETWEEN s.observed_at-interval '24 hours' AND s.observed_at+interval '24 hours' AND NOT EXISTS(SELECT 1 FROM public.risk_signal_events e WHERE e.signal_id=p_id AND e.source_type='ACTIVATION' AND e.source_event_id=a.id) ORDER BY a.created_at DESC,a.id DESC LIMIT 15)
  UNION ALL
  (SELECT a.id,'SCAN',CASE WHEN a.result='RESOLVED_ACTIVE' THEN 'QR resolved to safety view' ELSE 'QR scan recorded' END,replace(a.result,'_',' '),a.created_at,'same QR · context',NULL,NULL FROM public.qr_scan_events a WHERE a.qr_id=s.qr_id AND a.created_at BETWEEN s.observed_at-interval '24 hours' AND s.observed_at+interval '24 hours' AND NOT EXISTS(SELECT 1 FROM public.risk_signal_events e WHERE e.signal_id=p_id AND e.source_type='SCAN' AND e.source_event_id=a.id) ORDER BY a.created_at DESC,a.id DESC LIMIT 15)
  UNION ALL
  (SELECT r.id,'REPLACEMENT','Replacement requested',replace(r.reason,'_',' ')||' · current state: '||replace(r.status,'_',' '),r.requested_at,'same QR · context',r.reference_code,'/replacements/'||r.id FROM public.replacement_requests r WHERE r.old_qr_sticker_id=s.qr_id OR r.new_qr_sticker_id=s.qr_id ORDER BY r.requested_at DESC,r.id DESC LIMIT 10)
  UNION ALL
  (SELECT h.id,'LIFECYCLE','QR lifecycle transition',coalesce(h.from_status,'Unrecorded')||' → '||h.to_status,h.created_at,'same QR · context',NULL,NULL FROM public.qr_status_history h WHERE h.qr_id=s.qr_id AND h.created_at BETWEEN s.observed_at-interval '24 hours' AND s.observed_at+interval '24 hours' ORDER BY h.created_at DESC,h.id DESC LIMIT 10)
 ) e;
 SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]') INTO related FROM (SELECT p.id,p.reference_code,p.title,p.category,p.severity,p.review_status,p.rule_key,p.rule_version,p.observed_at,p.first_observed_at,p.event_count,p.evidence_summary,p.revision,p.qr_id,p.visible_code,p.qr_status,p.vehicle_id,p.vehicle_label,p.registration_masked,p.customer_reference,p.case_id,p.case_reference,p.case_status,p.assigned_name FROM public.admin_risk_projection p WHERE p.qr_id=s.qr_id AND p.id<>p_id ORDER BY p.observed_at DESC,p.id DESC LIMIT 10) r;
 SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]') INTO audit FROM (SELECT l.action,l.reason,a.name AS actor,l.created_at AS occurred_at FROM public.admin_audit_logs l JOIN public.admin_users a ON a.id=l.actor_id WHERE l.resource_type='risk_signal' AND l.resource_id=p_id::text ORDER BY l.created_at DESC,l.id DESC LIMIT 50) r;
 IF s.case_id IS NOT NULL THEN SELECT jsonb_build_object('id',x.id,'reference_code',x.reference_code,'title',x.title,'priority',x.priority,'status',x.status,'assigned_name',a.name,'opened_at',x.opened_at,'updated_at',x.updated_at,'revision',x.revision,'resolution',x.resolution,'resolution_reason',x.resolution_reason) INTO c FROM public.risk_cases x LEFT JOIN public.admin_users a ON a.id=x.assigned_admin_id WHERE x.id=s.case_id;END IF;
 RETURN jsonb_build_object('signal',to_jsonb(s),'case',c,'events',(SELECT coalesce(jsonb_agg(e.value ORDER BY (e.value->>'occurred_at')::timestamptz,e.value->>'id'),'[]') FROM jsonb_array_elements(events||context_events) e),'related',related,'audit',audit,'evidenceTruncated',jsonb_array_length(events)>50,'contextTruncated',jsonb_array_length(context_events)>=50,'resolution',(SELECT resolution FROM public.risk_signals WHERE id=p_id),'resolutionReason',(SELECT resolution_reason FROM public.risk_signals WHERE id=p_id));
END;$$;
CREATE FUNCTION public.admin_risk_case_detail(p_session uuid,p_id uuid) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path='' AS $$
DECLARE c jsonb;signals jsonb;events jsonb;audit jsonb;BEGIN PERFORM public.risk_admin_actor(p_session);
 SELECT jsonb_build_object('id',x.id,'reference_code',x.reference_code,'title',x.title,'priority',x.priority,'status',x.status,'assigned_name',a.name,'opened_at',x.opened_at,'updated_at',x.updated_at,'revision',x.revision,'resolution',x.resolution,'resolution_reason',x.resolution_reason,'signal_count',(SELECT count(*) FROM public.risk_signals s WHERE s.case_id=x.id)) INTO c FROM public.risk_cases x LEFT JOIN public.admin_users a ON a.id=x.assigned_admin_id WHERE x.id=p_id;IF c IS NULL THEN RAISE EXCEPTION 'NOT_FOUND';END IF;
 SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]') INTO signals FROM (SELECT p.id,p.reference_code,p.title,p.category,p.severity,p.review_status,p.rule_key,p.rule_version,p.observed_at,p.first_observed_at,p.event_count,p.evidence_summary,p.revision,p.qr_id,p.visible_code,p.qr_status,p.vehicle_id,p.vehicle_label,p.registration_masked,p.customer_reference,p.case_id,p.case_reference,p.case_status,p.assigned_name FROM public.admin_risk_projection p WHERE p.case_id=p_id ORDER BY p.observed_at DESC,p.id DESC LIMIT 50) r;
 SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY r.occurred_at,r.id),'[]') INTO events FROM (SELECT e.source_event_id AS id,e.source_type AS source,e.title,e.description,e.occurred_at,'case source evidence'::text AS relation,s.reference_code AS reference FROM public.risk_signal_events e JOIN public.risk_signals s ON s.id=e.signal_id WHERE s.case_id=p_id ORDER BY e.occurred_at DESC,e.source_event_id DESC LIMIT 100) r;
 SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]') INTO audit FROM (SELECT l.action,l.reason,a.name AS actor,l.created_at AS occurred_at FROM public.admin_audit_logs l JOIN public.admin_users a ON a.id=l.actor_id WHERE l.resource_type='risk_case' AND l.resource_id=p_id::text ORDER BY l.created_at DESC,l.id DESC LIMIT 50) r;
 RETURN jsonb_build_object('record',c,'signals',signals,'events',events,'audit',audit,'truncated',(c->>'signal_count')::integer>50 OR jsonb_array_length(events)>=100);END;$$;
CREATE FUNCTION public.admin_risk_options(p_session uuid,p_kind text) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path='' AS $$
BEGIN PERFORM public.risk_admin_actor(p_session,true);
 IF p_kind='investigators' THEN RETURN (SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]') FROM (SELECT id,name AS label FROM public.admin_users WHERE status='ACTIVE' AND role IN ('SUPER_ADMIN','OPS_ADMIN') ORDER BY name,id LIMIT 100) r);
 ELSIF p_kind='cases' THEN RETURN (SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]') FROM (SELECT id,reference_code||' · '||title AS label FROM public.risk_cases WHERE status IN ('OPEN','INVESTIGATING','MONITORING') ORDER BY opened_at DESC,id DESC LIMIT 100) r);ELSE RAISE EXCEPTION 'INVALID_KIND';END IF;END;$$;

CREATE FUNCTION public.admin_risk_command(p_session uuid,p_kind text,p_id uuid,p_action text,p_revision integer,p_reason text,p_outcome text,p_target text,p_request uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE actor text;payload jsonb;prior public.risk_commands;s public.risk_signals;c public.risk_cases;new_case_id uuid;result jsonb;
BEGIN
 actor:=public.risk_admin_actor(p_session,true);
 IF length(trim(p_reason))<10 OR length(p_reason)>1000 THEN RAISE EXCEPTION 'INVALID_REASON';END IF;
 payload:=jsonb_build_object('kind',p_kind,'id',p_id,'action',p_action,'revision',p_revision,'reason',p_reason,'outcome',p_outcome,'target',p_target);
 PERFORM pg_advisory_xact_lock(hashtextextended(p_request::text,0));
 prior:=(SELECT r FROM public.risk_commands r WHERE request_id=p_request);
 IF prior.request_id IS NOT NULL THEN IF prior.actor_id<>actor OR prior.payload<>payload THEN RAISE EXCEPTION 'REQUEST_CONFLICT';END IF;RETURN prior.result;END IF;
 IF p_action IN ('resolve','dismiss','monitor') AND (p_outcome IS NULL OR p_outcome NOT IN ('EXPECTED_ACTIVITY','FALSE_POSITIVE','CUSTOMER_VERIFIED','MONITORING_REQUIRED','DUPLICATE_SIGNAL','OTHER_REVIEWED_OUTCOME') OR (p_action='monitor' AND p_outcome<>'MONITORING_REQUIRED') OR (p_action<>'monitor' AND p_outcome='MONITORING_REQUIRED')) THEN RAISE EXCEPTION 'INVALID_OUTCOME';END IF;
 IF p_kind='signal' THEN
  s:=(SELECT r FROM public.risk_signals r WHERE id=p_id FOR UPDATE);IF s.id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND';END IF;
  IF s.revision<>p_revision THEN RAISE EXCEPTION 'STATE_CHANGED';END IF;
  IF s.review_status IN ('RESOLVED','DISMISSED') THEN RAISE EXCEPTION 'INVALID_TRANSITION';END IF;
  CASE p_action
   WHEN 'review' THEN IF s.review_status<>'UNREVIEWED' THEN RAISE EXCEPTION 'INVALID_TRANSITION';END IF;UPDATE public.risk_signals SET review_status='INVESTIGATING' WHERE id=p_id;
   WHEN 'monitor' THEN UPDATE public.risk_signals SET review_status='MONITORING',resolution=p_outcome,resolution_reason=p_reason WHERE id=p_id;
   WHEN 'resolve','dismiss' THEN UPDATE public.risk_signals SET review_status=CASE WHEN p_action='resolve' THEN 'RESOLVED' ELSE 'DISMISSED' END,resolution=p_outcome,resolution_reason=p_reason,resolved_at=clock_timestamp() WHERE id=p_id;
   WHEN 'create_case' THEN
    IF s.case_id IS NOT NULL THEN RAISE EXCEPTION 'INVALID_TRANSITION';END IF;
    INSERT INTO public.risk_cases(title,priority,primary_qr_id,assigned_admin_id,status) VALUES('QR identity review',s.severity,s.qr_id,actor,'INVESTIGATING') ON CONFLICT(primary_qr_id) WHERE status IN ('OPEN','INVESTIGATING','MONITORING') DO UPDATE SET updated_at=clock_timestamp(),revision=public.risk_cases.revision+1 RETURNING id INTO new_case_id;
    UPDATE public.risk_signals SET case_id=new_case_id,review_status='INVESTIGATING' WHERE id=p_id;
    INSERT INTO public.admin_audit_logs(actor_id,action,resource_type,resource_id,reason,request_id,after_summary) VALUES(actor,'OPEN_INVESTIGATION','risk_case',new_case_id::text,p_reason,p_request,jsonb_build_object('signal',s.reference_code));
   WHEN 'attach_case' THEN
    IF s.case_id IS NOT NULL THEN RAISE EXCEPTION 'INVALID_TRANSITION';END IF;
    c:=(SELECT r FROM public.risk_cases r WHERE id=p_target::uuid FOR UPDATE);IF c.id IS NULL OR c.status NOT IN ('OPEN','INVESTIGATING','MONITORING') THEN RAISE EXCEPTION 'INVALID_CASE';END IF;
    UPDATE public.risk_signals SET case_id=c.id,review_status='INVESTIGATING' WHERE id=p_id;
    UPDATE public.risk_cases SET revision=revision+1,updated_at=clock_timestamp() WHERE id=c.id;
    INSERT INTO public.admin_audit_logs(actor_id,action,resource_type,resource_id,reason,request_id,after_summary) VALUES(actor,'ATTACH_SIGNAL','risk_case',c.id::text,p_reason,p_request,jsonb_build_object('signal',s.reference_code));
   ELSE RAISE EXCEPTION 'INVALID_ACTION';END CASE;
  UPDATE public.risk_signals SET revision=revision+1 WHERE id=p_id;
  INSERT INTO public.admin_audit_logs(actor_id,action,resource_type,resource_id,reason,request_id,before_summary,after_summary) VALUES(actor,upper(p_action),'risk_signal',p_id::text,p_reason,p_request,jsonb_build_object('status',s.review_status,'revision',s.revision),jsonb_build_object('outcome',p_outcome,'case',new_case_id));
 ELSIF p_kind='case' THEN
  c:=(SELECT r FROM public.risk_cases r WHERE id=p_id FOR UPDATE);IF c.id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND';END IF;
  IF c.revision<>p_revision THEN RAISE EXCEPTION 'STATE_CHANGED';END IF;IF c.status='CLOSED' THEN RAISE EXCEPTION 'INVALID_TRANSITION';END IF;
  CASE p_action
   WHEN 'assign' THEN IF NOT EXISTS(SELECT 1 FROM public.admin_users WHERE id=p_target AND status='ACTIVE' AND role IN ('SUPER_ADMIN','OPS_ADMIN')) THEN RAISE EXCEPTION 'INVALID_INVESTIGATOR';END IF;UPDATE public.risk_cases SET assigned_admin_id=p_target WHERE id=p_id;
   WHEN 'note' THEN NULL;
   WHEN 'monitor' THEN UPDATE public.risk_cases SET status='MONITORING',resolution=p_outcome,resolution_reason=p_reason,resolved_at=NULL WHERE id=p_id;
   WHEN 'resolve' THEN IF EXISTS(SELECT 1 FROM public.risk_signals WHERE case_id=p_id AND review_status NOT IN ('RESOLVED','DISMISSED')) THEN RAISE EXCEPTION 'UNREVIEWED_SIGNALS';END IF;UPDATE public.risk_cases SET status='RESOLVED',resolution=p_outcome,resolution_reason=p_reason,resolved_at=clock_timestamp() WHERE id=p_id;
   WHEN 'close' THEN IF c.status<>'RESOLVED' OR EXISTS(SELECT 1 FROM public.risk_signals WHERE case_id=p_id AND review_status NOT IN ('RESOLVED','DISMISSED')) THEN RAISE EXCEPTION 'UNREVIEWED_SIGNALS';END IF;UPDATE public.risk_cases SET status='CLOSED',closed_at=clock_timestamp() WHERE id=p_id;
   ELSE RAISE EXCEPTION 'INVALID_ACTION';END CASE;
  UPDATE public.risk_cases SET revision=revision+1,updated_at=clock_timestamp() WHERE id=p_id;
  INSERT INTO public.admin_audit_logs(actor_id,action,resource_type,resource_id,reason,request_id,before_summary,after_summary) VALUES(actor,upper(p_action),'risk_case',p_id::text,p_reason,p_request,jsonb_build_object('status',c.status,'revision',c.revision),jsonb_build_object('outcome',p_outcome,'target',p_target));
 ELSE RAISE EXCEPTION 'INVALID_KIND';END IF;
 result:=jsonb_build_object('id',p_id,'caseId',new_case_id,'recorded',true);
 INSERT INTO public.risk_commands(request_id,actor_id,kind,target_id,payload,result) VALUES(p_request,actor,p_kind,p_id,payload,result);RETURN result;
END;$$;
ALTER TABLE public.admin_export_jobs ADD COLUMN risk_filters jsonb;
CREATE FUNCTION public.admin_risk_request_export(p_session uuid,p_filters jsonb,p_request uuid) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE actor text;target uuid:=gen_random_uuid();BEGIN actor:=public.risk_admin_actor(p_session);
 IF NOT EXISTS(SELECT 1 FROM public.admin_users WHERE id=actor AND role IN ('SUPER_ADMIN','OPS_ADMIN','READ_ONLY_ANALYST')) THEN RAISE EXCEPTION 'ADMIN_REQUIRED';END IF;
 IF (SELECT count(*) FROM public.admin_export_jobs WHERE actor_id=actor AND created_at>now()-interval '1 hour')>=10 THEN RAISE EXCEPTION 'RATE_LIMIT';END IF;
 INSERT INTO public.admin_export_jobs(id,actor_id,module_key,risk_filters,expires_at) VALUES(target,actor,'fraud',p_filters,now()+interval '24 hours');
 INSERT INTO public.admin_audit_logs(actor_id,action,resource_type,resource_id,reason,request_id) VALUES(actor,'EXPORT_REQUESTED','risk_export',target::text,'Requested a protected risk signal report.',p_request);RETURN target;END;$$;
CREATE FUNCTION public.admin_risk_export_page(p_job uuid,p_cursor jsonb DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path='' AS $$
DECLARE job public.admin_export_jobs;BEGIN
 job:=(SELECT j FROM public.admin_export_jobs j JOIN public.admin_users a ON a.id=j.actor_id WHERE j.id=p_job AND j.module_key='fraud' AND j.status='PROCESSING' AND j.expires_at>now() AND a.status='ACTIVE' AND a.role IN ('SUPER_ADMIN','OPS_ADMIN','READ_ONLY_ANALYST'));
 IF job.id IS NULL THEN RAISE EXCEPTION 'EXPORT_REQUIRED';END IF;
 RETURN (SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY r.observed_at DESC,r.id DESC),'[]') FROM (
 SELECT p.id,p.reference_code,p.title,p.category,p.severity,p.review_status,p.visible_code,p.qr_status,p.vehicle_label,p.registration_masked,p.event_count,p.evidence_summary,p.case_reference,p.case_status,p.assigned_name,p.observed_at
 FROM public.risk_filtered(coalesce(job.risk_filters,'{}'),job.actor_id) p JOIN public.risk_signals s ON s.id=p.id
 WHERE s.created_at<=job.created_at AND (p_cursor IS NULL OR (p.observed_at,p.id)<((p_cursor->>'at')::timestamptz,(p_cursor->>'id')::uuid))
 ORDER BY p.observed_at DESC,p.id DESC LIMIT 500) r);END;$$;
-- Historical evaluation is an explicit, bounded operations job; GET never writes.
CREATE FUNCTION public.admin_risk_backfill(p_session uuid,p_source text,p_cursor jsonb DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE e record;last_event jsonb;n integer:=0;BEGIN PERFORM public.risk_admin_actor(p_session,true);
 IF p_source='ACTIVATION' THEN
 FOR e IN SELECT id,created_at FROM public.qr_activation_attempts WHERE outcome<>'SUCCESS' AND (p_cursor IS NULL OR (created_at,id)<((p_cursor->>'at')::timestamptz,p_cursor->>'id')) ORDER BY created_at DESC,id DESC LIMIT 500 LOOP PERFORM public.risk_capture_event(p_source,e.id);last_event:=jsonb_build_object('id',e.id,'at',e.created_at);n:=n+1;END LOOP;
 ELSIF p_source='SCAN' THEN
 FOR e IN SELECT id,created_at FROM public.qr_scan_events WHERE result IN ('RESOLVED_BLOCKED','RESOLVED_REPLACED') AND (p_cursor IS NULL OR (created_at,id)<((p_cursor->>'at')::timestamptz,p_cursor->>'id')) ORDER BY created_at DESC,id DESC LIMIT 500 LOOP PERFORM public.risk_capture_event(p_source,e.id);last_event:=jsonb_build_object('id',e.id,'at',e.created_at);n:=n+1;END LOOP;
 ELSE RAISE EXCEPTION 'INVALID_SOURCE';END IF;
 RETURN jsonb_build_object('processed',n,'nextCursor',CASE WHEN n=500 THEN last_event ELSE NULL END);END;$$;
-- Deny public RPC access explicitly, including internal trigger helpers.
DO $$ DECLARE f record;BEGIN FOR f IN SELECT oid::regprocedure AS signature FROM pg_proc WHERE pronamespace='public'::regnamespace AND (proname LIKE 'risk_%' OR proname LIKE 'admin_risk_%') LOOP
 EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated',f.signature);EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role',f.signature);
END LOOP;END;$$;
NOTIFY pgrst,'reload schema';
COMMIT;




