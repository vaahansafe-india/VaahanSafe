-- Provider-owned OTP audit and abuse limits. Plaintext codes/phone/IP never persisted.
-- No foreign keys: anonymous pre-auth requests must survive account lifecycle changes.
CREATE TABLE auth_otp_requests (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  phone_hash TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  surface TEXT NOT NULL CHECK(surface IN ('CUSTOMER','ACTIVATE','API','ADMIN')),
  channel TEXT NOT NULL CHECK(channel IN ('SMS','WHATSAPP')),
  status TEXT NOT NULL CHECK(status IN ('RESERVED','SENT','VERIFYING','VERIFIED','FAILED')),
  provider_request_id TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK(attempt_count BETWEEN 0 AND 5),
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  verified_at INTEGER
);
CREATE INDEX idx_auth_otp_phone_time ON auth_otp_requests(phone_hash, created_at DESC);
CREATE INDEX idx_auth_otp_ip_time ON auth_otp_requests(ip_hash, created_at DESC);
CREATE INDEX idx_auth_otp_expiry ON auth_otp_requests(expires_at);
