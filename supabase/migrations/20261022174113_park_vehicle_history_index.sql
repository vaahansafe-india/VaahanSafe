-- The active-only index does not cover ended records for FK checks/history access.
CREATE INDEX park_vehicle_history ON public.park_sessions(vehicle_id,started_at DESC);
