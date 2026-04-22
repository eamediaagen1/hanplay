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

const MIGRATION_014_SQL = `
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS license_key TEXT;
CREATE INDEX IF NOT EXISTS purchases_license_key_idx ON purchases (license_key) WHERE license_key IS NOT NULL;
UPDATE purchases SET license_key = raw_payload->>'license_key' WHERE license_key IS NULL AND raw_payload IS NOT NULL AND raw_payload->>'license_key' IS NOT NULL;
`;

const MIGRATION_015_SQL = `
CREATE TABLE IF NOT EXISTS user_onboarding (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  acquisition_source TEXT,
  age                SMALLINT,
  country            TEXT,
  submitted_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);
ALTER TABLE user_onboarding ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_manage_own_onboarding" ON user_onboarding;
CREATE POLICY "users_manage_own_onboarding" ON user_onboarding
  FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS user_onboarding_user_id_idx ON user_onboarding (user_id);
`;

const MIGRATION_016_SQL = `
CREATE TABLE IF NOT EXISTS vocabulary (
  id             TEXT        PRIMARY KEY,
  hsk_level      SMALLINT    NOT NULL CHECK (hsk_level BETWEEN 1 AND 6),
  sort_order     INTEGER     NOT NULL DEFAULT 0,
  hanzi          TEXT        NOT NULL,
  pinyin         TEXT        NOT NULL,
  meaning        TEXT        NOT NULL,
  meaning_short  TEXT,
  word_type      TEXT        NOT NULL DEFAULT 'other',
  word_types     TEXT[]      NOT NULL DEFAULT '{}',
  topic_category TEXT,
  image_url      TEXT        NOT NULL DEFAULT '',
  image_alt      TEXT        NOT NULL DEFAULT '',
  is_active      BOOLEAN     NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  search_vector  TSVECTOR
);

CREATE INDEX IF NOT EXISTS vocab_level_order_idx
  ON vocabulary (hsk_level, sort_order)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS vocab_word_type_idx
  ON vocabulary (hsk_level, word_type)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS vocab_topic_category_idx
  ON vocabulary (hsk_level, topic_category)
  WHERE is_active = true AND topic_category IS NOT NULL;

CREATE INDEX IF NOT EXISTS vocab_search_vector_idx
  ON vocabulary USING GIN (search_vector);

CREATE OR REPLACE FUNCTION vocabulary_search_update()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', coalesce(NEW.hanzi,   '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.pinyin,  '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.meaning, '')), 'C');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS vocabulary_search_trigger ON vocabulary;
CREATE TRIGGER vocabulary_search_trigger
  BEFORE INSERT OR UPDATE ON vocabulary
  FOR EACH ROW EXECUTE FUNCTION vocabulary_search_update();

ALTER TABLE vocabulary ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_vocabulary" ON vocabulary;
CREATE POLICY "public_read_vocabulary" ON vocabulary
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "service_write_vocabulary" ON vocabulary;
CREATE POLICY "service_write_vocabulary" ON vocabulary
  FOR ALL USING (true) WITH CHECK (true);
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

export async function runMigration015IfNeeded(): Promise<{ ran: boolean; note: string }> {
  const supabaseUrl = process.env.SUPABASE_URL ?? "";
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const ok = await tryPgQuery(supabaseUrl, serviceKey, MIGRATION_015_SQL);
  if (ok) {
    logger.info("Migration 015 applied automatically ✓");
    return { ran: true, note: "Migration 015 (user_onboarding) applied" };
  }
  logger.warn("Auto-migration 015 failed — run in Supabase SQL Editor: CREATE TABLE IF NOT EXISTS user_onboarding (...)");
  return { ran: false, note: "Auto-migration 015 failed." };
}

export async function runMigration014IfNeeded(): Promise<{ ran: boolean; note: string }> {
  const supabaseUrl = process.env.SUPABASE_URL ?? "";
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const ok = await tryPgQuery(supabaseUrl, serviceKey, MIGRATION_014_SQL);
  if (ok) {
    logger.info("Migration 014 applied automatically ✓");
    return { ran: true, note: "Migration 014 (purchases.license_key) applied" };
  }
  logger.warn("Auto-migration 014 failed — run in Supabase SQL Editor: ALTER TABLE purchases ADD COLUMN IF NOT EXISTS license_key TEXT;");
  return { ran: false, note: "Auto-migration 014 failed." };
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

export async function runMigration016IfNeeded(): Promise<{ ran: boolean; note: string }> {
  const { error } = await supabaseAdmin
    .from("vocabulary")
    .select("id")
    .limit(0);

  if (!error) {
    return { ran: false, note: "vocabulary table already exists" };
  }

  const isMissing =
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    (error.message ?? "").toLowerCase().includes("does not exist") ||
    (error.message ?? "").toLowerCase().includes("schema cache");

  if (!isMissing) {
    logger.warn(
      { code: error.code, msg: error.message },
      "Unexpected error checking vocabulary table — treating as missing and attempting migration"
    );
  }

  logger.warn("vocabulary table missing — attempting auto-migration 016...");

  const supabaseUrl = process.env.SUPABASE_URL ?? "";
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  const ok = await tryPgQuery(supabaseUrl, serviceKey, MIGRATION_016_SQL);

  if (ok) {
    logger.info("Migration 016 (vocabulary) applied automatically ✓");
    return { ran: true, note: "Migration 016 applied via pg/query — run POST /api/admin/seed-vocabulary to populate words" };
  }

  logger.warn(
    "Auto-migration 016 failed — please run the vocabulary CREATE TABLE SQL in Supabase SQL Editor, then POST /api/admin/seed-vocabulary"
  );
  return {
    ran: false,
    note: "Auto-migration 016 failed. Run CREATE TABLE vocabulary ... in Supabase SQL Editor.",
  };
}
