-- Every bar in the public status history is backed by a real scheduled check.
-- A missing row means the condition is unknown, never implicitly healthy.
CREATE TABLE IF NOT EXISTS status_probe_samples (
    service_id TEXT NOT NULL REFERENCES status_services(id) ON DELETE RESTRICT,
    checked_at TEXT NOT NULL,
    result TEXT NOT NULL CHECK (result IN ('UP', 'DEGRADED', 'DOWN')),
    latency_ms INTEGER NOT NULL CHECK (latency_ms >= 0),
    http_status INTEGER CHECK (http_status BETWEEN 100 AND 599),
    PRIMARY KEY (service_id, checked_at)
);

CREATE INDEX IF NOT EXISTS idx_status_probe_samples_checked_at
    ON status_probe_samples(checked_at);

-- RESTRICT retains evidence when a service is removed from the public catalog.
