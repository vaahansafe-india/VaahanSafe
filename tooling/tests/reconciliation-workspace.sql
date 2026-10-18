-- Test rows exist only in the outer rollback subtransaction. No accounts,
-- sessions, OTPs or real stock changes are fabricated or committed.
DO $checks$ DECLARE rec text;rec2 text;result jsonb;denied boolean;sid uuid;actual record;partner text;batch text;qr text;qr2 text;code text;code2 text;req uuid;rev integer;fresh uuid;BEGIN
 IF EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND (p.proname LIKE 'admin_reconciliation_%' OR p.proname LIKE 'reconciliation_%' OR p.proname='admin_request_reconciliation_export') AND (prosecdef OR has_function_privilege('anon',p.oid,'EXECUTE') OR has_function_privilege('authenticated',p.oid,'EXECUTE'))) THEN RAISE EXCEPTION 'PUBLIC_RECONCILIATION_RPC';END IF;
 IF has_table_privilege('anon','public.admin_reconciliation_snapshot_items','SELECT') OR has_table_privilege('authenticated','public.admin_reconciliation_events','INSERT') OR EXISTS(SELECT 1 FROM pg_class WHERE oid IN('public.admin_reconciliation_snapshot_items'::regclass,'public.admin_reconciliation_events'::regclass,'public.admin_reconciliation_commands'::regclass) AND NOT relrowsecurity) THEN RAISE EXCEPTION 'PUBLIC_RECONCILIATION_DATA';END IF;
 denied:=false;BEGIN PERFORM public.admin_reconciliation_command(NULL,NULL,'create',NULL,'{}','Unauthorized write check',gen_random_uuid());EXCEPTION WHEN OTHERS THEN denied:=SQLERRM='ADMIN_REQUIRED';END;IF NOT denied THEN RAISE EXCEPTION 'AUTH_BYPASS';END IF;
 denied:=false;BEGIN PERFORM public.admin_reconciliation_list(NULL);EXCEPTION WHEN OTHERS THEN denied:=SQLERRM='ADMIN_REQUIRED';END;IF NOT denied THEN RAISE EXCEPTION 'READ_AUTH_BYPASS';END IF;
 rec:='reconciliation_'||gen_random_uuid()::text;rec2:='reconciliation_'||gen_random_uuid()::text;
 INSERT INTO public.admin_stock_reconciliations(id,partner_id,expected_quantity,counted_quantity,status,created_at) VALUES(rec,NULL,1,0,'CLOSED','2026-10-12T18:30:00Z'),(rec2,NULL,2,2,'OPEN','2026-10-12T18:30:00Z');
 IF (SELECT outcome FROM public.admin_reconciliation_projection WHERE id=rec)<>'CLOSED_VARIANCE' THEN RAISE EXCEPTION 'CLOSED_IMPLIES_MATCHED';END IF;
 IF (SELECT custodian_name FROM public.admin_reconciliation_projection WHERE id=rec)<>'VaahanSafe central inventory' THEN RAISE EXCEPTION 'CUSTODIAN_LOOKUP';END IF;
 result:=public.reconciliation_query(jsonb_build_object('q',(SELECT reference_code FROM public.admin_stock_reconciliations WHERE id=rec)));IF jsonb_array_length(result)<>1 OR result->0->>'id'<>rec THEN RAISE EXCEPTION 'REFERENCE_LOOKUP';END IF;
 IF result::text LIKE '%activation_secret%' OR result::text LIKE '%token_hash%' THEN RAISE EXCEPTION 'PRIVATE_PROJECTION_LEAK';END IF;
 result:=public.reconciliation_query(jsonb_build_object('dateMode','created','from','2026-10-13','to','2026-10-13'),NULL,51,ARRAY[rec,rec2]);IF jsonb_array_length(result)<>2 THEN RAISE EXCEPTION 'IST_BOUNDARY';END IF;
 result:=public.reconciliation_query(jsonb_build_object('dateMode','created','from','2026-10-12','to','2026-10-12'),NULL,51,ARRAY[rec,rec2]);IF jsonb_array_length(result)<>0 THEN RAISE EXCEPTION 'IST_UPPER_BOUNDARY';END IF;
 result:=public.reconciliation_query('{}',NULL,1,ARRAY[rec,rec2]);IF jsonb_array_length(result)<>1 THEN RAISE EXCEPTION 'PAGE_BOUND';END IF;
 result:=public.reconciliation_query('{}',jsonb_build_object('id',result->0->>'id','value',result->0->>'sort_value'),51,ARRAY[rec,rec2]);IF jsonb_array_length(result)<>1 THEN RAISE EXCEPTION 'CURSOR_TIEBREAK';END IF;
 UPDATE public.admin_stock_reconciliations SET phase='COUNTING' WHERE id=rec2;
 result:=public.reconciliation_query('{"variance":"any"}',NULL,51,ARRAY[rec2]);IF jsonb_array_length(result)<>0 THEN RAISE EXCEPTION 'DRAFT_VARIANCE';END IF;
 IF (SELECT revision FROM public.admin_stock_reconciliations WHERE id=rec2)<>1 THEN RAISE EXCEPTION 'REVISION_TRACKING';END IF;
 -- Exercise every read RPC using a real active session, without creating or refreshing one.
 SELECT s.id INTO sid FROM public.admin_sessions s JOIN public.admin_users a ON a.id=s.admin_id WHERE s.revoked_at IS NULL AND s.expires_at>now() AND s.created_at>now()-interval '4 hours' AND s.email_verified_at IS NOT NULL AND a.status='ACTIVE' AND a.role IN ('SUPER_ADMIN','OPS_ADMIN') ORDER BY s.created_at DESC LIMIT 1;
 IF sid IS NOT NULL THEN
  PERFORM public.admin_reconciliation_list(sid);PERFORM public.admin_reconciliation_summary(sid);PERFORM public.admin_reconciliation_partners(sid);PERFORM public.admin_reconciliation_snapshot(sid,NULL);
  PERFORM public.admin_reconciliation_detail(sid,rec);PERFORM public.admin_reconciliation_history(sid,rec,'timeline');PERFORM public.admin_reconciliation_history(sid,rec,'audit');PERFORM public.admin_reconciliation_history(sid,rec,'batches');PERFORM public.admin_reconciliation_history(sid,rec,'identities');
  FOR actual IN SELECT id FROM public.admin_stock_reconciliations WHERE transfer_id IS NOT NULL LIMIT 1 LOOP
   PERFORM public.admin_reconciliation_history(sid,actual.id,'timeline');PERFORM public.admin_reconciliation_history(sid,actual.id,'identities');PERFORM public.admin_reconciliation_history(sid,actual.id,'batches');PERFORM public.admin_reconciliation_history(sid,actual.id,'audit');
  END LOOP;
  IF NOT EXISTS(SELECT 1 FROM public.admin_sessions WHERE id=sid AND step_up_at>now()-interval '10 minutes') THEN
   denied:=false;BEGIN PERFORM public.admin_reconciliation_command(sid,rec2,'complete',1,'{"counted":2}','Expired verification check',gen_random_uuid());EXCEPTION WHEN OTHERS THEN denied:=SQLERRM='ADMIN_REQUIRED';END;IF NOT denied THEN RAISE EXCEPTION 'STEP_UP_BYPASS';END IF;
  END IF;
 END IF;
 -- Privileged workflow checks require the real operator's still-valid fresh OTP.
 SELECT s.id INTO fresh FROM public.admin_sessions s JOIN public.admin_users a ON a.id=s.admin_id WHERE s.revoked_at IS NULL AND s.expires_at>now() AND s.created_at>now()-interval '4 hours' AND s.email_verified_at IS NOT NULL AND s.step_up_at>now()-interval '10 minutes' AND a.status='ACTIVE' AND a.role IN ('SUPER_ADMIN','OPS_ADMIN') ORDER BY s.created_at DESC LIMIT 1;
 IF fresh IS NOT NULL THEN
  partner:='partner_'||gen_random_uuid()::text;batch:='batch_'||gen_random_uuid()::text;qr:='qr_'||gen_random_uuid()::text;qr2:='qr_'||gen_random_uuid()::text;code:='VS-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12));code2:='VS-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12));
  INSERT INTO public.admin_partners(id,reference_code,name,kind,city,verification_status) VALUES(partner,'ROLLBACK-'||gen_random_uuid()::text,'Rollback-only reconciliation scope','DISTRIBUTOR','Rollback-only','VERIFIED');
  INSERT INTO public.qr_batches(id,reference_code,quantity,status,inventory_channel) VALUES(batch,'ROLLBACK-'||gen_random_uuid()::text,2,'PRINTED','OFFLINE_RETAIL');
  INSERT INTO public.qr_stickers(id,public_id,visible_code,batch_id,status,lifecycle_state,current_distributor_id) VALUES(qr,gen_random_uuid()::text,code,batch,'WITH_DISTRIBUTOR','WITH_DISTRIBUTOR',partner),(qr2,gen_random_uuid()::text,code2,batch,'WITH_DISTRIBUTOR','WITH_DISTRIBUTOR',partner);
  result:=public.admin_reconciliation_snapshot(fresh,partner);IF (result->>'expected')::integer<>2 THEN RAISE EXCEPTION 'SNAPSHOT_STOCK';END IF;
  req:=gen_random_uuid();result:=jsonb_build_object('partner',partner,'batches','[]'::jsonb,'expected',2);
  rec:=public.admin_reconciliation_command(fresh,NULL,'create',NULL,result,'Rollback-only physical snapshot check',req);
  IF public.admin_reconciliation_command(fresh,NULL,'create',NULL,result,'Rollback-only physical snapshot check',req)<>rec THEN RAISE EXCEPTION 'CREATE_NOT_IDEMPOTENT';END IF;
  IF (SELECT count(*) FROM public.admin_reconciliation_snapshot_items WHERE reconciliation_id=rec)<>2 THEN RAISE EXCEPTION 'SNAPSHOT_IDENTITIES';END IF;
  IF (SELECT reconciliation_issues FROM public.admin_distributor_projection WHERE id=partner)<>0 THEN RAISE EXCEPTION 'DRAFT_PARTNER_SHORTAGE';END IF;
  SELECT revision INTO rev FROM public.admin_stock_reconciliations WHERE id=rec;
  PERFORM public.admin_reconciliation_command(fresh,rec,'complete',rev,'{"counted":1}','Rollback-only physical count check',gen_random_uuid());
  denied:=false;BEGIN PERFORM public.admin_reconciliation_command(fresh,rec,'complete',rev,'{"counted":1}','Rollback-only stale count check',gen_random_uuid());EXCEPTION WHEN OTHERS THEN denied:=SQLERRM='RECONCILIATION_STATE_CHANGED';END;IF NOT denied THEN RAISE EXCEPTION 'STALE_REVISION_ACCEPTED';END IF;
  SELECT revision INTO rev FROM public.admin_stock_reconciliations WHERE id=rec;
  denied:=false;BEGIN PERFORM public.admin_reconciliation_command(fresh,rec,'adjust',rev,jsonb_build_object('missingCodes',jsonb_build_array(code),'damagedCodes','[]'::jsonb),'Rollback-only unapproved adjustment',gen_random_uuid());EXCEPTION WHEN OTHERS THEN denied:=SQLERRM='INVALID_TRANSITION';END;IF NOT denied THEN RAISE EXCEPTION 'APPROVAL_BYPASS';END IF;
  PERFORM public.admin_reconciliation_command(fresh,rec,'investigate',rev,'{}','Rollback-only investigation check',gen_random_uuid());
  SELECT revision INTO rev FROM public.admin_stock_reconciliations WHERE id=rec;
  PERFORM public.admin_reconciliation_command(fresh,rec,'resolve',rev,'{"missing":1,"extra":0,"damaged":0}','Rollback-only resolution check',gen_random_uuid());
  SELECT revision INTO rev FROM public.admin_stock_reconciliations WHERE id=rec;
  PERFORM public.admin_reconciliation_command(fresh,rec,'approve',rev,'{}','Rollback-only approval check',gen_random_uuid());
  SELECT revision INTO rev FROM public.admin_stock_reconciliations WHERE id=rec;
  UPDATE public.qr_stickers SET updated_at=clock_timestamp() WHERE id=qr;
  denied:=false;BEGIN PERFORM public.admin_reconciliation_command(fresh,rec,'adjust',rev,jsonb_build_object('missingCodes',jsonb_build_array(code),'damagedCodes','[]'::jsonb),'Rollback-only changed identity check',gen_random_uuid());EXCEPTION WHEN OTHERS THEN denied:=SQLERRM='STOCK_CHANGED';END;IF NOT denied THEN RAISE EXCEPTION 'CHANGED_STOCK_ACCEPTED';END IF;
  -- Use the other unchanged snapshot identity for the authorized correction.
  req:=gen_random_uuid();result:=jsonb_build_object('missingCodes',jsonb_build_array(code2),'damagedCodes','[]'::jsonb);
  PERFORM public.admin_reconciliation_command(fresh,rec,'adjust',rev,result,'Rollback-only approved adjustment check',req);
  PERFORM public.admin_reconciliation_command(fresh,rec,'adjust',rev,result,'Rollback-only approved adjustment check',req);
  IF (SELECT status FROM public.qr_stickers WHERE id=qr2)<>'LOST' OR (SELECT status FROM public.qr_stickers WHERE id=qr)<>'WITH_DISTRIBUTOR' THEN RAISE EXCEPTION 'ADJUSTMENT_IDENTITY_BOUNDARY';END IF;
  SELECT revision INTO rev FROM public.admin_stock_reconciliations WHERE id=rec;
  PERFORM public.admin_reconciliation_command(fresh,rec,'close',rev,'{}','Rollback-only closure check',gen_random_uuid());
  IF (SELECT outcome FROM public.admin_reconciliation_projection WHERE id=rec)<>'RESOLVED_VARIANCE' THEN RAISE EXCEPTION 'RESOLVED_OUTCOME';END IF;
  IF (SELECT count(*) FROM public.admin_reconciliation_events WHERE reconciliation_id=rec)<>7 THEN RAISE EXCEPTION 'OPERATIONAL_EVENT_ATOMICITY';END IF;
  IF (SELECT count(*) FROM public.admin_audit_logs WHERE resource_type='reconciliation' AND resource_id=rec)<>7 THEN RAISE EXCEPTION 'AUDIT_ATOMICITY';END IF;
 END IF;
END;$checks$;
