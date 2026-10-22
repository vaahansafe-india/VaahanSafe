-- Integration assertions. The inner savepoint deliberately rolls back every test
-- parking record. No fake accounts/vehicles, location history or notifications remain.
DO $$
DECLARE
 v_vehicle text; v_owner uuid; v_id uuid:=gen_random_uuid(); v_second uuid:=gen_random_uuid();
 v_first jsonb; v_retry jsonb;
BEGIN
 IF has_table_privilege('anon','public.park_sessions','SELECT') OR has_table_privilege('authenticated','public.park_sessions','SELECT') THEN
  RAISE EXCEPTION 'Parking records are exposed';
 END IF;
 IF has_function_privilege('anon','public.start_park_session(uuid,uuid,text,double precision,double precision,double precision,timestamptz,text,text,text,integer)','EXECUTE') THEN
  RAISE EXCEPTION 'Parking mutation is exposed';
 END IF;
 SELECT v.id,u.id INTO v_vehicle,v_owner FROM public.vehicles v JOIN public.users u ON v.user_id=u.id::text
 WHERE v.status='ACTIVE' AND v.deleted_at IS NULL AND NOT EXISTS(SELECT 1 FROM public.park_sessions p WHERE p.vehicle_id=v.id AND p.status='PARKED') LIMIT 1;
 IF v_vehicle IS NULL THEN RAISE EXCEPTION 'No eligible existing vehicle for rollback-only integration checks'; END IF;
 BEGIN
  v_first:=public.start_park_session(v_owner,v_id,v_vehicle,28.6129,77.2295,12,clock_timestamp(),'','','Integration assertion (rolled back)',60);
  v_retry:=public.start_park_session(v_owner,v_id,v_vehicle,28.6129,77.2295,12,clock_timestamp(),'','','Integration assertion (rolled back)',60);
  IF v_first->>'id'<>v_retry->>'id' OR (SELECT count(*) FROM public.park_sessions WHERE id=v_id)<>1 THEN RAISE EXCEPTION 'Parking retry duplicated a session'; END IF;
  BEGIN
   PERFORM public.start_park_session(v_owner,v_second,v_vehicle,28.6129,77.2295,12,clock_timestamp(),'','','',60);
   RAISE EXCEPTION 'Second active session unexpectedly allowed';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
   PERFORM public.start_park_session(gen_random_uuid(),gen_random_uuid(),v_vehicle,28.6129,77.2295,12,clock_timestamp(),'','','',60);
   RAISE EXCEPTION 'Another account unexpectedly allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  UPDATE public.park_sessions SET status='ENDED',ended_at=clock_timestamp() WHERE id=v_id;
  PERFORM public.start_park_session(v_owner,v_second,v_vehicle,28.6129,77.2295,12,clock_timestamp(),'','','',60);
  IF NOT EXISTS(SELECT 1 FROM public.park_sessions WHERE id=v_second AND status='PARKED') THEN RAISE EXCEPTION 'Cannot park after ending a session'; END IF;
  RAISE EXCEPTION USING ERRCODE='PZ001', MESSAGE='Rollback successful parking assertions';
 EXCEPTION WHEN SQLSTATE 'PZ001' THEN NULL;
 END;
 IF EXISTS(SELECT 1 FROM public.park_sessions WHERE id IN (v_id,v_second)) THEN RAISE EXCEPTION 'Integration records were not rolled back'; END IF;
END;
$$;
