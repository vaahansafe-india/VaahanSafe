-- Align the private attempt ledger with the existing activation repository.
-- No credential, hash, lifecycle, ownership or failed-attempt state changes.
BEGIN;
ALTER TABLE public.qr_activation_attempts
 ADD COLUMN failure_reason_code text,
 ADD COLUMN request_fingerprint_hash text,
 ADD COLUMN ip_hash text;
CREATE INDEX IF NOT EXISTS qr_activation_attempts_recent ON public.qr_activation_attempts(qr_id,created_at DESC);
COMMENT ON COLUMN public.qr_activation_attempts.failure_reason_code IS 'Server-only controlled reason code; never an activation secret or provider payload.';
COMMENT ON COLUMN public.qr_activation_attempts.request_fingerprint_hash IS 'One-way request fingerprint only; no plaintext request or activation credential.';
COMMENT ON COLUMN public.qr_activation_attempts.ip_hash IS 'One-way IP digest only; never a plaintext client address.';
ALTER TABLE public.qr_activation_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.qr_activation_attempts FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT ON public.qr_activation_attempts TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
