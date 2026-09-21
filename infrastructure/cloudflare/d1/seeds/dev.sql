-- ==============================================================================
-- Development Seed Data (database/seeds/dev.sql)
-- Environment: Local / Development / Automated Testing ONLY
-- INVARIANT 15: Production data NEVER appears in seeds.
-- INVARIANT 05: Scratch secret plaintext NEVER stored; hashes only.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Users & Identities
-- ------------------------------------------------------------------------------
INSERT OR IGNORE INTO users (
    id, primary_phone, primary_email, full_name, onboarding_status, status, created_at, updated_at
) VALUES 
('usr_demo_101', '+919876543210', 'ramesh.kumar@example.synthetic', 'Ramesh Kumar', 'COMPLETED', 'ACTIVE', datetime('now', '-30 days'), datetime('now', '-30 days')),
('usr_demo_102', '+919811122233', 'priya.sharma@example.synthetic', 'Priya Sharma', 'PHONE_REQUIRED', 'ACTIVE', datetime('now', '-10 days'), datetime('now', '-10 days'));

INSERT OR IGNORE INTO auth_identities (
    id, user_id, provider, provider_subject, normalized_identifier, verified_at
) VALUES
('aid_demo_phone_1', 'usr_demo_101', 'PHONE', '+919876543210', '+919876543210', datetime('now', '-30 days')),
('aid_demo_google_1', 'usr_demo_101', 'GOOGLE', 'google_sub_ramesh_demo_98765', 'ramesh.kumar@example.synthetic', datetime('now', '-25 days'));

INSERT OR IGNORE INTO sessions (
    id, user_id, token_hash, user_agent, ip_address, expires_at
) VALUES
('ses_demo_1', 'usr_demo_101', 'sha256_mock_session_token_hash_abc123', 'Mozilla/5.0 (iPhone)', '127.0.0.1', datetime('now', '+30 days'));

INSERT OR IGNORE INTO addresses (
    id, user_id, recipient_name, phone, line1, line2, city, state, postal_code, country_code, type, is_default
) VALUES
('adr_demo_1', 'usr_demo_101', 'Ramesh Kumar', '+919876543210', 'Flat 402, Safety Residency', 'Baner Road', 'Pune', 'Maharashtra', '411045', 'IN', 'SHIPPING', 1);

INSERT OR IGNORE INTO admin_users (
    id, email, name, role, status
) VALUES
('adm_demo_ops', 'ops.admin@vaahansafe.synthetic', 'VaahanSafe Ops Officer', 'OPS_ADMIN', 'ACTIVE');

-- ------------------------------------------------------------------------------
-- 2. Vehicles & Emergency Profiles
-- ------------------------------------------------------------------------------
INSERT OR IGNORE INTO vehicles (
    id, user_id, registration_number, registration_number_normalized, vehicle_type, make, model, variant, year, color, status
) VALUES
('veh_demo_car', 'usr_demo_101', 'MH 12 AB 1234', 'MH12AB1234', 'CAR', 'Hyundai', 'Creta', 'SX(O)', 2023, 'Polar White', 'ACTIVE'),
('veh_demo_bike', 'usr_demo_101', 'MH 14 XY 9876', 'MH14XY9876', 'MOTORCYCLE', 'Royal Enfield', 'Classic 350', 'Halcyon', 2022, 'Black', 'ACTIVE');

INSERT OR IGNORE INTO emergency_profiles (
    id, vehicle_id, display_name, blood_group, medical_notes, public_vehicle_details, show_owner_name, show_blood_group, show_medical_notes, show_vehicle_details, status
) VALUES
('emp_demo_car', 'veh_demo_car', 'Ramesh K.', 'O+', 'No known drug allergies. Penicillin safe.', 'White Hyundai Creta (MH12AB1234)', 1, 1, 1, 1, 'ACTIVE');

INSERT OR IGNORE INTO emergency_contacts (
    id, emergency_profile_id, name, relationship_label, phone, priority, is_enabled, allow_call, allow_message
) VALUES
('emc_demo_1', 'emp_demo_car', 'Sunita Kumar', 'Spouse', '+919876500001', 1, 1, 1, 1),
('emc_demo_2', 'emp_demo_car', 'Amit Kumar', 'Brother', '+919876500002', 2, 1, 1, 1);

