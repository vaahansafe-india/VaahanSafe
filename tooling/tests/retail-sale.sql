-- Fixtures exist only inside the enclosing rollback subtransaction and are never
-- committed or visible to the application. Use an existing authenticated session.
DO $sale_checks$
DECLARE sid uuid; actor text; original_role text; d text; r text; other_r text; b text; codes text[]; ids text[]; q text; code text; i integer; request uuid; sale uuid; denied boolean; count_before integer; assignments_before integer; entitlements_before integer; t text;
BEGIN
 IF EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname IN ('retail_sale_eligible','admin_retail_sale_options','admin_retail_sale_history','admin_record_retail_sale') AND (prosecdef OR has_function_privilege('anon',p.oid,'EXECUTE') OR has_function_privilege('authenticated',p.oid,'EXECUTE'))) THEN RAISE EXCEPTION 'PUBLIC_SALE_RPC'; END IF;
 IF has_table_privilege('anon','public.admin_retail_sales','SELECT') OR has_table_privilege('authenticated','public.admin_retail_sale_items','SELECT') OR EXISTS(SELECT 1 FROM pg_class WHERE oid IN('public.admin_retail_sales'::regclass,'public.admin_retail_sale_items'::regclass) AND NOT relrowsecurity) THEN RAISE EXCEPTION 'PUBLIC_SALE_LEDGER'; END IF;
 denied:=false; BEGIN PERFORM public.admin_retail_sale_options(NULL,'none'); EXCEPTION WHEN OTHERS THEN denied:=SQLERRM='ADMIN_REQUIRED'; END; IF NOT denied THEN RAISE EXCEPTION 'SESSION_BYPASS'; END IF;
 SELECT s.id,a.id,a.role INTO sid,actor,original_role FROM public.admin_sessions s JOIN public.admin_users a ON a.id=s.admin_id WHERE s.revoked_at IS NULL AND s.expires_at>now() AND s.created_at>now()-interval '4 hours' AND s.email_verified_at IS NOT NULL AND a.status='ACTIVE' AND a.role IN ('SUPER_ADMIN','OPS_ADMIN') ORDER BY s.created_at DESC LIMIT 1;
 IF sid IS NULL THEN RAISE EXCEPTION 'AUTHENTICATED_SESSION_REQUIRED'; END IF;
 UPDATE public.admin_sessions SET step_up_at=now() WHERE id=sid;
 d:='partner_'||gen_random_uuid()::text; r:='partner_'||gen_random_uuid()::text; other_r:='partner_'||gen_random_uuid()::text; b:='batch_'||gen_random_uuid()::text;
 INSERT INTO public.admin_partners(id,reference_code,name,kind,city,verification_status) VALUES(d,'CHECK-'||gen_random_uuid()::text,'Rollback source','DISTRIBUTOR','Rollback','VERIFIED');
 INSERT INTO public.admin_partners(id,reference_code,name,kind,city,parent_distributor_id,verification_status) VALUES(r,'CHECK-'||gen_random_uuid()::text,'Rollback retailer','RETAILER','Rollback',d,'VERIFIED'),(other_r,'CHECK-'||gen_random_uuid()::text,'Rollback other outlet','RETAILER','Rollback',d,'VERIFIED');
 INSERT INTO public.qr_batches(id,reference_code,quantity,status,inventory_channel,printed_at) VALUES(b,'CHECK-'||gen_random_uuid()::text,3,'PRINTED','OFFLINE_RETAIL',now());
 FOR i IN 1..3 LOOP
  q:='qr_'||gen_random_uuid()::text; code:='VS-CHECK-'||upper(replace(gen_random_uuid()::text,'-','')); ids:=array_append(ids,q); codes:=array_append(codes,code);
  INSERT INTO public.qr_stickers(id,public_id,visible_code,batch_id,status,lifecycle_state,current_distributor_id,current_retailer_id) VALUES(q,replace(gen_random_uuid()::text,'-',''),code,b,'WITH_RETAILER','WITH_RETAILER',d,r);
  INSERT INTO public.qr_activation_secrets(id,qr_id,secret_hash) VALUES('secret_'||gen_random_uuid()::text,q,replace(gen_random_uuid()::text,'-',''));
 END LOOP;
 IF jsonb_array_length(public.admin_retail_sale_options(sid,r))<>3 THEN RAISE EXCEPTION 'ELIGIBLE_STOCK_WRONG'; END IF;
 IF public.admin_retail_sale_options(sid,r)::text LIKE '%secret%' OR public.admin_retail_sale_options(sid,r)::text LIKE '%public_id%' THEN RAISE EXCEPTION 'PRIVATE_PROJECTION_LEAK'; END IF;
 SELECT count(*) INTO count_before FROM public.admin_retail_sales;
 UPDATE public.admin_users SET role='READ_ONLY_ANALYST' WHERE id=actor;
 PERFORM public.admin_retail_sale_history(sid,r);
 denied:=false; BEGIN PERFORM public.admin_record_retail_sale(sid,r,codes,'CHECK-1','Read only security check',gen_random_uuid()); EXCEPTION WHEN OTHERS THEN denied:=SQLERRM='ADMIN_REQUIRED'; END; IF NOT denied THEN RAISE EXCEPTION 'READONLY_WRITE'; END IF;
 UPDATE public.admin_users SET role=original_role WHERE id=actor;
 UPDATE public.admin_sessions SET step_up_at=now()-interval '11 minutes' WHERE id=sid;
 denied:=false; BEGIN PERFORM public.admin_record_retail_sale(sid,r,codes,'CHECK-1','Expired verification check',gen_random_uuid()); EXCEPTION WHEN OTHERS THEN denied:=SQLERRM='ADMIN_REQUIRED'; END; IF NOT denied THEN RAISE EXCEPTION 'STEPUP_BYPASS'; END IF;
 UPDATE public.admin_sessions SET step_up_at=now() WHERE id=sid;
 UPDATE public.admin_partners SET verification_status='PENDING' WHERE id=r;
 denied:=false; BEGIN PERFORM public.admin_record_retail_sale(sid,r,codes,'CHECK-1','Outlet verification check',gen_random_uuid()); EXCEPTION WHEN OTHERS THEN denied:=SQLERRM='SALE_PARTNER_UNAVAILABLE'; END; IF NOT denied THEN RAISE EXCEPTION 'PARTNER_BYPASS'; END IF;
 UPDATE public.admin_partners SET verification_status='VERIFIED' WHERE id=r;
 UPDATE public.admin_partners SET status='SUSPENDED' WHERE id=d;
 IF jsonb_array_length(public.admin_retail_sale_options(sid,r))<>0 THEN RAISE EXCEPTION 'SUSPENDED_STOCK'; END IF;
 UPDATE public.admin_partners SET status='ACTIVE' WHERE id=d;
 -- Every failed mixed selection must roll back the entire sale, including its ledger.
 FOR i IN 1..7 LOOP
  IF i=1 THEN UPDATE public.qr_stickers SET status='INVENTORY',lifecycle_state='INVENTORY' WHERE id=ids[1];
  ELSIF i=2 THEN UPDATE public.qr_stickers SET current_retailer_id=other_r WHERE id=ids[1];
  ELSIF i=3 THEN UPDATE public.qr_batches SET status='QUARANTINED' WHERE id=b;
  ELSIF i=4 THEN UPDATE public.qr_batches SET inventory_channel='ONLINE_SYSTEM' WHERE id=b;
  ELSIF i=5 THEN UPDATE public.qr_activation_secrets SET consumed_at=now() WHERE qr_id=ids[1];
  ELSIF i=6 THEN UPDATE public.qr_batches SET printed_at=NULL WHERE id=b;
  ELSIF i=7 THEN UPDATE public.qr_activation_secrets SET locked_until=now()+interval '10 minutes' WHERE qr_id=ids[1]; END IF;
  denied:=false; BEGIN PERFORM public.admin_record_retail_sale(sid,r,codes,'CHECK-1','Mixed eligibility check',gen_random_uuid()); EXCEPTION WHEN OTHERS THEN denied:=SQLERRM='SALE_STOCK_CHANGED'; END;
  IF NOT denied OR (SELECT count(*) FROM public.admin_retail_sales)<>count_before OR EXISTS(SELECT 1 FROM public.qr_stickers WHERE id=ANY(ids) AND status='SOLD') THEN RAISE EXCEPTION 'FAILED_SALE_NOT_ATOMIC'; END IF;
  UPDATE public.qr_stickers SET status='WITH_RETAILER',lifecycle_state='WITH_RETAILER',current_retailer_id=r WHERE id=ANY(ids);
  UPDATE public.qr_batches SET status='PRINTED',inventory_channel='OFFLINE_RETAIL',printed_at=now() WHERE id=b;
  UPDATE public.qr_activation_secrets SET consumed_at=NULL,locked_until=NULL WHERE qr_id=ANY(ids);
 END LOOP;
 t:='transfer_'||gen_random_uuid()::text;
 INSERT INTO public.admin_stock_transfers(id,reference_code,source_partner_id,destination_partner_id,batch_id,quantity,status) VALUES(t,'CHECK-'||gen_random_uuid()::text,d,r,b,1,'REQUESTED');
 INSERT INTO public.admin_stock_transfer_items(transfer_id,qr_id) VALUES(t,ids[1]);
 denied:=false; BEGIN PERFORM public.admin_record_retail_sale(sid,r,codes,'CHECK-1','Reserved stock check',gen_random_uuid()); EXCEPTION WHEN OTHERS THEN denied:=SQLERRM='SALE_STOCK_CHANGED'; END; IF NOT denied THEN RAISE EXCEPTION 'RESERVED_STOCK_SOLD'; END IF;
 UPDATE public.admin_stock_transfer_items SET released_at=now() WHERE transfer_id=t;
 denied:=false; BEGIN PERFORM public.admin_record_retail_sale(sid,r,ARRAY[codes[1],codes[1]],'CHECK-1','Duplicate codes check',gen_random_uuid()); EXCEPTION WHEN OTHERS THEN denied:=SQLERRM='INVALID_SALE'; END; IF NOT denied THEN RAISE EXCEPTION 'DUPLICATE_CODE_ACCEPTED'; END IF;
 SELECT count(*) INTO assignments_before FROM public.qr_assignments; SELECT count(*) INTO entitlements_before FROM public.service_entitlements;
 request:=gen_random_uuid(); sale:=public.admin_record_retail_sale(sid,r,ARRAY[codes[1],codes[2]],'CHECK-1','Verified physical retail sale',request);
 IF public.admin_record_retail_sale(sid,r,ARRAY[codes[2],codes[1]],'check-1','Verified physical retail sale',request)<>sale OR (SELECT count(*) FROM public.admin_retail_sales)<>count_before+1 THEN RAISE EXCEPTION 'SALE_NOT_IDEMPOTENT'; END IF;
 IF (SELECT count(*) FROM public.admin_retail_sale_items WHERE sale_id=sale)<>2 OR (SELECT count(*) FROM public.qr_stickers WHERE id IN(ids[1],ids[2]) AND status='SOLD' AND lifecycle_state='SOLD' AND user_id IS NULL AND vehicle_id IS NULL AND activated_at IS NULL AND current_retailer_id=r)<>2 THEN RAISE EXCEPTION 'SALE_STATE_WRONG'; END IF;
 IF (SELECT count(*) FROM public.qr_assignments)<>assignments_before OR (SELECT count(*) FROM public.service_entitlements)<>entitlements_before OR EXISTS(SELECT 1 FROM public.qr_activation_secrets WHERE qr_id=ANY(ids) AND consumed_at IS NOT NULL) THEN RAISE EXCEPTION 'SALE_ACTIVATED_SERVICE'; END IF;
 IF (SELECT available FROM public.admin_retailer_projection WHERE id=r)<>1 OR jsonb_array_length(public.admin_retail_sale_options(sid,r))<>1 THEN RAISE EXCEPTION 'STOCK_NOT_REMOVED'; END IF;
 denied:=false; BEGIN PERFORM public.admin_record_retail_sale(sid,r,ARRAY[codes[3]],'CHECK-2','Conflicting retry check',request); EXCEPTION WHEN OTHERS THEN denied:=SQLERRM='REQUEST_CONFLICT'; END; IF NOT denied THEN RAISE EXCEPTION 'RETRY_PAYLOAD_BYPASS'; END IF;
 denied:=false; BEGIN PERFORM public.admin_record_retail_sale(sid,r,ARRAY[codes[1]],'CHECK-2','Double sale check',gen_random_uuid()); EXCEPTION WHEN OTHERS THEN denied:=SQLERRM='SALE_STOCK_CHANGED'; END; IF NOT denied THEN RAISE EXCEPTION 'DOUBLE_SALE'; END IF;
 denied:=false; BEGIN PERFORM public.admin_record_retail_sale(sid,r,ARRAY[codes[3]],'CHECK-1','Duplicate receipt check',gen_random_uuid()); EXCEPTION WHEN OTHERS THEN denied:=SQLERRM='RECEIPT_ALREADY_RECORDED'; END; IF NOT denied THEN RAISE EXCEPTION 'DUPLICATE_RECEIPT'; END IF;
 IF (SELECT count(*) FROM public.qr_status_history WHERE qr_id=ANY(ids) AND reason_code='RETAIL_SALE_RECORDED')<>2 OR NOT EXISTS(SELECT 1 FROM public.admin_audit_logs WHERE request_id=request AND action='retailer.sale_recorded') THEN RAISE EXCEPTION 'SALE_AUDIT_MISSING'; END IF;
 IF jsonb_array_length(public.admin_retail_sale_history(sid,r))<>1 THEN RAISE EXCEPTION 'SALE_HISTORY_MISSING'; END IF;
 UPDATE public.admin_users SET role='READ_ONLY_ANALYST' WHERE id=actor;
 IF public.admin_retail_sale_history(sid,r)->0->>'reason'<>'' THEN RAISE EXCEPTION 'READONLY_REASON_LEAK'; END IF;
 denied:=false; BEGIN UPDATE public.admin_retail_sales SET quantity=3 WHERE id=sale; EXCEPTION WHEN OTHERS THEN denied:=true; END; IF NOT denied THEN RAISE EXCEPTION 'MUTABLE_SALE'; END IF;
END; $sale_checks$;
