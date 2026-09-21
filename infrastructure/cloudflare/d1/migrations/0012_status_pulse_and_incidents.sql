-- Migration: 0012_status_pulse_and_incidents.sql
-- Description: VaahanSafe System Pulse, Service Topologies, Incidents, and Maintenance
-- Platform: Cloudflare D1 (SQLite Dialect)

-- ------------------------------------------------------------------------------
-- 1. Status Services (Public Customer Journey Capabilities)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS status_services (
    id TEXT PRIMARY KEY,
    public_id TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    journey_stage TEXT NOT NULL CHECK (journey_stage IN ('DISCOVER', 'ACCOUNT', 'ACQUIRE', 'ACTIVATE', 'SCAN', 'CONNECT')),
    current_state TEXT NOT NULL DEFAULT 'OPERATIONAL' CHECK (current_state IN ('OPERATIONAL', 'DEGRADED', 'PARTIAL OUTAGE', 'MAJOR OUTAGE', 'MAINTENANCE', 'UNKNOWN')),
    display_order INTEGER NOT NULL DEFAULT 0,
    is_public INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_status_services_journey ON status_services(journey_stage, display_order);
CREATE INDEX IF NOT EXISTS idx_status_services_slug ON status_services(slug);

-- ------------------------------------------------------------------------------
-- 2. Status Service Events (Historical State Transitions for Reliability Rails)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS status_service_events (
    id TEXT PRIMARY KEY,
    service_id TEXT NOT NULL REFERENCES status_services(id) ON DELETE CASCADE,
    state TEXT NOT NULL CHECK (state IN ('OPERATIONAL', 'DEGRADED', 'PARTIAL OUTAGE', 'MAJOR OUTAGE', 'MAINTENANCE', 'UNKNOWN')),
    summary TEXT,
    started_at TEXT NOT NULL,
    ended_at TEXT,
    source TEXT NOT NULL DEFAULT 'SYSTEM',
    incident_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_status_events_service ON status_service_events(service_id, started_at DESC);

-- ------------------------------------------------------------------------------
-- 3. Status Incidents (Public Operational Events & Stories)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS status_incidents (
    id TEXT PRIMARY KEY,
    public_id TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    state TEXT NOT NULL CHECK (state IN ('INVESTIGATING', 'IDENTIFIED', 'MONITORING', 'RESOLVED')),
    impact TEXT NOT NULL CHECK (impact IN ('NONE', 'MINOR', 'MAJOR', 'CRITICAL')),
    started_at TEXT NOT NULL,
    resolved_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_status_incidents_state ON status_incidents(state, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_status_incidents_slug ON status_incidents(slug);

-- ------------------------------------------------------------------------------
-- 4. Status Incident Updates (Public Chronological Timeline Entries)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS status_incident_updates (
    id TEXT PRIMARY KEY,
    incident_id TEXT NOT NULL REFERENCES status_incidents(id) ON DELETE CASCADE,
    state TEXT NOT NULL CHECK (state IN ('INVESTIGATING', 'IDENTIFIED', 'MONITORING', 'RESOLVED')),
    message TEXT NOT NULL,
    published_at TEXT NOT NULL,
    created_by TEXT NOT NULL DEFAULT 'STAFF_ON_CALL',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_status_inc_updates ON status_incident_updates(incident_id, published_at DESC);

-- ------------------------------------------------------------------------------
-- 5. Status Incident Services (Many-to-Many Incident-to-Service Impact Relationship)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS status_incident_services (
    id TEXT PRIMARY KEY,
    incident_id TEXT NOT NULL REFERENCES status_incidents(id) ON DELETE CASCADE,
    service_id TEXT NOT NULL REFERENCES status_services(id) ON DELETE CASCADE,
    impact_summary TEXT,
    UNIQUE(incident_id, service_id)
);

CREATE INDEX IF NOT EXISTS idx_status_inc_serv_inc ON status_incident_services(incident_id);
CREATE INDEX IF NOT EXISTS idx_status_inc_serv_srv ON status_incident_services(service_id);

-- ------------------------------------------------------------------------------
-- 6. Status Maintenance (Scheduled Operational Windows)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS status_maintenance (
    id TEXT PRIMARY KEY,
    public_id TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    scheduled_start TEXT NOT NULL,
    scheduled_end TEXT NOT NULL,
    actual_start TEXT,
    actual_end TEXT,
    state TEXT NOT NULL CHECK (state IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_status_maint_sched ON status_maintenance(state, scheduled_start ASC);

-- ------------------------------------------------------------------------------
-- 7. Status Maintenance Services (Many-to-Many Maintenance Impact Relationship)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS status_maintenance_services (
    id TEXT PRIMARY KEY,
    maintenance_id TEXT NOT NULL REFERENCES status_maintenance(id) ON DELETE CASCADE,
    service_id TEXT NOT NULL REFERENCES status_services(id) ON DELETE CASCADE,
    UNIQUE(maintenance_id, service_id)
);

-- ------------------------------------------------------------------------------
-- 8. Seed the 6 Core Customer Journey Public Services
-- ------------------------------------------------------------------------------
INSERT OR IGNORE INTO status_services (id, public_id, slug, name, description, journey_stage, current_state, display_order, is_public) VALUES
('srv_website', 'vs_srv_web', 'website', 'Website & Documentation', 'Public vehicle safety portal, specifications, and replacement ordering.', 'DISCOVER', 'OPERATIONAL', 1, 1),
('srv_customer_app', 'vs_srv_app', 'customer-app', 'Customer App', 'Vehicle profile management, emergency contact setup, and digital identity access.', 'ACCOUNT', 'OPERATIONAL', 2, 1),
('srv_payments', 'vs_srv_pay', 'payments', 'Purchase & Payments', 'Authoritative order processing, Cashfree gateway checkout, and invoice generation.', 'ACQUIRE', 'OPERATIONAL', 3, 1),
('srv_activation', 'vs_srv_act', 'retail-activation', 'Retail Activation', 'Secure retail sticker claim, scratch PIN verification, and vehicle association.', 'ACTIVATE', 'OPERATIONAL', 4, 1),
('srv_qr_access', 'vs_srv_qra', 'vehicle-qr-access', 'Vehicle QR Access', 'Instant roadside bystander scan resolution, safety profile exposure, and relay dispatch.', 'SCAN', 'OPERATIONAL', 5, 1),
('srv_notifications', 'vs_srv_not', 'notifications', 'Emergency Notifications', 'Multi-channel SMS, WhatsApp, and call relay alerts during roadside vehicle incidents.', 'CONNECT', 'OPERATIONAL', 6, 1);
