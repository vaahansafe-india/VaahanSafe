DO $checks$
DECLARE sid uuid;actor text;denied boolean;options jsonb;
BEGIN
 IF EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND (proname LIKE 'admin_transfer_%' OR proname IN ('transfer_eligible','transfer_filter_clause')) AND (prosecdef OR has_function_privilege('anon',p.oid,'EXECUTE') OR has_function_privilege('authenticated',p.oid,'EXECUTE'))) THEN RAISE EXCEPTION 'PUBLIC_RPC_ACCESS';END IF;
 IF has_table_privilege('anon','public.admin_transfer_events','SELECT') OR has_table_privilege('authenticated','public.admin_transfer_projection','SELECT') THEN RAISE EXCEPTION 'PUBLIC_TRANSFER_ACCESS';END IF;
 denied:=false;BEGIN PERFORM public.admin_transfer_summary(NULL);EXCEPTION WHEN OTHERS THEN denied:=SQLERRM='ADMIN_REQUIRED';END;IF NOT denied THEN RAISE EXCEPTION 'SESSION_BYPASS';END IF;
 SELECT s.id,a.id INTO sid,actor FROM public.admin_sessions s JOIN public.admin_users a ON a.id=s.admin_id WHERE s.revoked_at IS NULL AND s.expires_at>now() AND s.created_at>now()-interval '4 hours' AND s.email_verified_at IS NOT NULL AND a.status='ACTIVE' AND a.role IN ('SUPER_ADMIN','OPS_ADMIN') ORDER BY s.created_at DESC LIMIT 1;
 IF sid IS NULL THEN RAISE EXCEPTION 'AUTHENTICATED_SESSION_REQUIRED';END IF;
 PERFORM public.admin_transfer_summary(sid);PERFORM public.admin_transfer_list(sid,'{}',NULL);PERFORM public.admin_transfer_history(sid,'nonexistent','contents',NULL,'');PERFORM public.admin_transfer_history(sid,'nonexistent','timeline',NULL,'');PERFORM public.admin_transfer_history(sid,'nonexistent','audit',NULL,'');
 options:=public.admin_transfer_options(sid,NULL,'inventory','');
 denied:=false;BEGIN PERFORM public.admin_transfer_detail(sid,'nonexistent');EXCEPTION WHEN OTHERS THEN denied:=SQLERRM='TRANSFER_NOT_FOUND';END;IF NOT denied THEN RAISE EXCEPTION 'MISSING_DETAIL';END IF;
