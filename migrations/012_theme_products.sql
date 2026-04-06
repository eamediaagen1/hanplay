-- ============================================================
-- HSK Trainer – Migration 012: Chinese Themes product catalog
-- Run this in: Supabase Dashboard → SQL Editor
-- Safe to re-run (uses IF NOT EXISTS / ON CONFLICT)
-- ============================================================

CREATE TABLE IF NOT EXISTS theme_products (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title             TEXT        NOT NULL,
  slug              TEXT        NOT NULL,
  category          TEXT        NOT NULL,
  description       TEXT,
  cover_image_url   TEXT,
  preview_image_url TEXT,
  file_url          TEXT,
  file_type         TEXT,
  download_name     TEXT,
  is_premium        BOOLEAN     NOT NULL DEFAULT true,
  is_published      BOOLEAN     NOT NULL DEFAULT false,
  sort_order        INTEGER     NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (slug)
);

ALTER TABLE theme_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone_read_published" ON theme_products;
CREATE POLICY "anyone_read_published" ON theme_products
  FOR SELECT USING (is_published = true);

CREATE INDEX IF NOT EXISTS theme_products_category_idx
  ON theme_products (category);

CREATE INDEX IF NOT EXISTS theme_products_published_idx
  ON theme_products (is_published, sort_order);
