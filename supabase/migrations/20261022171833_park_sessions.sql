-- Park uses the existing verified customer session; public QR entitlements are unchanged.
-- Restrict deletion of parents so an account/vehicle change cannot silently erase records.
CREATE TABLE public.park_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  vehicle_id text NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'PARKED' CHECK (status IN ('PARKED','ENDED')),
  latitude double precision NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude double precision NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  accuracy_m double precision NOT NULL CHECK (accuracy_m BETWEEN 0 AND 100000),
  location_captured_at timestamptz NOT NULL,
  place_name text CHECK (char_length(place_name) <= 240),
  floor_label text NOT NULL DEFAULT '' CHECK (char_length(floor_label) <= 40),
  bay_label text NOT NULL DEFAULT '' CHECK (char_length(bay_label) <= 40),
  notes text NOT NULL DEFAULT '' CHECK (char_length(notes) <= 500),
  return_at timestamptz,
  started_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  ended_at timestamptz,
  location_consent_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  CHECK ((status = 'PARKED' AND ended_at IS NULL) OR (status = 'ENDED' AND ended_at IS NOT NULL)),
  CHECK (return_at IS NULL OR return_at >= started_at)
);
CREATE UNIQUE INDEX park_one_active_vehicle ON public.park_sessions(vehicle_id) WHERE status='PARKED';
CREATE INDEX park_owner_recent ON public.park_sessions(user_id, started_at DESC);
ALTER TABLE public.park_sessions ENABLE ROW LEVEL SECURITY;
-- VaahanSafe uses its own HttpOnly sessions, not browser Supabase JWT identities.
-- All access passes through the authenticated server, so no public/JWT role policies apply.
REVOKE ALL ON public.park_sessions FROM PUBLIC, anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.park_sessions TO service_role;

CREATE FUNCTION public.start_park_session(
 p_user_id uuid,p_id uuid,p_vehicle_id text,p_latitude double precision,p_longitude double precision,
 p_accuracy_m double precision,p_captured_at timestamptz,p_floor text,p_bay text,p_notes text,p_duration_minutes integer
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE v_row public.park_sessions; v_now timestamptz := clock_timestamp();
BEGIN
 -- Row lock prevents a simultaneous vehicle transfer from racing the ownership check.
 PERFORM 1 FROM public.vehicles WHERE id=p_vehicle_id AND user_id=p_user_id::text AND status='ACTIVE' AND deleted_at IS NULL FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'PARK_VEHICLE_UNAVAILABLE' USING ERRCODE='42501'; END IF;
 IF p_captured_at < v_now - interval '5 minutes' OR p_captured_at > v_now + interval '30 seconds' THEN
  RAISE EXCEPTION 'PARK_LOCATION_STALE' USING ERRCODE='22023';
 END IF;
 IF p_duration_minutes IS NOT NULL AND (p_duration_minutes < 5 OR p_duration_minutes > 1440) THEN
  RAISE EXCEPTION 'PARK_DURATION_INVALID' USING ERRCODE='22023';
 END IF;
 -- The same client request UUID is safe to retry without creating a second parking record.
 SELECT * INTO v_row FROM public.park_sessions WHERE id=p_id AND user_id=p_user_id;
 IF FOUND THEN RETURN to_jsonb(v_row); END IF;
 -- A new, verified vehicle owner must not be blocked by a former owner's open stop.
 UPDATE public.park_sessions SET status='ENDED', ended_at=v_now WHERE vehicle_id=p_vehicle_id AND user_id<>p_user_id AND status='PARKED';
 IF (SELECT count(*) FROM public.park_sessions WHERE user_id=p_user_id AND started_at>v_now-interval '1 minute') >= 10 THEN
  RAISE EXCEPTION 'PARK_RATE_LIMIT' USING ERRCODE='54000';
 END IF;
 INSERT INTO public.park_sessions(id,user_id,vehicle_id,latitude,longitude,accuracy_m,location_captured_at,floor_label,bay_label,notes,return_at,started_at)
 VALUES(p_id,p_user_id,p_vehicle_id,p_latitude,p_longitude,p_accuracy_m,p_captured_at,p_floor,p_bay,p_notes,
  CASE WHEN p_duration_minutes IS NULL THEN NULL ELSE v_now + make_interval(mins=>p_duration_minutes) END,v_now)
 RETURNING * INTO v_row;
 RETURN to_jsonb(v_row);
END;
$$;
REVOKE ALL ON FUNCTION public.start_park_session(uuid,uuid,text,double precision,double precision,double precision,timestamptz,text,text,text,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.start_park_session(uuid,uuid,text,double precision,double precision,double precision,timestamptz,text,text,text,integer) TO service_role;
