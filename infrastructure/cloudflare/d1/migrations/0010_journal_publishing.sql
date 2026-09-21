-- ==============================================================================
-- Migration: 0010_journal_publishing.sql
-- Description: VaahanSafe Journal Publishing Subsystem Schema & Canonical Content
-- Engine: Cloudflare D1 (SQLite)
-- Invariants:
--   - Cloudflare D1 is the single relational source of truth for published content
--   - Cloudflare R2 owns all article binary media; zero image binaries in D1
--   - Public blog is strictly read-only; mutations belong to future admin.vaahansafe.com
--   - Draft and scheduled articles are strictly protected from public queries
--   - Article revisions preserve editorial history and rollback capabilities
--   - Slug history guarantees 301 redirection on URL changes
--   - Placements determine homepage layout deterministically without code deploys
-- ==============================================================================

PRAGMA foreign_keys = ON;

-- ------------------------------------------------------------------------------
-- 1. Journal Categories Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS journal_categories (
    id TEXT PRIMARY KEY,
    public_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_journal_categories_slug ON journal_categories(slug);
CREATE INDEX IF NOT EXISTS idx_journal_categories_sort ON journal_categories(sort_order, is_active);

-- ------------------------------------------------------------------------------
-- 2. Journal Authors Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS journal_authors (
    id TEXT PRIMARY KEY,
    public_id TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    bio TEXT,
    avatar_media_id TEXT,
    role_label TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_journal_authors_slug ON journal_authors(slug);

-- ------------------------------------------------------------------------------
-- 3. Journal Media Metadata Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS journal_media (
    id TEXT PRIMARY KEY,
    public_id TEXT NOT NULL UNIQUE,
    storage_key TEXT NOT NULL UNIQUE,
    media_asset_id TEXT REFERENCES media_assets(id),
    mime_type TEXT NOT NULL,
    width INTEGER,
    height INTEGER,
    file_size INTEGER,
    alt_text TEXT,
    caption TEXT,
    focal_x REAL DEFAULT 0.5,
    focal_y REAL DEFAULT 0.5,
    frame_type TEXT DEFAULT 'OFFSET_LANDSCAPE'
        CHECK (frame_type IN ('FULL_BLEED', 'OFFSET_LANDSCAPE', 'TALL_PORTRAIT', 'CROPPED_DETAIL', 'INSET_TECHNICAL', 'DARK_FIELD')),
    created_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_journal_media_storage_key ON journal_media(storage_key);

-- ------------------------------------------------------------------------------
-- 4. Journal Articles Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS journal_articles (
    id TEXT PRIMARY KEY,
    public_id TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    subtitle TEXT,
    excerpt TEXT,
    content_format TEXT NOT NULL DEFAULT 'MARKDOWN'
        CHECK (content_format IN ('MARKDOWN', 'JSON_BLOCKS', 'HTML')),
    content_source TEXT NOT NULL,
    category_id TEXT REFERENCES journal_categories(id),
    author_id TEXT REFERENCES journal_authors(id),
    status TEXT NOT NULL DEFAULT 'DRAFT'
        CHECK (status IN ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED')),
    featured_media_id TEXT REFERENCES journal_media(id),
    og_media_id TEXT REFERENCES journal_media(id),
    seo_title TEXT,
    seo_description TEXT,
    reading_time_minutes INTEGER NOT NULL DEFAULT 5,
    scheduled_at TEXT,
    published_at TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    created_by TEXT,
    updated_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_journal_articles_pub ON journal_articles(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_journal_articles_cat_pub ON journal_articles(category_id, status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_journal_articles_slug ON journal_articles(slug);

-- ------------------------------------------------------------------------------
-- 5. Journal Tags Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS journal_tags (
    id TEXT PRIMARY KEY,
    public_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_journal_tags_slug ON journal_tags(slug);

-- ------------------------------------------------------------------------------
-- 6. Journal Article Tags Table (N:M Relationship)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS journal_article_tags (
    article_id TEXT NOT NULL REFERENCES journal_articles(id) ON DELETE CASCADE,
    tag_id TEXT NOT NULL REFERENCES journal_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (article_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_journal_art_tags_tag ON journal_article_tags(tag_id);

-- ------------------------------------------------------------------------------
-- 7. Journal Article Revisions Table (CMS Versioning & Audit)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS journal_article_revisions (
    id TEXT PRIMARY KEY,
    article_id TEXT NOT NULL REFERENCES journal_articles(id) ON DELETE CASCADE,
    revision_number INTEGER NOT NULL,
    title_snapshot TEXT NOT NULL,
    excerpt_snapshot TEXT,
    content_snapshot TEXT NOT NULL,
    editor_id TEXT,
    change_summary TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(article_id, revision_number)
);

CREATE INDEX IF NOT EXISTS idx_journal_revisions_article ON journal_article_revisions(article_id, revision_number DESC);

-- ------------------------------------------------------------------------------
-- 8. Journal Article Slug History Table (301 Redirect Preservation)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS journal_article_slug_history (
    id TEXT PRIMARY KEY,
    article_id TEXT NOT NULL REFERENCES journal_articles(id) ON DELETE CASCADE,
    old_slug TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_journal_slug_history_old ON journal_article_slug_history(old_slug);

-- ------------------------------------------------------------------------------
-- 9. Journal Placements Table (Homepage Editorial Slots)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS journal_placements (
    id TEXT PRIMARY KEY,
    slot TEXT NOT NULL CHECK (slot IN (
        'HERO',
        'LEAD',
        'SECONDARY',
        'PRIVACY_SPOTLIGHT',
        'GUIDE_FEATURE',
        'DARK_CHAPTER',
        'LATEST_INDEX'
    )),
    article_id TEXT NOT NULL REFERENCES journal_articles(id) ON DELETE CASCADE,
    priority INTEGER NOT NULL DEFAULT 0,
    starts_at TEXT,
    ends_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_journal_placements_slot ON journal_placements(slot, priority);

-- ==============================================================================
-- CANONICAL EDITORIAL SEEDS (Pre-loaded content from Day One)
-- ==============================================================================

-- 1. Categories
INSERT OR IGNORE INTO journal_categories (id, public_id, name, slug, description, sort_order, is_active) VALUES
('jcat_safety', 'cat_safety', 'Vehicle Safety', 'vehicle-safety', 'Physical safety, crash-readiness, and emergency preparedness for Indian motoring.', 1, 1),
('jcat_qr', 'cat_qr', 'QR & Identity', 'qr-identity', 'Optical identity architecture, resolver technology, and sticker engineering.', 2, 1),
('jcat_privacy', 'cat_privacy', 'Privacy', 'privacy', 'Data protection, zero phone leaks, and the DPDP Act 2023 compliance framework.', 3, 1),
('jcat_guides', 'cat_guides', 'Safety Guides', 'safety-guides', 'Clear step-by-step instructions for placement, emergency contacts, and roadside protocols.', 4, 1),
('jcat_product', 'cat_product', 'Product', 'product', 'Updates on VaahanSafe physical stickers, replacement policies, and fleet management.', 5, 1),
('jcat_updates', 'cat_updates', 'VaahanSafe Updates', 'vaahansafe-updates', 'Engineering milestones, compliance updates, and platform releases.', 6, 1);

-- 2. Authors
INSERT OR IGNORE INTO journal_authors (id, public_id, display_name, slug, bio, role_label, is_active) VALUES
('jaut_editorial', 'aut_editorial', 'VaahanSafe Editorial Team', 'vaahansafe-editorial', 'Engineers, roadside emergency specialists, and privacy advocates documenting the intersection of vehicles and digital identity.', 'Safety & Privacy Engineering', 1),
('jaut_sharma', 'aut_sharma', 'Dr. Ananya Sharma', 'ananya-sharma', 'Specialized trauma researcher and legal consultant on Indian Motor Vehicles Act compliance and emergency roadside triage.', 'Road Safety Research Lead', 1);

-- 3. Media Metadata (R2 Storage Keys)
INSERT OR IGNORE INTO journal_media (id, public_id, storage_key, mime_type, width, height, alt_text, caption, frame_type) VALUES
('jmed_hero', 'med_hero', 'blog/editorial/vehicle-qr-safety-hero.webp', 'image/webp', 1920, 1080, 'VaahanSafe QR safety sticker on front vehicle windshield', 'FIG. 01 / WINDSHIELD DEPLOYMENT', 'OFFSET_LANDSCAPE'),
('jmed_lead', 'med_lead', 'blog/editorial/emergency-contact-relays.webp', 'image/webp', 1200, 800, 'Motorist scanning emergency QR tag on parked car', 'FIG. 02 / ROADSIDE RESOLUTION', 'OFFSET_LANDSCAPE'),
('jmed_vertical', 'med_vertical', 'blog/editorial/qr-identity-diagram.webp', 'image/webp', 800, 1200, 'Macro photography of automotive UV-resistant polymer sticker', 'FIG. 03 / POLYMER SUBSTRATE', 'TALL_PORTRAIT'),
('jmed_guide', 'med_guide', 'blog/editorial/placement-guide-measurements.webp', 'image/webp', 1600, 900, 'Infographic demonstrating correct QR sticker placement', 'FIG. 04 / OPTICAL VISIBILITY CONE', 'INSET_TECHNICAL'),
('jmed_macro', 'med_macro', 'blog/editorial/sticker-glass-macro.webp', 'image/webp', 1400, 933, 'Monochrome macro detail of QR sticker on laminated automotive glass', 'FIG. 05 / OPTICAL RESOLVER MESH', 'DARK_FIELD'),
('jmed_bonding', 'med_bonding', 'blog/editorial/windshield-decal-bonding.webp', 'image/webp', 1600, 900, 'VaahanSafe acrylic polymer sticker testing on tempered windscreen', 'FIG. 06 / THERMAL POLYMER BONDING', 'INSET_TECHNICAL'),
('jmed_glazing', 'med_glazing', 'blog/editorial/optical-contrast-automotive-glazing.webp', 'image/webp', 1600, 900, 'Spectrophotometric transmission analysis through automotive PVB laminate', 'FIG. 07 / OPTICAL TRANSMISSION PROFILE', 'INSET_TECHNICAL'),
('jmed_action', 'med_action', 'blog/editorial/roadside-bystander-action-chain.webp', 'image/webp', 1600, 900, 'First responder bystander securing highway crash scene', 'FIG. 08 / FIRST 180 SECONDS PROTOCOL', 'OFFSET_LANDSCAPE'),
('jmed_duallayer', 'med_duallayer', 'blog/editorial/dual-layer-identity-architecture.webp', 'image/webp', 1600, 900, 'Diagram of physical QR sticker paired with Cloudflare D1 encrypted identity', 'FIG. 09 / DUAL-LAYER SECURITY BRIDGE', 'OFFSET_LANDSCAPE'),
('jmed_edgeroute', 'med_edgeroute', 'blog/editorial/edge-routing-emergency-alerts.webp', 'image/webp', 1600, 900, 'Cloudflare global edge network routing emergency bystander calls', 'FIG. 10 / GLOBAL EDGE ROUTING TOPOLOGY', 'OFFSET_LANDSCAPE');

-- 4. Tags
INSERT OR IGNORE INTO journal_tags (id, public_id, name, slug) VALUES
('jtag_privacy', 'tag_privacy', 'Privacy', 'privacy'),
('jtag_safety', 'tag_safety', 'Vehicle Safety', 'vehicle-safety'),
('jtag_qr', 'tag_qr', 'QR Code', 'qr-code'),
('jtag_hardware', 'tag_hardware', 'Hardware', 'hardware'),
('jtag_emergency', 'tag_emergency', 'Emergency', 'emergency'),
('jtag_compliance', 'tag_compliance', 'Compliance', 'compliance'),
('jtag_samaritan', 'tag_samaritan', 'Good Samaritan', 'good-samaritan'),
('jtag_materials', 'tag_materials', 'Materials Engineering', 'materials-engineering'),
('jtag_optics', 'tag_optics', 'Optical Engineering', 'optical-engineering'),
('jtag_firstaid', 'tag_firstaid', 'First Aid Protocol', 'first-aid-protocol'),
('jtag_telephony', 'tag_telephony', 'Telephony Routing', 'telephony-routing'),
('jtag_cmvr', 'tag_cmvr', 'CMVR Regulations', 'cmvr-regulations');

-- 5. Articles
INSERT OR IGNORE INTO journal_articles (
    id, public_id, slug, title, subtitle, excerpt, content_format, content_source,
    category_id, author_id, status, featured_media_id, reading_time_minutes, published_at, version
) VALUES
(
    'jart_01', 'art_01', 'vehicle-qr-privacy-boundary',
    'What Information Should Your Vehicle Make Available When It Matters?',
    'The architectural boundary between emergency accessibility and owner privacy',
    'A vehicle is visible to everyone on the road. Its owner identity should never be broadcast casually. Here is how VaahanSafe balances instant bystander emergency calling with ironclad data privacy.',
    'MARKDOWN',
    'A vehicle exists in public space. Millions of motorists display phone numbers on pieces of paper behind their windscreens. This creates an unmonitored privacy leak. VaahanSafe solves this with an authoritative, dynamic proxy bridge under the DPDP Act 2023.',
    'jcat_safety', 'jaut_editorial', 'PUBLISHED', 'jmed_hero', 8, '2026-09-20 12:00:00', 1
),
(
    'jart_02', 'art_02', 'emergency-contact-relays',
    'How Emergency Contacts Receive and Respond to Decal Relays',
    'Notification engine architecture, Cloudflare queues, and multi-tier fallback relays',
    'When a bystander scans your QR, who answers? We break down how multi-tier contact relays work, preventing harassment while guaranteeing that critical alerts reach your designated family circle.',
    'MARKDOWN',
    'In critical roadside scenarios, every second counts. However, exposing emergency contact numbers directly to any casual passerby creates severe harassment vectors. Masked calling and queued fallback cascades solve both problems.',
    'jcat_guides', 'jaut_editorial', 'PUBLISHED', 'jmed_lead', 6, '2026-09-19 00:00:00', 1
),
(
    'jart_03', 'art_03', 'good-samaritan-law-india',
    'Good Samaritan Law in India: Legal Protection for Roadside Helpers',
    'Section 134A of the Motor Vehicles Act, MoRTH guidelines, and hospital admission mandates',
    'Indian law explicitly shields bystanders who assist road crash victims from civil or criminal liability. Here is how digital identity streamlines emergency response without compromising legal rights.',
    'MARKDOWN',
    'Section 134A of the Motor Vehicles Act (amended in 2019) is a monumental piece of legislation. It protects any citizen who steps forward to assist at an accident site. Section 357C of the Code of Criminal Procedure and Section 396 of Bharatiya Nagarik Suraksha Sanhita (BNSS) further mandate immediate first aid by all registered hospitals.',
    'jcat_safety', 'jaut_sharma', 'PUBLISHED', 'jmed_hero', 9, '2026-09-17 00:00:00', 1
),
(
    'jart_04', 'art_04', 'separating-contacts-from-address',
    'Separating Contact Channels from Residential Addresses',
    'The technical architecture of the VaahanSafe Privacy Projection and DPDP Act 2023 compliance',
    'Every public resolver URL leads to a dynamic projection layer, not a database dump. Here is how Cloudflare Workers filter sensitive owner records before any HTML reaches the bystander browser.',
    'MARKDOWN',
    'The fundamental flaw of traditional engraved or written vehicle tags is permanence. If you write your phone number, it is permanently public. With VaahanSafe, the QR is only an opaque handle adhering to Sections 4, 7, and 8 of the Digital Personal Data Protection Act 2023.',
    'jcat_privacy', 'jaut_editorial', 'PUBLISHED', 'jmed_macro', 6, '2026-09-15 00:00:00', 1
),
(
    'jart_05', 'art_05', 'windshield-decal-bonding',
    'Preparing Windshield Glass for Weatherproof Decal Bonding',
    'Surface chemistry, solvent degreasing, and surviving 55°C Indian summer asphalt heat',
    'A vehicle windscreen in peak Delhi, Ahmedabad, or Nagpur summers regularly achieves surface temperatures exceeding 78°C. Ordinary PVC decals curl, yellow, and lose tack. Here is how VaahanSafe automotive-grade acrylic polymer stickers survive intense solar radiation and monsoon humidity.',
    'MARKDOWN',
    'Placing your optical safety tag requires balancing three factors: optical scan accessibility for passersby, zero obstruction of the driver''s primary sightlines under CMVR Rule 100(2), and permanent weatherproof bonding with cross-linked acrylic polymers.',
    'jcat_guides', 'jaut_editorial', 'PUBLISHED', 'jmed_bonding', 5, '2026-09-14 00:00:00', 1
),
(
    'jart_06', 'art_06', 'optical-contrast-automotive-glazing',
    'Optical Contrast in Automotive Glazing: Why Clean Placement Matters',
    'Managing acoustic PVB plies, ceramic frit dot matrices, and CMVR Rule 100(2) 70% VLT thresholds',
    'Laminated automotive windscreens are optical filters, not simple glass panes. Glare, solar tinting, curvature, and ceramic frit dot matrices degrade camera contrast. Here is the optical engineering behind VaahanSafe high-contrast monochrome decal design and ISO/IEC 18004 Level Q error correction.',
    'MARKDOWN',
    'Automotive glazing is regulated under Central Motor Vehicles Rules (CMVR) Rule 100(2) and AIS-045 standards requiring minimum 70% Visual Light Transmission (VLT). Placing optical tags behind acoustic PVB laminates requires careful contrast calibration.',
    'jcat_qr', 'jaut_editorial', 'PUBLISHED', 'jmed_glazing', 7, '2026-09-12 00:00:00', 1
),
(
    'jart_07', 'art_07', 'roadside-bystander-action-chain',
    'The Roadside Bystander Action Chain: First Steps at a Highway Incident',
    'Perimeter defense, 112 dispatch milestone chainage, emergency contact notification, and trauma triage',
    'When an unexpected collision occurs on an Indian highway, the initial minutes are dominated by confusion. Following this rigorous, step-by-step action chain protects both the responder and the injured motorist.',
    'MARKDOWN',
    'Highway emergency management requires strict procedural discipline. Minute 0 to 3 focuses entirely on scene perimeter defense and reflective triangle deployment before conducting curb-side optical scans and alerting 112 dispatch.',
    'jcat_safety', 'jaut_sharma', 'PUBLISHED', 'jmed_action', 8, '2026-09-10 00:00:00', 1
),
(
    'jart_08', 'art_08', 'dual-layer-identity-architecture',
    'The Dual-Layer Identity: How Physical QR Pairs with Digital Security',
    'Physical sticker state machines, cryptographic proof hashes, and server-side entitlement checks',
    'A QR sticker is inert polymer until authenticated through the dual-layer activation machine. Discover how VaahanSafe separates physical inventory from server-authoritative entitlements.',
    'MARKDOWN',
    'A physical sticker exists in retail inventory before any user owns it. The public QR ID resolves the resolver URL, while the private scratch-off proof activates the service securely on Cloudflare D1.',
    'jcat_product', 'jaut_editorial', 'PUBLISHED', 'jmed_duallayer', 7, '2026-09-08 00:00:00', 1
),
(
    'jart_09', 'art_09', 'edge-routing-emergency-alerts',
    'VaahanSafe Platform Update: Cloudflare Edge Routing & Zero-Exposure Bystander Alerts',
    'Sub-50ms latency response across Indian telecom circles via Cloudflare Workers and Queues',
    'How VaahanSafe uses Cloudflare Workers, D1 read-replication, and regional telephony gateways to connect roadside bystanders with vehicle owners in under 2 seconds without exposing real phone numbers.',
    'MARKDOWN',
    'Roadside emergencies tolerate zero latency. By deploying edge routing logic across 12 Indian data centers (BOM, DEL, BLR, MAA, HYD, CCU), bystander scans resolve in under 45 milliseconds.',
    'jcat_updates', 'jaut_editorial', 'PUBLISHED', 'jmed_edgeroute', 5, '2026-09-05 00:00:00', 1
);

-- 6. Article Tags Mapping (N:M)
INSERT OR IGNORE INTO journal_article_tags (article_id, tag_id) VALUES
('jart_01', 'jtag_safety'), ('jart_01', 'jtag_privacy'), ('jart_01', 'jtag_compliance'),
('jart_02', 'jtag_emergency'), ('jart_02', 'jtag_telephony'), ('jart_02', 'jtag_safety'),
('jart_03', 'jtag_samaritan'), ('jart_03', 'jtag_safety'), ('jart_03', 'jtag_compliance'),
('jart_04', 'jtag_privacy'), ('jart_04', 'jtag_compliance'), ('jart_04', 'jtag_qr'),
('jart_05', 'jtag_hardware'), ('jart_05', 'jtag_materials'), ('jart_05', 'jtag_safety'),
('jart_06', 'jtag_optics'), ('jart_06', 'jtag_cmvr'), ('jart_06', 'jtag_qr'),
('jart_07', 'jtag_firstaid'), ('jart_07', 'jtag_safety'), ('jart_07', 'jtag_emergency'),
('jart_08', 'jtag_qr'), ('jart_08', 'jtag_hardware'), ('jart_08', 'jtag_privacy'),
('jart_09', 'jtag_emergency'), ('jart_09', 'jtag_telephony'), ('jart_09', 'jtag_compliance');

-- 7. Revisions for Initial Articles
INSERT OR IGNORE INTO journal_article_revisions (id, article_id, revision_number, title_snapshot, excerpt_snapshot, content_snapshot, editor_id, change_summary) VALUES
('jrev_01_1', 'jart_01', 1, 'What Information Should Your Vehicle Make Available When It Matters?', 'A vehicle is visible to everyone on the road...', 'A vehicle exists in public space...', 'jaut_editorial', 'Initial published version'),
('jrev_02_1', 'jart_02', 1, 'How Emergency Contacts Receive and Respond to Decal Relays', 'When a bystander scans your QR, who answers?...', 'In critical roadside scenarios...', 'jaut_editorial', 'Initial published version'),
('jrev_03_1', 'jart_03', 1, 'Good Samaritan Law in India: Legal Protection for Roadside Helpers', 'Indian law explicitly shields bystanders...', 'Section 134A of the Motor Vehicles Act...', 'jaut_editorial', 'Initial published version'),
('jrev_04_1', 'jart_04', 1, 'Separating Contact Channels from Residential Addresses', 'Every public resolver URL leads to a dynamic projection layer...', 'The fundamental flaw of traditional engraved...', 'jaut_editorial', 'Initial published version'),
('jrev_05_1', 'jart_05', 1, 'Preparing Windshield Glass for Weatherproof Decal Bonding', 'A complete photographic guide to placing your VaahanSafe QR tag...', 'Placing your optical safety tag requires...', 'jaut_editorial', 'Initial published version'),
('jrev_06_1', 'jart_06', 1, 'Optical Contrast in Automotive Glazing: Why Clean Placement Matters', 'Laminated automotive windscreens are optical filters...', 'Automotive glazing is regulated under CMVR Rule 100(2)...', 'jaut_editorial', 'Initial published version'),
('jrev_07_1', 'jart_07', 1, 'The Roadside Bystander Action Chain: First Steps at a Highway Incident', 'When an unexpected collision occurs on an Indian highway...', 'Highway emergency management requires strict procedural discipline...', 'jaut_editorial', 'Initial published version'),
('jrev_08_1', 'jart_08', 1, 'The Dual-Layer Identity: How Physical QR Pairs with Digital Security', 'A QR sticker is inert polymer until authenticated...', 'A physical sticker exists in retail inventory...', 'jaut_editorial', 'Initial published version'),
('jrev_09_1', 'jart_09', 1, 'VaahanSafe Platform Update: Cloudflare Edge Routing & Zero-Exposure Bystander Alerts', 'How VaahanSafe uses Cloudflare Workers...', 'Roadside emergencies tolerate zero latency...', 'jaut_editorial', 'Initial published version');

-- 8. Slug History (301 Redirection Preservation)
INSERT OR IGNORE INTO journal_article_slug_history (id, article_id, old_slug) VALUES
('jslg_01', 'jart_05', 'qr-placement-guide');

-- 9. Placements for Homepage Editorial Grid
INSERT OR IGNORE INTO journal_placements (id, slot, article_id, priority) VALUES
('jplc_hero', 'HERO', 'jart_01', 10),
('jplc_lead', 'LEAD', 'jart_02', 20),
('jplc_secondary', 'SECONDARY', 'jart_03', 30),
('jplc_dark', 'DARK_CHAPTER', 'jart_04', 40),
('jplc_spotlight', 'PRIVACY_SPOTLIGHT', 'jart_04', 50),
('jplc_guide', 'GUIDE_FEATURE', 'jart_05', 60),
('jplc_idx_01', 'LATEST_INDEX', 'jart_06', 70),
('jplc_idx_02', 'LATEST_INDEX', 'jart_07', 80),
('jplc_idx_03', 'LATEST_INDEX', 'jart_08', 90),
('jplc_idx_04', 'LATEST_INDEX', 'jart_09', 100);
