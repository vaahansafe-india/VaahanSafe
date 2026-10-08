-- The retail claim transaction inserts into qr_assignments only after verifying
-- the sticker, challenge, verified owner, and vehicle. These partial indexes
-- are the final concurrency boundary: a QR and a vehicle may each have only
-- one current assignment, while historical ended assignments remain intact.
CREATE UNIQUE INDEX IF NOT EXISTS idx_qr_assignments_current_qr
  ON public.qr_assignments (qr_id)
  WHERE ended_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_qr_assignments_current_vehicle
  ON public.qr_assignments (vehicle_id)
  WHERE ended_at IS NULL;

-- Challenge bearer tokens are stored only as hashes. This also makes
-- restoration by challenge_token_hash an exact indexed lookup.
CREATE UNIQUE INDEX IF NOT EXISTS idx_qr_activation_challenges_token_unique
  ON public.qr_activation_challenges (challenge_token_hash);
