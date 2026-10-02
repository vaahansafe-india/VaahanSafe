-- Private, immutable landing zone for a verified Cloudflare D1 export.
-- The application never reads this schema. It preserves every legacy record
-- while identities and domain tables are mapped into Supabase Auth/Postgres.
CREATE SCHEMA IF NOT EXISTS migration_archive;
REVOKE ALL ON SCHEMA migration_archive FROM PUBLIC, anon, authenticated;

CREATE TABLE migration_archive.snapshots (
  sha256 text PRIMARY KEY CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  source_database text NOT NULL,
  exported_at timestamptz NOT NULL,
  imported_at timestamptz NOT NULL DEFAULT now(),
  expected_rows integer NOT NULL CHECK (expected_rows >= 0),
  expected_tables integer NOT NULL CHECK (expected_tables >= 0)
);
CREATE TABLE migration_archive.d1_rows (
  snapshot_sha256 text NOT NULL REFERENCES migration_archive.snapshots(sha256) ON DELETE RESTRICT,
  source_table text NOT NULL,
  source_ordinal integer NOT NULL CHECK (source_ordinal > 0),
  source_key text,
  record jsonb NOT NULL CHECK (jsonb_typeof(record) = 'object'),
  record_sha256 text NOT NULL CHECK (record_sha256 ~ '^[0-9a-f]{64}$'),
  PRIMARY KEY (snapshot_sha256, source_table, source_ordinal)
);
CREATE INDEX idx_d1_rows_source_key
  ON migration_archive.d1_rows(source_table, source_key)
  WHERE source_key IS NOT NULL;
ALTER TABLE migration_archive.snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE migration_archive.d1_rows ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA migration_archive FROM PUBLIC, anon, authenticated;

-- Supabase creates this event trigger function with broad default grants.
-- Event triggers do not need direct Data API execution.
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
ALTER FUNCTION public.update_updated_at_column() SET search_path = '';