-- ------------------------------------------------------------------------------
-- 3. QR Batches & Stickers
-- ------------------------------------------------------------------------------
INSERT OR IGNORE INTO qr_batches (
    id, reference_code, quantity, status, manufacturer_name, printed_at
) VALUES
('qrb_demo_2026_01', 'BAT/VS/2026/001', 1000, 'PRINTED', 'SecurePrint India Tech Ltd', datetime('now', '-60 days'));

INSERT OR IGNORE INTO qr_stickers (
    id, public_id, visible_code, batch_id, status, activated_at, replaced_by_qr_id
) VALUES
('qr_active_001', '7F3K9021', 'VS-7F3K-9021', 'qrb_demo_2026_01', 'ACTIVATED', datetime('now', '-20 days'), NULL),
('qr_printed_002', '8M2P4510', 'VS-8M2P-4510', 'qrb_demo_2026_01', 'PRINTED', NULL, NULL),
('qr_retail_003', '9Q4R7822', 'VS-9Q4R-7822', 'qrb_demo_2026_01', 'WITH_RETAILER', NULL, NULL),
('qr_replaced_004', '2B9C1100', 'VS-2B9C-1100', 'qrb_demo_2026_01', 'REPLACED', datetime('now', '-90 days'), 'qr_active_001'),
('qr_lost_005', '4D8F3344', 'VS-4D8F-3344', 'qrb_demo_2026_01', 'LOST_DAMAGED', NULL, NULL),
('qr_blocked_006', '5E9G7788', 'VS-5E9G-7788', 'qrb_demo_2026_01', 'BLOCKED', NULL, NULL);

-- ------------------------------------------------------------------------------
-- 4. QR Activation Secrets (Hashes of synthetic scratch codes)
-- ------------------------------------------------------------------------------
-- Synthetic plaintexts:
-- qr_active_001: was 'DEMOACTIVATED' (consumed)
-- qr_printed_002: is 'DEMO1234' -> sha256: b38a0f82...
-- qr_retail_003: is 'RETAIL56' -> sha256: a1b2c3d4...
INSERT OR IGNORE INTO qr_activation_secrets (
    id, qr_id, secret_hash, hash_version, failed_attempts, consumed_at
) VALUES
('qse_demo_1', 'qr_active_001', 'sha256_mock_hash_for_demo_activated_qr', 'v1', 0, datetime('now', '-20 days')),
('qse_demo_2', 'qr_printed_002', '882c6aaa092092e51d0a7389472b443287cd7f09fa1542c8c6a21f2b3cfcf5d3', 'v1', 0, NULL),
('qse_demo_3', 'qr_retail_003', 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0', 'v1', 0, NULL);

-- ------------------------------------------------------------------------------
-- 5. QR Assignments (Enforcing Single-Active Invariant)
-- ------------------------------------------------------------------------------
INSERT OR IGNORE INTO qr_assignments (
    id, qr_id, vehicle_id, user_id, assignment_type, assigned_at, ended_at, end_reason
) VALUES
('qra_demo_active', 'qr_active_001', 'veh_demo_car', 'usr_demo_101', 'INITIAL', datetime('now', '-20 days'), NULL, NULL),
('qra_demo_replaced', 'qr_replaced_004', 'veh_demo_car', 'usr_demo_101', 'INITIAL', datetime('now', '-90 days'), datetime('now', '-20 days'), 'REPLACED');

-- ------------------------------------------------------------------------------
-- 6. QR Lifecycle & Scan Events
-- ------------------------------------------------------------------------------
INSERT OR IGNORE INTO qr_status_history (
    id, qr_id, from_status, to_status, reason_code, actor_type, actor_id, created_at
) VALUES
('qsh_demo_1', 'qr_active_001', 'PRINTED', 'ACTIVATED', 'USER_ACTIVATION', 'USER', 'usr_demo_101', datetime('now', '-20 days')),
('qsh_demo_2', 'qr_replaced_004', 'ACTIVATED', 'REPLACED', 'STICKER_DAMAGED', 'USER', 'usr_demo_101', datetime('now', '-20 days'));

INSERT OR IGNORE INTO qr_scan_events (
    id, qr_id, scan_type, result, city, state, created_at
) VALUES
('qse_scan_1', 'qr_active_001', 'PUBLIC_RESOLVE', 'RESOLVED_ACTIVE', 'Pune', 'Maharashtra', datetime('now', '-5 days'));
