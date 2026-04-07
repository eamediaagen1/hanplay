import { supabaseAdmin } from "./supabase.js";
import { logger } from "./logger.js";

const MIGRATION_006_SQL = `
CREATE TABLE IF NOT EXISTS level_progress (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  level        INTEGER     NOT NULL CHECK (level BETWEEN 1 AND 6),
  exam_passed  BOOLEAN     NOT NULL DEFAULT false,
  exam_score   INTEGER,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, level)
);

ALTER TABLE level_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_manage_own_level_progress" ON level_progress;
CREATE POLICY "users_manage_own_level_progress" ON level_progress
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS level_progress_user_id_idx ON public.level_progress (user_id);
CREATE INDEX IF NOT EXISTS level_progress_level_idx   ON public.level_progress (user_id, level);
`;

const MIGRATION_007_SQL = `
CREATE TABLE IF NOT EXISTS flashcard_positions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  level        INTEGER     NOT NULL CHECK (level BETWEEN 1 AND 6),
  category     TEXT,
  last_index   INTEGER     NOT NULL DEFAULT 0,
  last_word_id TEXT,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, level)
);

ALTER TABLE flashcard_positions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_manage_own_flashcard_positions" ON flashcard_positions;
CREATE POLICY "users_manage_own_flashcard_positions" ON flashcard_positions
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS flashcard_positions_user_level_idx
  ON flashcard_positions (user_id, level);

CREATE INDEX IF NOT EXISTS flashcard_positions_updated_at_idx
  ON flashcard_positions (user_id, updated_at DESC);
`;

const MIGRATION_013_SQL = `
CREATE TABLE IF NOT EXISTS brand_assets (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_type   TEXT        NOT NULL,
  variant      TEXT        NOT NULL DEFAULT 'default',
  storage_path TEXT        NOT NULL,
  file_url     TEXT        NOT NULL,
  width        INTEGER,
  height       INTEGER,
  is_active    BOOLEAN     NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (asset_type, variant)
);

ALTER TABLE brand_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_brand_assets" ON brand_assets;
CREATE POLICY "public_read_brand_assets" ON brand_assets
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "service_role_write_brand_assets" ON brand_assets;
CREATE POLICY "service_role_write_brand_assets" ON brand_assets
  FOR ALL USING (auth.role() = 'service_role');
`;

const MIGRATION_012_SQL = `
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

CREATE INDEX IF NOT EXISTS theme_products_category_idx ON theme_products (category);
CREATE INDEX IF NOT EXISTS theme_products_published_idx ON theme_products (is_published, sort_order);
`;

export const MIGRATION_006_SQL_EXPORT = MIGRATION_006_SQL;

