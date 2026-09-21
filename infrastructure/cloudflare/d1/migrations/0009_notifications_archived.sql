-- ==============================================================================
-- Migration: 0009_notifications_archived.sql
-- Description: Add archived_at column and index to notifications table for inbox triage
-- Engine: Cloudflare D1 (SQLite)
-- Invariant: Archiving a notification removes it from the active inbox but NEVER deletes
--            the underlying domain event or audit log.
-- ==============================================================================

ALTER TABLE notifications ADD COLUMN archived_at TEXT;

CREATE INDEX IF NOT EXISTS idx_notifications_user_archived ON notifications(user_id, archived_at, created_at DESC);
