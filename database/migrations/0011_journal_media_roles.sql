-- Migration: 0011_journal_media_roles.sql
-- Description: Explicit Article-Media Roles Junction Table & Media De-duplication
-- Platform: Cloudflare D1 (SQLite Dialect)

-- ------------------------------------------------------------------------------
-- 1. Journal Article Media Junction Table (Explicit Roles: HERO, THUMBNAIL, OG, INLINE, DIAGRAM)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS journal_article_media (
    id TEXT PRIMARY KEY,
    article_id TEXT NOT NULL REFERENCES journal_articles(id) ON DELETE CASCADE,
    media_id TEXT NOT NULL REFERENCES journal_media(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('HERO', 'THUMBNAIL', 'OG', 'INLINE', 'DIAGRAM')),
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(article_id, role, display_order)
);

CREATE INDEX IF NOT EXISTS idx_journal_art_media_art ON journal_article_media(article_id, role);
CREATE INDEX IF NOT EXISTS idx_journal_art_media_med ON journal_article_media(media_id);

-- ------------------------------------------------------------------------------
-- 2. De-duplicate Seed Articles: Correct jart_03 to have its own unique media
-- ------------------------------------------------------------------------------
UPDATE journal_articles 
SET featured_media_id = 'jmed_vertical' 
WHERE id = 'jart_03' AND featured_media_id = 'jmed_hero';

-- ------------------------------------------------------------------------------
-- 3. Populate Explicit Role Mappings for Published Articles
-- ------------------------------------------------------------------------------
INSERT OR IGNORE INTO journal_article_media (id, article_id, media_id, role, display_order) VALUES
-- Article 01: vehicle-qr-privacy-boundary
('jam_01_hero', 'jart_01', 'jmed_hero', 'HERO', 0),
('jam_01_thumb', 'jart_01', 'jmed_hero', 'THUMBNAIL', 0),
('jam_01_og', 'jart_01', 'jmed_hero', 'OG', 0),

-- Article 02: emergency-contact-relays
('jam_02_hero', 'jart_02', 'jmed_lead', 'HERO', 0),
('jam_02_thumb', 'jart_02', 'jmed_lead', 'THUMBNAIL', 0),
('jam_02_og', 'jart_02', 'jmed_lead', 'OG', 0),

-- Article 03: good-samaritan-law-india (unique jmed_vertical)
('jam_03_hero', 'jart_03', 'jmed_vertical', 'HERO', 0),
('jam_03_thumb', 'jart_03', 'jmed_vertical', 'THUMBNAIL', 0),
('jam_03_og', 'jart_03', 'jmed_vertical', 'OG', 0),

-- Article 04: separating-contacts-from-address
('jam_04_hero', 'jart_04', 'jmed_macro', 'HERO', 0),
('jam_04_thumb', 'jart_04', 'jmed_macro', 'THUMBNAIL', 0),
('jam_04_og', 'jart_04', 'jmed_macro', 'OG', 0),

-- Article 05: windshield-decal-bonding
('jam_05_hero', 'jart_05', 'jmed_bonding', 'HERO', 0),
('jam_05_thumb', 'jart_05', 'jmed_bonding', 'THUMBNAIL', 0),
('jam_05_og', 'jart_05', 'jmed_bonding', 'OG', 0),

-- Article 06: optical-contrast-automotive-glazing
('jam_06_hero', 'jart_06', 'jmed_glazing', 'HERO', 0),
('jam_06_thumb', 'jart_06', 'jmed_glazing', 'THUMBNAIL', 0),
('jam_06_og', 'jart_06', 'jmed_glazing', 'OG', 0),

-- Article 07: roadside-bystander-action-chain
('jam_07_hero', 'jart_07', 'jmed_action', 'HERO', 0),
('jam_07_thumb', 'jart_07', 'jmed_action', 'THUMBNAIL', 0),
('jam_07_og', 'jart_07', 'jmed_action', 'OG', 0),

-- Article 08: dual-layer-identity-architecture
('jam_08_hero', 'jart_08', 'jmed_duallayer', 'HERO', 0),
('jam_08_thumb', 'jart_08', 'jmed_duallayer', 'THUMBNAIL', 0),
('jam_08_og', 'jart_08', 'jmed_duallayer', 'OG', 0),

-- Article 09: edge-routing-emergency-alerts
('jam_09_hero', 'jart_09', 'jmed_edgeroute', 'HERO', 0),
('jam_09_thumb', 'jart_09', 'jmed_edgeroute', 'THUMBNAIL', 0),
('jam_09_og', 'jart_09', 'jmed_edgeroute', 'OG', 0);