async function tryPgQuery(supabaseUrl: string, serviceKey: string, sql: string): Promise<boolean> {
  try {
    const response = await fetch(`${supabaseUrl}/pg/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serviceKey}`,
        "apikey": serviceKey,
      },
      body: JSON.stringify({ query: sql }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function runMigration006IfNeeded(): Promise<{ ran: boolean; note: string }> {
  const { error } = await supabaseAdmin
    .from("level_progress")
    .select("id")
    .limit(0);

  if (!error) {
    return { ran: false, note: "level_progress table already exists" };
  }

  const isMissing =
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    (error.message ?? "").toLowerCase().includes("does not exist") ||
    (error.message ?? "").toLowerCase().includes("schema cache");

  if (!isMissing) {
    logger.warn(
      { code: error.code, msg: error.message },
      "Unexpected error checking level_progress table — treating as missing and attempting migration"
    );
  }

  logger.warn("level_progress table missing — attempting auto-migration 006...");

  const supabaseUrl = process.env.SUPABASE_URL ?? "";
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  const ok = await tryPgQuery(supabaseUrl, serviceKey, MIGRATION_006_SQL);

  if (ok) {
    logger.info("Migration 006 applied automatically ✓");
    return { ran: true, note: "Migration 006 applied via pg/query" };
  }

  logger.warn(
    "Auto-migration 006 failed — please run migrations/006_level_progress.sql in Supabase SQL Editor"
  );
  return {
    ran: false,
    note: "Auto-migration failed. Run migrations/006_level_progress.sql manually in Supabase SQL Editor.",
  };
}

export async function runMigration007IfNeeded(): Promise<{ ran: boolean; note: string }> {
  const { error } = await supabaseAdmin
    .from("flashcard_positions")
    .select("id")
    .limit(0);

  if (!error) {
    return { ran: false, note: "flashcard_positions table already exists" };
  }

  const isMissing =
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    (error.message ?? "").toLowerCase().includes("does not exist") ||
    (error.message ?? "").toLowerCase().includes("schema cache");

  if (!isMissing) {
    logger.warn(
      { code: error.code, msg: error.message },
      "Unexpected error checking flashcard_positions table — treating as missing"
    );
  }

  logger.warn("flashcard_positions table missing — attempting auto-migration 007...");

  const supabaseUrl = process.env.SUPABASE_URL ?? "";
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  const ok = await tryPgQuery(supabaseUrl, serviceKey, MIGRATION_007_SQL);

  if (ok) {
    logger.info("Migration 007 applied automatically ✓");
    return { ran: true, note: "Migration 007 applied via pg/query" };
  }

  logger.warn(
    "Auto-migration 007 failed — please run migrations/007_flashcard_resume.sql in Supabase SQL Editor"
  );
  return {
    ran: false,
    note: "Auto-migration failed. Run migrations/007_flashcard_resume.sql manually in Supabase SQL Editor.",
  };
}

export async function runMigration012IfNeeded(): Promise<{ ran: boolean; note: string }> {
  const { error } = await supabaseAdmin
    .from("theme_products")
    .select("id")
    .limit(0);

  if (!error) {
    return { ran: false, note: "theme_products table already exists" };
  }

  const isMissing =
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    (error.message ?? "").toLowerCase().includes("does not exist") ||
    (error.message ?? "").toLowerCase().includes("schema cache");

  if (!isMissing) {
    logger.warn(
      { code: error.code, msg: error.message },
      "Unexpected error checking theme_products table — treating as missing"
    );
  }

  logger.warn("theme_products table missing — attempting auto-migration 012...");

  const supabaseUrl = process.env.SUPABASE_URL ?? "";
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  const ok = await tryPgQuery(supabaseUrl, serviceKey, MIGRATION_012_SQL);

  if (ok) {
    logger.info("Migration 012 applied automatically ✓");
    return { ran: true, note: "Migration 012 applied via pg/query" };
  }

  logger.warn(
    "Auto-migration 012 failed — please run migrations/012_theme_products.sql in Supabase SQL Editor"
  );
  return {
    ran: false,
    note: "Auto-migration failed. Run migrations/012_theme_products.sql manually in Supabase SQL Editor.",
  };
}

export async function runMigration013IfNeeded(): Promise<{ ran: boolean; note: string }> {
  const { error } = await supabaseAdmin
    .from("brand_assets")
    .select("id")
    .limit(0);

  if (!error) {
    return { ran: false, note: "brand_assets table already exists" };
  }

  const isMissing =
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    (error.message ?? "").toLowerCase().includes("does not exist") ||
    (error.message ?? "").toLowerCase().includes("schema cache");

  if (!isMissing) {
    logger.warn(
      { code: error.code, msg: error.message },
      "Unexpected error checking brand_assets table — treating as missing"
    );
  }

  logger.warn("brand_assets table missing — attempting auto-migration 013...");

  const supabaseUrl = process.env.SUPABASE_URL ?? "";
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  const ok = await tryPgQuery(supabaseUrl, serviceKey, MIGRATION_013_SQL);

  if (ok) {
    logger.info("Migration 013 applied automatically ✓");
    return { ran: true, note: "Migration 013 applied via pg/query" };
  }

  logger.warn(
    "Auto-migration 013 failed — please run migrations/013_brand_assets.sql in Supabase SQL Editor"
  );
  return {
    ran: false,
    note: "Auto-migration failed. Run migrations/013_brand_assets.sql manually in Supabase SQL Editor.",
  };
}
