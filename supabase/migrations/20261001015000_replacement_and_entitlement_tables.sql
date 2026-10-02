-- ============================================================================
-- VAAHANSAFE AUTHORITATIVE POSTGRESQL SCHEMA - PART 2
-- Replacement Requests, Sticker Replacements, Service Entitlements & Notifications
-- ============================================================================

-- 1. Replacement Requests Table
CREATE TABLE IF NOT EXISTS public.replacement_requests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    vehicle_id TEXT NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
    old_qr_sticker_id TEXT NOT NULL REFERENCES public.qr_stickers(id) ON DELETE RESTRICT,
    reason TEXT NOT NULL,
    user_notes TEXT,
    status TEXT NOT NULL DEFAULT 'REQUESTED',
    risk_level TEXT NOT NULL DEFAULT 'LOW',
    requires_step_up INTEGER NOT NULL DEFAULT 0,
    approved_by TEXT,
    rejection_reason TEXT,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_replacement_user ON public.replacement_requests(user_id, status);
CREATE INDEX IF NOT EXISTS idx_replacement_vehicle ON public.replacement_requests(vehicle_id);

-- 2. Sticker Replacements Table
CREATE TABLE IF NOT EXISTS public.sticker_replacements (
    id TEXT PRIMARY KEY,
    replacement_request_id TEXT NOT NULL UNIQUE REFERENCES public.replacement_requests(id) ON DELETE RESTRICT,
    old_qr_sticker_id TEXT NOT NULL REFERENCES public.qr_stickers(id) ON DELETE RESTRICT,
    new_qr_sticker_id TEXT NOT NULL REFERENCES public.qr_stickers(id) ON DELETE RESTRICT,
    vehicle_id TEXT NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
    reason TEXT NOT NULL,
    migrated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Service Entitlements Table
CREATE TABLE IF NOT EXISTS public.service_entitlements (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    vehicle_id TEXT NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
    qr_sticker_id TEXT NOT NULL REFERENCES public.qr_stickers(id) ON DELETE RESTRICT,
    capability TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ENABLED',
    acquisition_source TEXT NOT NULL,
    order_id TEXT REFERENCES public.orders(id) ON DELETE RESTRICT,
    verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_service_entitlements_unique 
    ON public.service_entitlements(vehicle_id, qr_sticker_id, capability);
CREATE INDEX IF NOT EXISTS idx_service_entitlements_user 
    ON public.service_entitlements(user_id, status);

-- 4. Payment Webhook Events Table
CREATE TABLE IF NOT EXISTS public.payment_webhook_events (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL DEFAULT 'CASHFREE',
    provider_event_id TEXT,
    event_type TEXT NOT NULL,
    provider_order_id TEXT,
    provider_payment_id TEXT,
    processing_status TEXT NOT NULL DEFAULT 'RECEIVED',
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    request_id TEXT
);
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_dedupe 
    ON public.payment_webhook_events(provider, provider_event_id);

-- 5. Refunds Table
CREATE TABLE IF NOT EXISTS public.refunds (
    id TEXT PRIMARY KEY,
    payment_id TEXT NOT NULL REFERENCES public.payments(id) ON DELETE RESTRICT,
    order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
    provider TEXT NOT NULL DEFAULT 'CASHFREE',
    provider_refund_id TEXT,
    amount_minor INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'REQUESTED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. QR Activation Challenges Table
CREATE TABLE IF NOT EXISTS public.qr_activation_challenges (
    id TEXT PRIMARY KEY,
    challenge_token_hash TEXT NOT NULL UNIQUE,
    qr_id TEXT NOT NULL REFERENCES public.qr_stickers(id) ON DELETE CASCADE,
    public_id TEXT NOT NULL,
    user_id TEXT,
    proof_verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_qr_activation_challenges_token ON public.qr_activation_challenges(challenge_token_hash);
CREATE INDEX IF NOT EXISTS idx_qr_activation_challenges_qr ON public.qr_activation_challenges(qr_id);

-- 7. Notification Intents Table
CREATE TABLE IF NOT EXISTS public.notification_intents (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    recipient_user_id TEXT NOT NULL,
    category TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'NORMAL',
    template_key TEXT NOT NULL,
    template_version INTEGER NOT NULL DEFAULT 1,
    payload_json TEXT NOT NULL,
    source_type TEXT NOT NULL,
    source_id TEXT NOT NULL,
    dedupe_key TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    dispatched_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_notification_intents_recipient ON public.notification_intents(recipient_user_id, created_at DESC);

-- 8. Notification Deliveries Table
CREATE TABLE IF NOT EXISTS public.notification_deliveries (
    id TEXT PRIMARY KEY,
    intent_id TEXT NOT NULL REFERENCES public.notification_intents(id) ON DELETE CASCADE,
    notification_id TEXT,
    channel TEXT NOT NULL,
    provider TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    provider_message_id TEXT,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    last_failure_code TEXT,
    next_attempt_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    UNIQUE (intent_id, channel)
);

-- 9. Notification Delivery Attempts Table
CREATE TABLE IF NOT EXISTS public.notification_delivery_attempts (
    id TEXT PRIMARY KEY,
    delivery_id TEXT NOT NULL REFERENCES public.notification_deliveries(id) ON DELETE CASCADE,
    attempt_number INTEGER NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    result TEXT NOT NULL,
    normalized_error_code TEXT,
    provider_reference TEXT,
    request_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Notification Preferences Table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    category TEXT NOT NULL,
    channel TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, category, channel)
);
