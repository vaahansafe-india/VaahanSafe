-- Existing system inventory stays online. Offline imports never fill online orders.
ALTER TABLE qr_batches ADD COLUMN inventory_channel TEXT NOT NULL DEFAULT 'ONLINE_SYSTEM'
  CHECK (inventory_channel IN ('ONLINE_SYSTEM', 'OFFLINE_RETAIL'));
