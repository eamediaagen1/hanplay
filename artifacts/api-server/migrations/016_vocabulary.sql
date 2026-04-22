-- Migration 016: vocabulary table (production schema)
-- Run in: Supabase Dashboard → SQL Editor
-- After running, seed via: POST /api/admin/seed-vocabulary  (or import CSV)
--
-- ID contract:
--   Existing HSK1 words (hsk1-g1 … hsk1-d12) — preserved exactly from hskData.ts
--   New words from CSV — hsk{N}-{4-digit-sort-order}, e.g. hsk2-0001
--   IDs are stable: re-running the CSV import produces the same IDs every time.
--
-- Frontend field mapping (handled in vocabularyService.ts, zero frontend changes):
--   DB: hanzi      → API: word
--   DB: word_type  → API: category  (or topic_category when set)
--   DB: meaning    → API: meaning

CREATE TABLE IF NOT EXISTS vocabulary (
  -- Identity
  id            TEXT        PRIMARY KEY,
  hsk_level     SMALLINT    NOT NULL CHECK (hsk_level BETWEEN 1 AND 6),
  sort_order    INTEGER     NOT NULL DEFAULT 0,

  -- Core content
  hanzi         TEXT        NOT NULL,
  pinyin        TEXT        NOT NULL,
  meaning       TEXT        NOT NULL,
  meaning_short TEXT,                             -- ≤20 char display label (flashcard front)

  -- Grammar classification
  word_type     TEXT        NOT NULL DEFAULT 'other',   -- primary lowercase: noun/verb/adjective…
  word_types    TEXT[]      NOT NULL DEFAULT '{}',      -- all types, e.g. {noun,verb}

  -- Semantic grouping (populated for curated content; NULL for raw CSV import)
  topic_category TEXT,                            -- e.g. Greetings, Food, Travel

  -- Media
  image_url     TEXT        NOT NULL DEFAULT '',
  image_alt     TEXT        NOT NULL DEFAULT '',

  -- Control
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Full-text search (populated by trigger below)
  search_vector TSVECTOR
);

-- ── Indexes ──────────────────────────────────────────────────────────────────

-- Primary browsing: level list, ordered
CREATE INDEX IF NOT EXISTS vocab_level_order_idx
  ON vocabulary (hsk_level, sort_order)
  WHERE is_active = true;

-- Grammar-type filter (e.g. show only verbs)
CREATE INDEX IF NOT EXISTS vocab_word_type_idx
  ON vocabulary (hsk_level, word_type)
  WHERE is_active = true;

-- Semantic category filter (Greetings, Food …)
CREATE INDEX IF NOT EXISTS vocab_topic_category_idx
  ON vocabulary (hsk_level, topic_category)
  WHERE is_active = true AND topic_category IS NOT NULL;

-- Full-text search
CREATE INDEX IF NOT EXISTS vocab_search_vector_idx
  ON vocabulary USING GIN (search_vector);

-- ── Search vector trigger ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION vocabulary_search_update()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
      setweight(to_tsvector('simple', coalesce(NEW.hanzi, '')),   'A') ||
      setweight(to_tsvector('simple', coalesce(NEW.pinyin, '')),  'B') ||
      setweight(to_tsvector('simple', coalesce(NEW.meaning, '')), 'C');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS vocabulary_search_trigger ON vocabulary;
CREATE TRIGGER vocabulary_search_trigger
  BEFORE INSERT OR UPDATE ON vocabulary
  FOR EACH ROW EXECUTE FUNCTION vocabulary_search_update();

-- ── Row-Level Security ────────────────────────────────────────────────────────

ALTER TABLE vocabulary ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_vocabulary" ON vocabulary;
CREATE POLICY "public_read_vocabulary" ON vocabulary
  FOR SELECT USING (is_active = true);

-- Service role can write (used by seed/import endpoints)
DROP POLICY IF EXISTS "service_write_vocabulary" ON vocabulary;
CREATE POLICY "service_write_vocabulary" ON vocabulary
  FOR ALL USING (true) WITH CHECK (true);
