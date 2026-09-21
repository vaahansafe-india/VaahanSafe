-- ==============================================================================
-- Migration: 0002_vehicle_emergency.sql
-- Description: Vehicles & Public Emergency Profile Schema
-- Engine: Cloudflare D1 (SQLite)
-- Invariants:
--   - Registration number is normalized (uppercase, no whitespace/hyphens)
--   - User deletion does NOT cascade to vehicle (RESTRICT / Anonymize)
--   - Emergency profile is separate from customer account profile
--   - Privacy flags are explicit booleans (INTEGER 0/1); public projection respects them strictly
--   - Contacts belong to emergency profiles, prioritized 1..5
-- ==============================================================================

PRAGMA foreign_keys = ON;

-- ------------------------------------------------------------------------------
-- 1. Vehicles Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vehicles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    registration_number TEXT NOT NULL,
    registration_number_normalized TEXT NOT NULL,
    vehicle_type TEXT NOT NULL DEFAULT 'CAR' 
        CHECK (vehicle_type IN ('CAR', 'MOTORCYCLE', 'SCOOTER', 'AUTO', 'COMMERCIAL', 'OTHER')),
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    variant TEXT,
    year INTEGER,
    color TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE' 
        CHECK (status IN ('ACTIVE', 'INACTIVE', 'TRANSFERRED', 'DELETED')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_vehicles_user_status ON vehicles(user_id, status);
CREATE INDEX IF NOT EXISTS idx_vehicles_reg_normalized ON vehicles(registration_number_normalized);

-- ------------------------------------------------------------------------------
-- 2. Emergency Profiles Table (Per-vehicle public projection privacy controls)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS emergency_profiles (
    id TEXT PRIMARY KEY,
    vehicle_id TEXT NOT NULL UNIQUE REFERENCES vehicles(id) ON DELETE CASCADE,
    display_name TEXT,
    blood_group TEXT CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') OR blood_group IS NULL),
    medical_notes TEXT,
    public_vehicle_details TEXT,
    show_owner_name INTEGER NOT NULL DEFAULT 1 CHECK (show_owner_name IN (0, 1)),
    show_blood_group INTEGER NOT NULL DEFAULT 1 CHECK (show_blood_group IN (0, 1)),
    show_medical_notes INTEGER NOT NULL DEFAULT 0 CHECK (show_medical_notes IN (0, 1)),
    show_vehicle_details INTEGER NOT NULL DEFAULT 1 CHECK (show_vehicle_details IN (0, 1)),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'DISABLED')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_emergency_profiles_status ON emergency_profiles(status);

-- ------------------------------------------------------------------------------
-- 3. Emergency Contacts Table (Publicly callable/contactable numbers)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id TEXT PRIMARY KEY,
    emergency_profile_id TEXT NOT NULL REFERENCES emergency_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    relationship_label TEXT NOT NULL,
    phone TEXT NOT NULL,
    priority INTEGER NOT NULL DEFAULT 1 CHECK (priority >= 1 AND priority <= 5),
    is_enabled INTEGER NOT NULL DEFAULT 1 CHECK (is_enabled IN (0, 1)),
    allow_call INTEGER NOT NULL DEFAULT 1 CHECK (allow_call IN (0, 1)),
    allow_message INTEGER NOT NULL DEFAULT 1 CHECK (allow_message IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_emergency_contacts_profile_priority 
    ON emergency_contacts(emergency_profile_id, is_enabled, priority);
