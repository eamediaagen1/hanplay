-- ============================================================
-- Hanplay – Migration 013: Brand asset management
-- Run this in: Supabase Dashboard → SQL Editor
-- Safe to re-run (uses IF NOT EXISTS / ON CONFLICT DO NOTHING)
-- ============================================================

CREATE TABLE IF NOT EXISTS brand_assets (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_type   TEXT        NOT NULL,   -- 'logo' | 'favicon'
  variant      TEXT        NOT NULL DEFAULT 'default',  -- 'default' | 'light' | 'dark'
  storage_path TEXT        NOT NULL,   -- path inside the brand-assets bucket
  file_url     TEXT        NOT NULL,   -- public URL
  width        INTEGER,
  height       INTEGER,
  is_active    BOOLEAN     NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (asset_type, variant)         -- one active asset per type+variant
);

ALTER TABLE brand_assets ENABLE ROW LEVEL SECURITY;

-- Anyone can read active brand assets (needed for public pages + app shell)
DROP POLICY IF EXISTS "public_read_brand_assets" ON brand_assets;
CREATE POLICY "public_read_brand_assets" ON brand_assets
  FOR SELECT USING (is_active = true);

-- Only service role (admin API) can write
DROP POLICY IF EXISTS "service_role_write_brand_assets" ON brand_assets;
CREATE POLICY "service_role_write_brand_assets" ON brand_assets
  FOR ALL USING (auth.role() = 'service_role');