END;$checks$;
-- Isolated transaction-only stock fixtures exercise writes without ever becoming
-- visible to business screens. The enclosing script rolls back every fixture.
DO $custody$
DECLARE sid uuid;actor text;original_role text;original_step timestamptz;d text;r text;b text;b2 text;t text;t2 text;q text;code text;codes text[];req uuid;values jsonb;denied boolean;stamp integer;audit_before integer;count_before integer;recon text;job uuid;i integer;
BEGIN
 SELECT s.id,a.id,a.role,s.step_up_at INTO sid,actor,original_role,original_step FROM public.admin_sessions s JOIN public.admin_users a ON a.id=s.admin_id WHERE s.revoked_at IS NULL AND s.expires_at>now() AND s.created_at>now()-interval '4 hours' AND s.email_verified_at IS NOT NULL AND a.status='ACTIVE' AND a.role IN ('SUPER_ADMIN','OPS_ADMIN') ORDER BY s.created_at DESC LIMIT 1;
 UPDATE public.admin_sessions SET step_up_at=now() WHERE id=sid;
 d:='partner_'||gen_random_uuid()::text;r:='partner_'||gen_random_uuid()::text;
 INSERT INTO public.admin_partners(id,reference_code,name,kind,city,verification_status) VALUES(d,'CHECK-'||gen_random_uuid()::text,'Rollback source','DISTRIBUTOR','Rollback','VERIFIED');
 INSERT INTO public.admin_partners(id,reference_code,name,kind,city,parent_distributor_id,verification_status) VALUES(r,'CHECK-'||gen_random_uuid()::text,'Rollback destination','RETAILER','Rollback',d,'VERIFIED');
 b:='batch_'||gen_random_uuid()::text;b2:='batch_'||gen_random_uuid()::text;
 INSERT INTO public.qr_batches(id,reference_code,quantity,status,inventory_channel,printed_at) VALUES(b,'CHECK-'||gen_random_uuid()::text,3,'PRINTED','OFFLINE_RETAIL',now()),(b2,'CHECK-'||gen_random_uuid()::text,3,'PRINTED','OFFLINE_RETAIL',now());
 FOR i IN 1..6 LOOP q:='qr_'||gen_random_uuid()::text;code:='VS-CHECK-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12));INSERT INTO public.qr_stickers(id,public_id,visible_code,batch_id,status,lifecycle_state) VALUES(q,replace(gen_random_uuid()::text,'-',''),code,CASE WHEN i<=3 THEN b ELSE b2 END,'PRINTED','PRINTED');END LOOP;
 values:=jsonb_build_object('destination',d,'allocations',jsonb_build_array(jsonb_build_object('batch',b,'quantity',3),jsonb_build_object('batch',b2,'quantity',3)));req:=gen_random_uuid();
 UPDATE public.admin_users SET role='READ_ONLY_ANALYST' WHERE id=actor;
 PERFORM public.admin_transfer_summary(sid);denied:=false;BEGIN PERFORM public.admin_transfer_command(sid,NULL,NULL,'request',values,'Readonly validation only',req);EXCEPTION WHEN OTHERS THEN denied:=SQLERRM='ADMIN_REQUIRED';END;IF NOT denied THEN RAISE EXCEPTION 'READONLY_WRITE';END IF;UPDATE public.admin_users SET role=original_role WHERE id=actor;
 UPDATE public.admin_sessions SET step_up_at=now()-interval '11 minutes' WHERE id=sid;denied:=false;BEGIN PERFORM public.admin_transfer_command(sid,NULL,NULL,'request',values,'Expired verification validation',req);EXCEPTION WHEN OTHERS THEN denied:=SQLERRM='ADMIN_REQUIRED';END;IF NOT denied THEN RAISE EXCEPTION 'STEPUP_BYPASS';END IF;UPDATE public.admin_sessions SET step_up_at=now() WHERE id=sid;
 UPDATE public.qr_batches SET status='QUARANTINED' WHERE id=b;denied:=false;BEGIN PERFORM public.admin_transfer_command(sid,NULL,NULL,'request',values,'Quarantine validation only',req);EXCEPTION WHEN OTHERS THEN denied:=SQLERRM='INSUFFICIENT_STOCK';END;IF NOT denied THEN RAISE EXCEPTION 'QUARANTINE_BYPASS';END IF;UPDATE public.qr_batches SET status='PRINTED' WHERE id=b;
 SELECT count(*) INTO count_before FROM public.admin_stock_transfers;
 t:=public.admin_transfer_command(sid,NULL,NULL,'request',values,'Custody request validation',req);
 IF public.admin_transfer_command(sid,NULL,NULL,'request',values,'Custody request validation',req)<>t OR (SELECT count(*) FROM public.admin_stock_transfers)<>count_before+1 THEN RAISE EXCEPTION 'REQUEST_NOT_IDEMPOTENT';END IF;
 denied:=false;BEGIN PERFORM public.admin_transfer_command(sid,NULL,NULL,'request',values,'Different request payload',req);EXCEPTION WHEN OTHERS THEN denied:=SQLERRM='REQUEST_CONFLICT';END;IF NOT denied THEN RAISE EXCEPTION 'REQUEST_REUSE';END IF;
 denied:=false;BEGIN PERFORM public.admin_transfer_command(sid,NULL,NULL,'request',values,'Double reservation validation',gen_random_uuid());EXCEPTION WHEN OTHERS THEN denied:=SQLERRM='INSUFFICIENT_STOCK';END;IF NOT denied THEN RAISE EXCEPTION 'DOUBLE_RESERVATION';END IF;
 IF (SELECT count(*) FROM public.admin_stock_transfers)<>count_before+1 THEN RAISE EXCEPTION 'FAILURE_LEFT_ORPHAN';END IF;
 denied:=false;BEGIN PERFORM public.admin_transfer_command(sid,t,1,'dispatch','{}','Approval gate validation',gen_random_uuid());EXCEPTION WHEN OTHERS THEN denied:=SQLERRM='INVALID_TRANSITION';END;IF NOT denied THEN RAISE EXCEPTION 'APPROVAL_BYPASS';END IF;
 PERFORM public.admin_transfer_command(sid,t,1,'approve','{}','Approval validation only',gen_random_uuid());
 denied:=false;BEGIN PERFORM public.admin_transfer_command(sid,t,1,'dispatch','{}','Stale revision validation',gen_random_uuid());EXCEPTION WHEN OTHERS THEN denied:=SQLERRM='TRANSFER_CHANGED';END;IF NOT denied THEN RAISE EXCEPTION 'STALE_COMMAND';END IF;
 UPDATE public.admin_partners SET status='SUSPENDED' WHERE id=d;denied:=false;BEGIN PERFORM public.admin_transfer_command(sid,t,2,'dispatch','{}','Suspended dispatch validation',gen_random_uuid());EXCEPTION WHEN OTHERS THEN denied:=SQLERRM='PARTNER_UNAVAILABLE';END;IF NOT denied THEN RAISE EXCEPTION 'SUSPENDED_DISPATCH';END IF;UPDATE public.admin_partners SET status='ACTIVE' WHERE id=d;
 PERFORM public.admin_transfer_command(sid,t,2,'dispatch',jsonb_build_object('expectedArrival',now()-interval '1 hour'),'Dispatch validation only',gen_random_uuid());
 IF public.admin_transfer_detail(sid,t)->'transfer'->>'overdue'<>'true' THEN RAISE EXCEPTION 'OVERDUE_NOT_PROJECTED';END IF;
 SELECT array_agg(q.visible_code ORDER BY q.id) INTO codes FROM public.qr_stickers q JOIN public.admin_stock_transfer_items ti ON ti.qr_id=q.id WHERE ti.transfer_id=t;
 SELECT count(*) INTO audit_before FROM public.admin_audit_logs;
 denied:=false;BEGIN PERFORM public.admin_transfer_command(sid,t,3,'receive',jsonb_build_object('received',jsonb_build_array(codes[1]),'damaged',jsonb_build_array(codes[1])),'Duplicate receipt validation',gen_random_uuid());EXCEPTION WHEN OTHERS THEN denied:=SQLERRM='INVALID_RECEIPT';END;IF NOT denied OR (SELECT count(*) FROM public.admin_audit_logs)<>audit_before OR (SELECT received_quantity FROM public.admin_stock_transfers WHERE id=t)<>0 THEN RAISE EXCEPTION 'PARTIAL_FAILED_WRITE';END IF;
 req:=gen_random_uuid();values:=jsonb_build_object('received',jsonb_build_array(codes[1],codes[2]));PERFORM public.admin_transfer_command(sid,t,3,'receive',values,'Partial receipt validation',req);PERFORM public.admin_transfer_command(sid,t,3,'receive',values,'Partial receipt validation',req);
 IF (SELECT status FROM public.admin_stock_transfers WHERE id=t)<>'PARTIALLY_RECEIVED' OR (SELECT count(*) FROM public.qr_stickers WHERE current_distributor_id=d AND status='WITH_DISTRIBUTOR')<>2 THEN RAISE EXCEPTION 'PARTIAL_CUSTODY_WRONG';END IF;
 denied:=false;BEGIN PERFORM public.admin_transfer_command(sid,t,4,'reconcile','{}','Premature reconciliation validation',gen_random_uuid());EXCEPTION WHEN OTHERS THEN denied:=SQLERRM IN ('INVALID_TRANSITION','UNRESOLVED_RECEIPT');END;IF NOT denied THEN RAISE EXCEPTION 'PREMATURE_RECONCILIATION';END IF;
 PERFORM public.admin_transfer_command(sid,t,4,'receive',jsonb_build_object('damaged',jsonb_build_array(codes[3]),'missing',jsonb_build_array(codes[4])),'Discrepancy receipt validation',gen_random_uuid());
 IF (SELECT status FROM public.qr_stickers WHERE visible_code=codes[3])<>'DAMAGED' OR (SELECT current_distributor_id FROM public.qr_stickers WHERE visible_code=codes[4]) IS NOT NULL THEN RAISE EXCEPTION 'DISCREPANCY_CUSTODY';END IF;
 PERFORM public.admin_transfer_command(sid,t,5,'resolve',jsonb_build_object('found',jsonb_build_array(codes[4])),'Found identity validation',gen_random_uuid());
 PERFORM public.admin_transfer_command(sid,t,6,'receive',jsonb_build_object('received',jsonb_build_array(codes[5]),'finalReceipt',true),'Final receipt validation',gen_random_uuid());
 denied:=false;BEGIN PERFORM public.admin_transfer_command(sid,t,7,'reconcile','{}','Missing identity validation',gen_random_uuid());EXCEPTION WHEN OTHERS THEN denied:=SQLERRM='UNRESOLVED_RECEIPT';END;IF NOT denied THEN RAISE EXCEPTION 'UNRESOLVED_CLOSE';END IF;
 PERFORM public.admin_transfer_command(sid,t,7,'resolve',jsonb_build_object('lost',jsonb_build_array(codes[6])),'Lost identity validation',gen_random_uuid());
 PERFORM public.admin_transfer_command(sid,t,8,'reconcile','{}','Reconciliation validation only',gen_random_uuid());PERFORM public.admin_transfer_command(sid,t,9,'close','{}','Closure validation only',gen_random_uuid());
 IF (SELECT received_quantity+damaged_quantity+missing_quantity FROM public.admin_stock_transfers WHERE id=t)<>6 OR (SELECT count(*) FROM public.admin_stock_transfer_items WHERE transfer_id=t AND released_at IS NULL)<>0 OR (SELECT status FROM public.admin_stock_transfers WHERE id=t)<>'CLOSED' THEN RAISE EXCEPTION 'CLOSED_LEDGER_WRONG';END IF;
 -- Move only the four actually received, usable QR units to the verified retailer.
 values:=jsonb_build_object('source',d,'destination',r,'allocations',(SELECT jsonb_agg(jsonb_build_object('batch',batch_id,'quantity',n)) FROM(SELECT batch_id,count(*) n FROM public.qr_stickers WHERE current_distributor_id=d AND status='WITH_DISTRIBUTOR' GROUP BY batch_id)x));
 t2:=public.admin_transfer_command(sid,NULL,NULL,'request',values,'Retail transfer validation',gen_random_uuid());PERFORM public.admin_transfer_command(sid,t2,1,'approve','{}','Retail approval validation',gen_random_uuid());PERFORM public.admin_transfer_command(sid,t2,2,'dispatch','{}','Retail dispatch validation',gen_random_uuid());
 IF (SELECT on_hand FROM public.admin_distributor_projection WHERE id=d)<>0 OR (SELECT in_transit FROM public.admin_retailer_projection WHERE id=r)<>4 THEN RAISE EXCEPTION 'NETWORK_TRANSIT_WRONG';END IF;
 SELECT jsonb_build_object('received',jsonb_agg(q.visible_code)) INTO values FROM public.qr_stickers q JOIN public.admin_stock_transfer_items i ON i.qr_id=q.id WHERE i.transfer_id=t2;
 PERFORM public.admin_transfer_command(sid,t2,3,'receive',values,'Retail receipt validation',gen_random_uuid());IF (SELECT available FROM public.admin_retailer_projection WHERE id=r)<>4 THEN RAISE EXCEPTION 'RETAIL_STOCK_WRONG';END IF;
 IF jsonb_array_length(public.admin_transfer_history(sid,t,'timeline',NULL,''))<5 OR jsonb_array_length(public.admin_transfer_history(sid,t,'audit',NULL,''))<5 THEN RAISE EXCEPTION 'EVENT_AUDIT_MISSING';END IF;
 IF public.admin_transfer_list(sid,jsonb_build_object('destination',r),NULL)->0->>'id'<>t2 THEN RAISE EXCEPTION 'DESTINATION_FILTER_WRONG';END IF;
 job:=public.admin_request_transfer_export(sid,jsonb_build_object('destination',r),ARRAY[t2],gen_random_uuid());UPDATE public.admin_export_jobs SET status='PROCESSING' WHERE id=job;IF jsonb_array_length(public.admin_transfer_export_page(job,NULL))<>1 THEN RAISE EXCEPTION 'EXPORT_SCOPE_WRONG';END IF;
 UPDATE public.admin_sessions SET step_up_at=original_step WHERE id=sid;
END;$custody$;
